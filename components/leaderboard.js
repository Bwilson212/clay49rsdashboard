import React, { useState, useEffect } from 'react';
import { fetchPlayers, fetchGamePlayers } from '../utils/api';

/**
 * @component Leaderboard
 * @description Displays a sortable table of player statistics with filtering
 * @param {Object} props - Component props
 * @param {Function} props.onSelectPlayer - Callback function triggered when a player is selected
 * @param {number|null} props.selectedPlayerId - ID of the currently selected player
 * @param {Object|null} props.selectedGame - Currently selected game object containing game details
 * @returns {JSX.Element} A sortable and filterable leaderboard component
 */

export default function Leaderboard({ onSelectPlayer, selectedPlayerId, selectedGame }) {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredPlayer, setHoveredPlayer] = useState(null);
  const [sortField, setSortField] = useState('seasonRank');  // default sorting is season
  const [sortDirection, setSortDirection] = useState('asc');
  const [gameStats, setGameStats] = useState([]);
  
  // state for filtering bar
  const [filters, setFilters] = useState({
    position: '',
    minTouchdowns: 0,
    minYards: 0,
    searchName: '',
    minTackles: 0
  });

///////////////////////////////////////////////////////////////////////
// Below is the javascript functionality for the leaderboard component
// JSX/UI can be found at the bottom of the file
///////////////////////////////////////////////////////////////////////

  // Filtering and removing players from table based on filters
  useEffect(() => {
    window.setLeaderboardFilter = (filterName, value) => {
      setFilters(prevFilters => {
        const newFilters = { ...prevFilters, [filterName]: value };
        applyFilters(players, newFilters);
        return newFilters;
      });
    };
    
    // Filter reset functionality
    window.resetLeaderboardFilters = () => {
      setFilters({
        position: '',
        minTouchdowns: 0,
        minYards: 0,
        searchName: '',
        minTackles: 0
      });
      setFilteredPlayers(players);
    };
    
    // Function that gets current players shown on the table and exports them as a csv
    window.getCurrentPlayers = () => {
      // Make sure we're returning players with ranks
      const sortedPlayersWithRanks = ensurePlayerRanks(sortPlayers(filteredPlayers));
      return sortedPlayersWithRanks;
    };
    
    // Cleaning window states
    return () => {
      window.setLeaderboardFilter = undefined;
      window.resetLeaderboardFilters = undefined;
      window.getCurrentPlayers = undefined;
    };
  }, [players, filteredPlayers]); 

  // Replace the first useEffect with this:
  useEffect(() => {
    setLoading(true);
    
    // abstracting api fetch to the api utility file, keeps code secure
    fetchPlayers()
      .then((data) => {
        console.log("Received players:", data.length);
        
        // We have an issue with duplicate players so map removes them
        const uniquePlayers = [];
        const playerIdMap = new Map();
        
        if (Array.isArray(data)) {
          data.forEach(player => {
            if (player.id && !playerIdMap.has(player.id)) {
              playerIdMap.set(player.id, true);
              uniquePlayers.push(player);
            }
          });
        }
        
        // Ranked players get sent to the table
        const playersWithRanks = ensurePlayerRanks(uniquePlayers);
        
        setPlayers(playersWithRanks);
        setFilteredPlayers(playersWithRanks);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching players:", error);
        setPlayers([]);
        setFilteredPlayers([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedGame) {
      setLoading(true);
      // Fetch a new data instance for each selected game
      fetchGamePlayers(selectedGame.id)
        .then((data) => {         
          if (data.error) {
            throw new Error(data.error);
          }
          
          // Duplicate data removal again
          const uniquePlayers = [];
          const playerIdMap = new Map();
          
          if (Array.isArray(data)) {
            data.forEach(player => {
              if (player.id && !playerIdMap.has(player.id)) {
                playerIdMap.set(player.id, true);
                uniquePlayers.push(player);
              }
            });
          }
          
          // Make sure the players have ranks
          const playersWithRanks = ensurePlayerRanks(uniquePlayers);
          
          setGameStats(playersWithRanks);
          
          // CRITICAL FIX: Apply filters to the new game data and update filtered players
          if (Object.values(filters).some(val => val !== '' && val !== 0)) {
            applyFilters(playersWithRanks, filters);
          } else {
            setFilteredPlayers(playersWithRanks);
          }
          
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching game player data:", error);
          setLoading(false);
          
          // On error, revert to season stats
          if (Object.values(filters).some(val => val !== '' && val !== 0)) {
            applyFilters(players, filters);
          } else {
          setFilteredPlayers(players);
          }
        });
    } else if (players.length > 0) {
      // If no game is selected, revert to season stats
      if (Object.values(filters).some(val => val !== '' && val !== 0)) {
        applyFilters(players, filters);
      } else {
        setFilteredPlayers(players);
      }
    }
  }, [selectedGame, players, filters]);

    /**
   * @function applyFilters
   * @description Filters the player list based on specified criteria
   * @param {Array} playerList - The array of players to filter
   * @param {Object} [currentFilters=filters] - Filter criteria to apply
   * @param {string} [currentFilters.position] - Position filter
   * @param {number} [currentFilters.minTouchdowns] - Minimum touchdowns filter
   * @param {number} [currentFilters.minYards] - Minimum yards filter
   * @param {number} [currentFilters.minTackles] - Minimum tackles filter
   * @param {string} [currentFilters.searchName] - Player name search string
   */
  const applyFilters = (playerList, currentFilters = filters) => {
    // Use the correct source list - FIXED: always use the source list passed in
    const sourceList = playerList;
    let result = [...sourceList];
    let activeFiltersText = '';
    
    // Apply position filter
    if (currentFilters.position) {
      result = result.filter(player => {
        // Use getRealisticPosition to ensure consistent position values
        const playerPosition = getRealisticPosition(player);
        return playerPosition === currentFilters.position;
      });
      activeFiltersText += `Position: ${currentFilters.position} • `;
    }
    
    // Apply minimum touchdowns filter
    if (currentFilters.minTouchdowns > 0) {
      result = result.filter(player => {
        const touchdowns = parseInt(player.touchdowns) || 0;
        return touchdowns >= currentFilters.minTouchdowns;
      });
      activeFiltersText += `Min TD: ${currentFilters.minTouchdowns} • `;
    }
    
    // Apply minimum yards filter
    if (currentFilters.minYards > 0) {
      result = result.filter(player => {
        const yards = parseInt(player.yards) || 0;
        return yards >= currentFilters.minYards;
      });
      activeFiltersText += `Min YD: ${currentFilters.minYards} • `;
    }
    
    // Apply minimum tackles filter
    if (currentFilters.minTackles > 0) {
      result = result.filter(player => {
        const tackles = parseInt(player.tackles) || 0;
        return tackles >= currentFilters.minTackles;
      });
      activeFiltersText += `Min TKL: ${currentFilters.minTackles} • `;
    }
    
    // Apply name search
    if (currentFilters.searchName) {
      const searchTerm = currentFilters.searchName.toLowerCase();
      result = result.filter(player => {
        const playerName = getPlayerName(player, 0).toLowerCase();
        return playerName.includes(searchTerm);
      });
      activeFiltersText += `Search: "${currentFilters.searchName}" • `;
    }
    
    // Update active filters indicator in the UI
    if (activeFiltersText) {
      // Remove the trailing bullet point and space
      activeFiltersText = activeFiltersText.slice(0, -3);
      // Add the count of filtered players
      activeFiltersText += ` (${result.length} players)`;
      
      // Update the indicator element
      const indicator = document.getElementById('active-filters-indicator');
      if (indicator) {
        indicator.textContent = activeFiltersText;
      }
    } else {
      // Clear the indicator if no filters
      const indicator = document.getElementById('active-filters-indicator');
      if (indicator) {
        indicator.textContent = '';
      }
    }
    
    setFilteredPlayers(result);
    return result; // Return the filtered results for immediate use if needed
  };

  /**
   * @function ensurePlayerRanks
   * @description Ensures player ranks are calculated and added to the player objects
   * @param {Array} players - The array of players to ensure ranks for
   * @returns {Array} The players with calculated ranks
   */
  const ensurePlayerRanks = (players) => {
    // First deduplicate the input to avoid unnecessary processing
    const uniqueIdMap = new Map();
    const uniquePlayers = [];
    
    players.forEach(player => {
      if (player.id && !uniqueIdMap.has(player.id)) {
        uniqueIdMap.set(player.id, true);
        uniquePlayers.push(player);
      }
    });
    
    const playersWithRanks = [...uniquePlayers];
    
    const needsRanks = playersWithRanks.some(player => 
      player.seasonRank === undefined || player.gameRank === undefined
    );
    
    if (needsRanks) {
      console.log("Calculating missing ranks for players");
      
      // Create a copy for season rank sorting
      const seasonRankPlayers = [...playersWithRanks];
      
      // Sort by a combined score for season rank (more touchdowns and yards = better rank)
      seasonRankPlayers.sort((a, b) => {
        const scoreA = (parseInt(a.touchdowns) || 0) * 6 + (parseInt(a.yards) || 0) * 0.1 + (parseInt(a.tackles) || 0) * 0.5;
        const scoreB = (parseInt(b.touchdowns) || 0) * 6 + (parseInt(b.yards) || 0) * 0.1 + (parseInt(b.tackles) || 0) * 0.5;
        return scoreB - scoreA; // Higher score = better rank
      });
      
      // Assign season ranks
      seasonRankPlayers.forEach((player, index) => {
        const originalIndex = playersWithRanks.findIndex(p => p.id === player.id);
        if (originalIndex !== -1) {
          playersWithRanks[originalIndex].seasonRank = index + 1;
        }
      });
      
      // Create a copy for game rank sorting
      const gameRankPlayers = [...playersWithRanks];
      
      // For game rank, we'll focus more on touchdowns
      gameRankPlayers.sort((a, b) => {
        const tdA = parseInt(a.touchdowns) || 0;
        const tdB = parseInt(b.touchdowns) || 0;
        if (tdA !== tdB) return tdB - tdA;
        
        // If touchdowns are the same, look at yards
        const yardsA = parseInt(a.yards) || 0;
        const yardsB = parseInt(b.yards) || 0;
        return yardsB - yardsA;
      });
      
      // Assign game ranks
      gameRankPlayers.forEach((player, index) => {
        const originalIndex = playersWithRanks.findIndex(p => p.id === player.id);
        if (originalIndex !== -1) {
          playersWithRanks[originalIndex].gameRank = index + 1;
        }
      });
    }
    
    return playersWithRanks;
  };

  /**
   * @function getPlayerName
   * @description Generates a placeholder name for players with errors
   * @param {Object} player - The player object to get the name for
   * @param {number} index - The index of the player in the array
   * @returns {string} The player's name
   */
  const getPlayerName = (player, index) => {
    if (player.player_name && !player.player_name.includes('error:')) {
      return player.player_name;
    }
    return `Player ${player.id || index + 1}`;
  };

  /**
   * @function getRealisticPosition
   * @description Generates a realistic position for players with errors
   * @param {Object} player - The player object to get the position for
   * @returns {string} The player's position
   */
  // backup in case we get a position we don't understand or N/A
  const getRealisticPosition = (player) => {
    if (player.position && player.position !== 'N/A') {
      return player.position;
    }
    
    // if we dont have a position from the api, we will just guess based on name or stats,
    // this way we can have any player from our CRUD edits!
    const playerName = player.player_name.toLowerCase();
    const touchdowns = parseInt(player.touchdowns) || 0;
    const yards = parseInt(player.yards) || 0;
    const tackles = parseInt(player.tackles) || 0;
    
    if (playerName.includes('kittle')) return 'TE';
    if (playerName.includes('samuel') || playerName.includes('aiyuk')) return 'WR';
    if (playerName.includes('purdy')) return 'QB';
    if (playerName.includes('mccaffrey')) return 'RB';
    if (playerName.includes('bosa')) return 'DE';
    if (playerName.includes('warner')) return 'LB';
    
    // Stat method for guessing position
    if (tackles > 30) {
      if (tackles > 80) return 'LB';
      return 'DB';
    }
    
    if (touchdowns > 5) {
      if (yards > 700) return 'WR';
      return 'RB';
    }
    
    if (yards > 1000) return 'QB';
    if (yards > 500) return 'WR';
    
    // hash so our guess is static for any player
    const positions = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB'];
    const hash = Math.abs(hashString(playerName)) % positions.length;
    return positions[hash];
  };

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // b'32 integer
    }
    return hash;
  };

  const sortPlayers = (players) => {
    const uniquePlayerMap = new Map();
    const uniquePlayers = [];
    
    players.forEach(player => {
      if (player.id && !uniquePlayerMap.has(player.id)) {
        uniquePlayerMap.set(player.id, true);
        uniquePlayers.push(player);
      }
    });
    
    const sorted = uniquePlayers.sort((a, b) => {
      let aValue, bValue;
      
      // special case for sorting on name, we need to do some string manipulation
      if (sortField === 'player_name') {
        aValue = getPlayerName(a, 0).toLowerCase();
        bValue = getPlayerName(b, 0).toLowerCase();
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Add last name sorting
      if (sortField === 'lastName') {
        const aNameParts = getPlayerName(a, 0).split(' ');
        const bNameParts = getPlayerName(b, 0).split(' ');
        aValue = aNameParts.length > 1 ? aNameParts.slice(1).join(' ').toLowerCase() : '';
        bValue = bNameParts.length > 1 ? bNameParts.slice(1).join(' ').toLowerCase() : '';
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Numeric sorting fields
      if (sortField === 'efficiency') {
        const aGames = parseInt(a.games_played) || 1;
        const bGames = parseInt(b.games_played) || 1;
        aValue = parseInt(a.touchdowns) / aGames;
        bValue = parseInt(b.touchdowns) / bGames;
      } else if (sortField === 'seasonRank' || sortField === 'gameRank') {
        aValue = a[sortField] || 999; 
        bValue = b[sortField] || 999;
      } else if (sortField === 'age' || sortField === 'experience') {
        aValue = sortField === 'age' ? 35 : 15; // All players have the same static values
        bValue = sortField === 'age' ? 35 : 15;
        // Even with same values, we'll maintain consistent sorting
        return sortDirection === 'asc' ? 
          (aValue - bValue || getPlayerName(a, 0).localeCompare(getPlayerName(b, 0))) : 
          (bValue - aValue || getPlayerName(b, 0).localeCompare(getPlayerName(a, 0)));
      } else {
        aValue = parseInt(a[sortField]) || 0;
        bValue = parseInt(b[sortField]) || 0;
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  };

  // Sort button drop down/click
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      const isRankField = field === 'seasonRank' || field === 'gameRank';
      setSortField(field);
      setSortDirection(isRankField ? 'asc' : 'desc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortField !== field) return null;
    return (
      <span style={{ marginLeft: '4px' }}>
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Loading state
  if (loading) {
    return <div>Loading player data...</div>;
  }

  // error state
  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  // If we are sorting after filtering, we need to change the filteredPlayers array
  const sortedPlayers = sortPlayers(filteredPlayers);

////////////////////////////////////////////////////////////
// Below is the UI/JSX for the leaderboard component
// All functionality code is above this section
////////////////////////////////////////////////////////////


  // First, create a consistent set of column widths to use throughout
  const columnWidths = {
    seasonRank: '8%',
    gameRank: '8%',
    playerNumber: '4%',
    firstName: '10%',
    lastName: '10%',
    position: '5%',
    age: '4%',
    exp: '4%',
    height: '4%',
    weight: '4%',
    college: '10%',
    touchdowns: '7%',
    yards: '7%',
    tackles: '7%'
  };

  return (
    <div>
      {/* Removed the "Player Leaderboard" h2 heading that was here */}
      
      {/* Show filter status if filters are applied */}
      {(filters.position || filters.minTouchdowns > 0 || filters.minYards > 0 || filters.searchName) && (
        <div style={{ 
          marginBottom: '15px', // Keep some space before the table
          background: '#f0f0f0', 
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '14px',
          color: '#555'
        }}>
          <strong>Active Filters:</strong>
          {filters.position && ` Position: ${filters.position}`}
          {filters.minTouchdowns > 0 && ` Min TD: ${filters.minTouchdowns}`}
          {filters.minYards > 0 && ` Min YD: ${filters.minYards}`}
          {filters.searchName && ` Search: "${filters.searchName}"`}
          {` (${sortedPlayers.length} players found)`}
        </div>
      )}
      
      {/* Table layout with headers styled like the image */}
      <div style={{ 
        border: '1px solid #eee', 
        borderRadius: '8px',
        overflow: 'hidden' // Ensure inner elements don't spill out
      }}>
        {/* Table Header Row - maroon color like the 49ers with gold text for season */}
        <div style={{
          display: 'flex',
          backgroundColor: '#800000',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          height: '44px',
        }}>
          {/* Season Rank Header */}
          <div 
            onClick={() => handleSort('seasonRank')}
            style={{ 
              width: columnWidths.seasonRank, 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#C8AA76'
            }}
          >
            SEASON RANK {renderSortIndicator('seasonRank')}
          </div>
          
          {/* Game Rank Header - update when a game is selected */}
          <div 
            onClick={() => handleSort('gameRank')}
            style={{ 
              width: columnWidths.gameRank,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {selectedGame ? `VS ${selectedGame.opponent}` : 'GAME RANK'} {renderSortIndicator('gameRank')}
          </div>
          
          {/* Player # Header */}
          <div style={{ 
            width: columnWidths.playerNumber, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            #
          </div>
          
          {/* First Name Header */}
          <div 
            onClick={() => handleSort('player_name')}
            style={{ 
              width: columnWidths.firstName,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            FIRST NAME {renderSortIndicator('player_name')}
          </div>
          
          {/* Last Name Header - use same field since we don't have separate first/last */}
          <div 
            onClick={() => handleSort('lastName')}
            style={{ 
              width: columnWidths.lastName,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            LAST NAME {renderSortIndicator('lastName')}
          </div>
          
          {/* Position Header */}
          <div 
            onClick={() => handleSort('position')}
            style={{ 
              width: columnWidths.position,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            POS {renderSortIndicator('position')}
          </div>
          
          {/* Age Header */}
          <div 
            onClick={() => handleSort('age')}
            style={{ 
              width: columnWidths.age,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            AGE {renderSortIndicator('age')}
          </div>
          
          {/* Experience Header */}
          <div 
            onClick={() => handleSort('experience')}
            style={{ 
              width: columnWidths.exp,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            EXP {renderSortIndicator('experience')}
          </div>
          
          {/* Height Header */}
          <div style={{ 
            width: columnWidths.height,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            HT
          </div>
          
          {/* Weight Header */}
          <div style={{ 
            width: columnWidths.weight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            WT
          </div>
          
          {/* College Header */}
          <div style={{ 
            width: columnWidths.college,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            COLLEGE
          </div>
          
          {/* Stats Headers */}
          <div 
            onClick={() => handleSort('touchdowns')}
            style={{ 
              width: columnWidths.touchdowns,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            TD {renderSortIndicator('touchdowns')}
          </div>
          
          <div 
            onClick={() => handleSort('yards')}
            style={{ 
              width: columnWidths.yards,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            YD {renderSortIndicator('yards')}
          </div>
          
          <div 
            onClick={() => handleSort('tackles')}
            style={{ 
              width: columnWidths.tackles,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            TKL {renderSortIndicator('tackles')}
          </div>
        </div>
        
        {/* Player Rows Container */}
        <div style={{ 
          height: '470px',
          overflowY: 'auto'
        }}>
          {(() => {
            // Use a Set to track which player names we've already seen
            const seenPlayerNames = new Set();
            
            // First filter players with unique names
            const uniqueNamePlayers = sortedPlayers
              .filter(player => {
                const playerName = getPlayerName(player, 0);
                
                // If we've seen this name before, skip it
                if (seenPlayerNames.has(playerName)) {
                  return false;
                }
                
                // Otherwise, add it to the set and keep it
                seenPlayerNames.add(playerName);
                return true;
              });
            
            // To ensure proper sorting and sequential display numbers:
            // 1. Create a mapping of original ranks to display ranks
            const createRankMap = (originalList, rankField) => {
              const displayRankMap = new Map();
              
              // Sort by the specified rank field to get the correct order
              const sortedByRank = [...originalList].sort((a, b) => {
                return (a[rankField] || 999) - (b[rankField] || 999);
              });
              
              // Create a mapping from original rank to display rank (1, 2, 3, etc.)
              sortedByRank.forEach((player, index) => {
                displayRankMap.set(player.id, index + 1);
              });
              
              return displayRankMap;
            };
            
            // Create rank mappings for both season and game ranks
            const seasonRankMap = createRankMap(uniqueNamePlayers, 'seasonRank');
            const gameRankMap = createRankMap(uniqueNamePlayers, 'gameRank');
            
            // Now map and render the unique players with proper ranks
            return uniqueNamePlayers.map((player, index) => {
            // Split player name into first and last name for display
            let firstName = '', lastName = '';
            const playerName = getPlayerName(player, index);
            const nameParts = playerName.split(' ');
            if (nameParts.length > 1) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              firstName = playerName;
            }
            
            const position = getRealisticPosition(player);
            const isSelected = selectedPlayerId === player.id;
            
            // Calculate row color based on the selection and alternating rows
            let rowColor = index % 2 === 0 ? '#f9f9f9' : 'white';
            if (isSelected) rowColor = '#faf0f0';
            
            // Highlight a specific row like in the image (red border)
            const isHighlighted = player.seasonRank === null;
              
              // Get the display ranks from our rank maps
              const displaySeasonRank = seasonRankMap.get(player.id);
              const displayGameRank = gameRankMap.get(player.id);
            
            return (
              <div
                key={player.id || index}
                className="leaderboard-player-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: rowColor,
                  cursor: 'pointer',
                  position: 'relative',
                  borderBottom: '1px solid #eee',
                  borderLeft: isHighlighted ? '3px solid #AA0000' : 'none',
                  borderRight: isHighlighted ? '3px solid #AA0000' : 'none'
                }}
                onClick={() => onSelectPlayer && onSelectPlayer(player)}
                onMouseEnter={() => setHoveredPlayer(player)}
                onMouseLeave={() => setHoveredPlayer(null)}
              >
                {/* Season Rank - Gold number in dark box */}
                <div style={{ 
                  width: columnWidths.seasonRank, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  backgroundColor: '#333',
                  color: '#C8AA76',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  height: '44px',
                }}>
                    {displaySeasonRank}
                </div>
                
                {/* Game Rank - White number in light gray box */}
                <div style={{ 
                  width: columnWidths.gameRank, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  backgroundColor: '#f5f5f5',
                  color: '#000',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  height: '44px',
                }}>
                    {displayGameRank}
                </div>
                
                {/* Player Number - No background */}
                <div style={{
                  width: columnWidths.playerNumber,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                }}>
                  {player.id || 71}
                </div>
                
                {/* First Name - No background */}
                <div style={{ 
                  width: columnWidths.firstName,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  height: '44px',
                }}>
                  {firstName}
                </div>
                
                {/* Last Name - No background */}
                <div style={{ 
                  width: columnWidths.lastName,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  height: '44px',
                }}>
                  {lastName}
                </div>
                
                {/* Position - No background */}
                <div style={{
                  width: columnWidths.position,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                }}>
                  {position}
                </div>
                
                {/* Age - No background */}
                <div style={{
                  width: columnWidths.age,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                }}>
                  35
                </div>
                
                {/* Experience - No background */}
                <div style={{
                  width: columnWidths.exp,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                }}>
                  15
                </div>
                
                {/* Height - No background */}
                <div style={{ 
                  width: columnWidths.height,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                }}>
                  6-5
                </div>
                
                {/* Weight - No background */}
                <div style={{ 
                  width: columnWidths.weight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                }}>
                  250
                </div>
                
                {/* College - No background */}
                <div style={{ 
                  width: columnWidths.college,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  height: '44px',
                }}>
                  Auburn
                </div>
                
                {/* Touchdowns - No background */}
                <div style={{ 
                  width: columnWidths.touchdowns,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                }}>
                  {player.touchdowns}
                </div>
                
                {/* Yards - No background */}
                <div style={{ 
                  width: columnWidths.yards,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: columnWidths.yards, 
                  textAlign: 'center',
                  padding: '12px 0',
                  borderRight: 'none',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {player.yards}
                </div>
                
                {/* Tackles - No background */}
                <div style={{ 
                  width: columnWidths.tackles, 
                  textAlign: 'center',
                  padding: '12px 0',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {player.tackles}
                </div>
                
                {/* Only show hover info if we're not using the side panel */}
                {!onSelectPlayer && hoveredPlayer && hoveredPlayer.id === player.id && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '-300px',
                    width: '280px',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                    padding: '20px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                      {/* Hover card content */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                      }}>
                        <img 
                          src={`/images/players/deebo.png`}
                          alt={player.player_name}
                          onError={(e) => {
                            // Fallback to placeholder SVG if image doesn't exist
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'block';
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                        <svg 
                          width="60" 
                          height="60" 
                          viewBox="0 0 24 24" 
                          fill="#AA0000"
                          style={{display: 'none'}} // Initially hidden
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 5px 0' }}>{playerName}</h3>
                        <div style={{ 
                          padding: '3px 8px', 
                          background: '#AA0000', 
                          color: 'white', 
                          borderRadius: '4px', 
                          display: 'inline-block',
                          fontSize: '14px'
                        }}>
                          {position}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '10px',
                      background: '#f9f9f9',
                      padding: '10px',
                      borderRadius: '6px'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>TOUCHDOWNS</div>
                        <div style={{ fontSize: '18px' }}>{player.touchdowns}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>YARDS</div>
                        <div style={{ fontSize: '18px' }}>{player.yards}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>TACKLES</div>
                        <div style={{ fontSize: '18px' }}>{player.tackles}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#666' }}>GAMES</div>
                        <div style={{ fontSize: '18px' }}>{player.games_played}</div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: '5px', 
                      padding: '10px', 
                      background: '#f0f0f0', 
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Performance:</div>
                      <div>TD per Game: {player.touchdowns / player.games_played}</div>
                      <div>Yards per Game: {player.yards / player.games_played}</div>
                      <div>Tackles per Game: {player.tackles / player.games_played}</div>
                    </div>
                  </div>
                )}
              </div>
            );
            });
          })()}
        </div>
      </div>
    </div>
  );
}