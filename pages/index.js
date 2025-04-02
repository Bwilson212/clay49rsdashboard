import { useState, useEffect, useRef } from 'react';
import Leaderboard from '../components/leaderboard';
import Scores from '../components/scores';


///////////////////////////////////////////////////////////////////////
// This is our primary dashboard page, which uses the leaderboard 
// and scores component to meet the spec requirements
// JSX/UI can be found at the bottom of the file
///////////////////////////////////////////////////////////////////////


export default function Home() {
  const [games, setGames] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);

  // ref for clicking outside the panel
  const playerDetailRef = useRef(null);
  
  // Add click handler to detect clicks outside the player panel
  useEffect(() => {
    function handleClickOutside(event) {
        //this is where we handle the popup when players are selected
      if (
        selectedPlayer && 
        playerDetailRef.current && 
        !playerDetailRef.current.contains(event.target) &&
        !event.target.closest('.leaderboard-player-item')
      ) {
        setSelectedPlayer(null);
      }
    }
    
    // Event listener for mouse selections
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedPlayer]);

  // clicks outside the filter dropdown
  useEffect(() => {
    function handleClickOutsideFilter(event) {
      const dropdown = document.getElementById('filter-dropdown');
      const filterButton = document.getElementById('filter-button');
      
      if (
        dropdown && 
        dropdown.style.display === 'block' && 
        !dropdown.contains(event.target) && 
        filterButton && 
        !filterButton.contains(event.target)
      ) {
        dropdown.style.display = 'none';
      }
    }
    
    document.addEventListener('mousedown', handleClickOutsideFilter);
    
    // Cleanup for listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFilter);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    
    // initialize if empty
    fetch('http://localhost:8000/backend/api.php?table=init')
      .then(res => res.json())
      .then(data => {
        console.log("DB initialization response:", data);
        
        // Then fetch games from the database
        return fetch('http://localhost:8000/backend/api.php?table=games');
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch games data');
        return res.json();
      })
      .then((gamesData) => {
        console.log("Received games:", gamesData.length);
        setGames(Array.isArray(gamesData) ? gamesData : []);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setGames([]);
        setLoading(false);
      });
  }, []);

  // Handle segment selection
  const handleSegmentChange = (event) => {
    setSelectedSegment(event.target.value);
  };

  // Handle player selection
  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

  // Handle game selection
  const handleGameSelect = (game) => {
    setSelectedGame(game);
    setSelectedPlayer(null); // Clear selected player when changing games
  };

///////////////////////////////////////////////////////////////////////
// Below is the JSX/UI for the dashboard page
// All functionality code is above this section
///////////////////////////////////////////////////////////////////////

  // Loading state
  if (loading) {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', textAlign: 'center', padding: '50px' }}>
        <h2>Loading 49ers dashboard data...</h2>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Updated header with elements positioned between thirds */}
      <header style={{ 
        background: 'linear-gradient(to right, #c9243f, #A71314)', // Keep original gradient
        color: '#fff', 
        padding: '15px 3px', // Adjusted padding for even spacing
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left-center section (between left and middle thirds) */}
        <div style={{ 
          width: '50%', // Take half the space
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center' // Center within this section
        }}>
          {/* 49ers Logo */}
          <img 
            src="/images/team-logos/49ers.png" 
            alt="49ers Logo" 
            style={{ 
              height: '105px',
              marginRight: '15px',
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
            }}
          />
          
          {/* Team Name */}
          <h1 style={{ 
            margin: 0, 
            paddingTop: '15px',     // More padding above
            paddingBottom: '5px',   // Less padding below
            fontSize: '48px',
            fontWeight: '300', 
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            San Francisco 49ers
          </h1>
        </div>
        
        {/* Right-center section (between middle and right thirds) */}
        <div style={{ 
          width: '50%', // Take half the space
          display: 'flex',
          justifyContent: 'center', // Changed back to center
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: '300',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            color: '#C8AA76' // Gold color
          }}>
            2024-2025 Season
          </div>
        </div>
      </header>
      
      {/* Modified: Extended gradient background for the space and linebreak */}
      <div style={{
        background: 'linear-gradient(to right, #c9243f, #A71314)', 
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '15px 0' // Adjusted padding to match the header
      }}>
        <hr style={{
          width: '90%', // Wider horizontal line
          border: '0',
          borderBottom: '1px solid rgba(255,255,255,0.2)' // Lighter color to be visible on the gradient
        }} />
      </div>
      
      {/* Scores component displays recent game results */}
      <Scores games={games} onGameSelect={handleGameSelect} />
      

      
      {/* MOVED: Filter and Export Bar - now outside the grid, spans full width */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '15px',
        background: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '0 0 20px 0' // Added margin at bottom for spacing
      }}>
        {/* Left side: Filter Button and Search */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          {/* Filter Button */}
          <div style={{ position: 'relative' }}>
            <button 
              id="filter-button"
              onClick={() => {
                const dropdown = document.getElementById('filter-dropdown');
                if (dropdown) {
                  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#f0f0f0',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '5px' }}>
                <path fill="currentColor" d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
              </svg>
              Filter
            </button>
            
            {/* Filter Dropdown */}
            <div 
              id="filter-dropdown" 
              style={{
                display: 'none',
                position: 'absolute',
                top: '100%',
                left: '0',
                background: 'white',
                padding: '15px',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 10,
                width: '250px',
                marginTop: '5px'
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Position:
                </label>
                <select 
                  onChange={(e) => window.setLeaderboardFilter('position', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">All Positions</option>
                  <option value="QB">Quarterback (QB)</option>
                  <option value="RB">Running Back (RB)</option>
                  <option value="WR">Wide Receiver (WR)</option>
                  <option value="TE">Tight End (TE)</option>
                  <option value="OL">Offensive Line (OL)</option>
                  <option value="DL">Defensive Line (DL)</option>
                  <option value="LB">Linebacker (LB)</option>
                  <option value="DB">Defensive Back (DB)</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Minimum Touchdowns:
                </label>
                <input 
                  type="number" 
                  min="0"
                  onChange={(e) => window.setLeaderboardFilter('minTouchdowns', parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Minimum Yards:
                </label>
                <input 
                  type="number" 
                  min="0"
                  onChange={(e) => window.setLeaderboardFilter('minYards', parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Minimum Tackles:
                </label>
                <input 
                  type="number" 
                  min="0"
                  onChange={(e) => window.setLeaderboardFilter('minTackles', parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                  Search by Name:
                </label>
                <input 
                  type="text" 
                  onChange={(e) => window.setLeaderboardFilter('searchName', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                <button 
                  onClick={() => window.resetLeaderboardFilters()}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#f0f0f0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
                
                <button 
                  onClick={() => {
                    document.getElementById('filter-dropdown').style.display = 'none';
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#AA0000',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>
              
              <div id="active-filters-indicator" style={{ 
                marginTop: '10px', 
                fontSize: '12px', 
                color: '#666',
                fontStyle: 'italic'
              }}></div>
            </div>
          </div>
          
          {/* Search Box - NEW */}
          <div style={{ 
            position: 'relative',
            flex: '1'
          }}>
            <input
              type="text"
              placeholder="Search player names..."
              onChange={(e) => window.setLeaderboardFilter('searchName', e.target.value)}
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '8px 10px 8px 32px', // Add space for the search icon
                width: '100%',
                fontSize: '14px'
              }}
            />
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#777'
              }}
            >
              <path 
                fill="currentColor" 
                d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              />
            </svg>
          </div>
          
          {/* Export Button - NOW TEXT ONLY */}
          <button 
            onClick={() => {
              // Get current filtered players
              const players = window.getCurrentPlayers();
              if (!players || players.length === 0) {
                alert('No players to export.');
                return;
              }
              
              // Filter out duplicates based on player name
              const uniquePlayers = [];
              const seenPlayerNames = new Set();
              
              players.forEach(player => {
                const playerName = player.player_name;
                if (!seenPlayerNames.has(playerName)) {
                  seenPlayerNames.add(playerName);
                  uniquePlayers.push(player);
                }
              });
              
              // Convert to CSV
              const headers = ['ID', 'Name', 'Position', 'Touchdowns', 'Yards', 'Tackles', 'Games Played', 'Season Rank', 'Game Rank'];
              const csvContent = [
                headers.join(','),
                ...uniquePlayers.map(player => [
                  player.id || '',
                  player.player_name || '',
                  player.position || '',
                  player.touchdowns || '0',
                  player.yards || '0',
                  player.tackles || '0',
                  player.games_played || '0',
                  player.seasonRank || '',
                  player.gameRank || ''
                ].join(','))
              ].join('\n');
              
              // Create download link
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              
              // Create a filename based on the current date
              const date = new Date().toISOString().slice(0, 10);
              const gameInfo = selectedGame ? `-${selectedGame.opponent.toLowerCase().replace(/\s+/g, '-')}` : '';
              const filters = document.getElementById('active-filters-indicator') && 
                            document.getElementById('active-filters-indicator').textContent ? 
                            '-filtered' : '';
              
              link.setAttribute('download', `49ers-stats${gameInfo}${filters}-${date}.csv`);
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#AA0000',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '8px 52px'
            }}
          >
            Export Data
          </button>
        </div>
        
        {/* Right side - can add additional controls here if needed */}
        <div></div>
      </div>
      
        {/* Updated grid layout with two columns */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '300px 1fr', // Left column fixed width, right column flexible
          gap: '20px',
          marginBottom: '20px'
        }}>
          {/* User Segments Box - NEW COMPONENT */}
          <div style={{ 
            background: 'linear-gradient(to right, #c9243f, #A71314)', // Added matching gradient
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            padding: '20px',
            color: 'white' // Changed text color to white for better contrast
          }}>
            <h2 style={{ 
              borderBottom: '1px solid rgba(255,255,255,0.2)', // Lighter border for contrast
              paddingBottom: '10px',
              marginTop: '0',
              color: '#fff', // Changed to white
              fontSize: '20px',
              fontWeight: '300', // Lighter weight to match header
              fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
            }}>
              User Segments
            </h2>
            
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '14px',
                  color: '#f0f0f0' // Lighter color for better visibility
                }}>
                  Fan Type:
                </label>
                <select 
                  value={selectedSegment} 
                  onChange={handleSegmentChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'white' // Keep input white for readability
                  }}
                >
                  <option value="all">All Fans</option>
                  <option value="season">Season Ticket Holders</option>
                  <option value="casual">Casual Fans</option>
                  <option value="premium">Premium Members</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '14px',
                  color: '#f0f0f0' // Lighter color for better visibility
                }}>
                  Location:
                </label>
                <select 
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'white' // Keep input white for readability
                  }}
                >
                  <option value="all">All Locations</option>
                  <option value="bay-area">Bay Area</option>
                  <option value="california">California</option>
                  <option value="west-coast">West Coast</option>
                  <option value="national">National</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '5px', 
                  fontSize: '14px',
                  color: '#f0f0f0' // Lighter color for better visibility
                }}>
                  Engagement Level:
                </label>
                <select 
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #eee',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'white' // Keep input white for readability
                  }}
                >
                  <option value="all">All Levels</option>
                  <option value="high">High Engagement</option>
                  <option value="medium">Medium Engagement</option>
                  <option value="low">Low Engagement</option>
                </select>
              </div>
              
              <button style={{
                backgroundColor: '#C8AA76', // Gold color to match other elements
                color: '#333', // Darker text for contrast
                border: 'none',
                borderRadius: '4px',
                padding: '10px 15px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%',
                marginTop: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                Apply Segments
              </button>
            </div>
          </div>
          
          {/* Updated Leaderboard and Player Details Container */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: selectedPlayer ? '60% 40%' : '1fr', // Split when player is selected
            gap: '20px'
          }}>
            {/* Leaderboard Component - now takes up less width when player selected */}
            <div style={{ 
              background: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              padding: '20px',
              height: 'fit-content'
            }}>
            <Leaderboard 
              onSelectPlayer={handlePlayerSelect} 
              selectedPlayerId={selectedPlayer?.id} 
              selectedGame={selectedGame} 
            />
            </div>
            
            {/* Player Detail Panel - only shown when a player is selected */}
            {selectedPlayer && (
              <div 
                ref={playerDetailRef}
                style={{ 
                  background: 'white', 
                  borderRadius: '8px', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '20px',
                  height: 'fit-content'
                }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}>
                  {/* Player Header */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '15px',
                    borderBottom: '1px solid #eee',
                    paddingBottom: '15px'
                  }}>
                    {/* Player Image/Avatar */}
                    <div style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="#AA0000">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                    </div>
                    
                    <div>
                      <h2 style={{ 
                        margin: '0 0 5px 0', 
                        fontSize: '22px',
                        color: '#333'
                      }}>
                        {selectedPlayer.player_name && !selectedPlayer.player_name.includes('error:') 
                          ? selectedPlayer.player_name 
                          : `Player ${selectedPlayer.id}`}
                      </h2>
                      <div style={{ 
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#AA0000',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {selectedPlayer.position && !selectedPlayer.position.includes('error:')
                          ? selectedPlayer.position
                          : (parseInt(selectedPlayer.tackles) > 100 
                              ? "DEF" 
                              : (parseInt(selectedPlayer.touchdowns) > 30 
                                  ? "WR/RB" 
                                  : (parseInt(selectedPlayer.yards) > 1500 
                                      ? "OFF" 
                                      : "UNK")))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Player Stats */}
                  <div>
                    <h3 style={{ 
                      margin: '0 0 10px 0',
                      fontSize: '16px',
                      color: '#666'
                    }}>
                      Season Performance
                    </h3>
                    
                    {/* Stats with Bar Charts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Touchdowns Stat */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Touchdowns</span>
                          <span>{selectedPlayer.touchdowns}</span>
                        </div>
                        <div style={{ 
                          height: '10px', 
                          width: '100%', 
                          background: '#eee', 
                          borderRadius: '5px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${Math.min(parseInt(selectedPlayer.touchdowns) * 2, 100)}%`, 
                            background: '#AA0000',
                            borderRadius: '5px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* Yards Stat */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Yards</span>
                          <span>{selectedPlayer.yards}</span>
                        </div>
                        <div style={{ 
                          height: '10px', 
                          width: '100%', 
                          background: '#eee', 
                          borderRadius: '5px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${Math.min(parseInt(selectedPlayer.yards) / 20, 100)}%`, 
                            background: '#AA0000',
                            borderRadius: '5px'
                          }}></div>
                        </div>
                      </div>
                      
                      {/* Tackles Stat */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Tackles</span>
                          <span>{selectedPlayer.tackles}</span>
                        </div>
                        <div style={{ 
                          height: '10px', 
                          width: '100%', 
                          background: '#eee', 
                          borderRadius: '5px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${Math.min(parseInt(selectedPlayer.tackles) / 2, 100)}%`, 
                            background: '#AA0000',
                            borderRadius: '5px'
                          }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Player Description/Bio */}
                  <div style={{ marginTop: '10px' }}>
                    <h3 style={{ 
                      margin: '0 0 10px 0',
                      fontSize: '16px',
                      color: '#666'
                    }}>
                      Player Overview
                    </h3>
                    <p style={{ 
                      margin: '0', 
                      fontSize: '14px', 
                      lineHeight: '1.5',
                      color: '#333'
                    }}>
                      {/* Generate a fake player description based on stats */}
                      {(() => {
                        const name = selectedPlayer.player_name && !selectedPlayer.player_name.includes('error:') 
                          ? selectedPlayer.player_name.split(' ')[0]
                          : 'This player';
                          
                        const pos = selectedPlayer.position && !selectedPlayer.position.includes('error:')
                          ? selectedPlayer.position
                          : 'player';
                          
                        const tds = parseInt(selectedPlayer.touchdowns);
                        const yds = parseInt(selectedPlayer.yards);
                        const tkls = parseInt(selectedPlayer.tackles);
                        const games = parseInt(selectedPlayer.games_played) || 1;
                        
                        let description = '';
                        
                        if (tds > 30) {
                          description = `${name} is a top-tier scoring threat, averaging ${(tds/games).toFixed(1)} touchdowns per game this season.`;
                        } else if (yds > 1500) {
                          description = `${name} is a yardage machine, contributing significantly to the team's offense with ${yds} total yards.`;
                        } else if (tkls > 100) {
                          description = `${name} is a defensive powerhouse with ${tkls} tackles, proving to be crucial to the team's defense.`;
                        } else {
                          description = `${name} has contributed ${tds} touchdowns and ${yds} yards over ${games} games this season.`;
                        }
                        
                        return description;
                      })()}
                    </p>
                  </div>
                  
                  {/* Performance Rating */}
                  <div style={{ 
                    marginTop: '10px',
                    padding: '15px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                      Performance Rating
                    </div>
                    <div style={{ 
                      fontSize: '32px', 
                      fontWeight: 'bold',
                      color: '#AA0000'
                    }}>
                      {/* Generate a rating from 1-100 based on player stats */}
                      {(() => {
                        const tds = parseInt(selectedPlayer.touchdowns) || 0;
                        const yds = parseInt(selectedPlayer.yards) || 0;
                        const tkls = parseInt(selectedPlayer.tackles) || 0;
                        
                        // Simple formula to generate a score between 0-100
                        const score = Math.min(
                          Math.floor((tds * 2.5) + (yds * 0.05) + (tkls * 0.5)), 
                          99
                        );
                        
                        return score;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Game summary section */}
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h2>Recent Games Summary</h2>
          <p>View the latest 49ers game results above. Click on a game card for more details.</p>
          
          {/* Add summary stats */}
          <div style={{ 
            marginTop: '15px',
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px' 
          }}>
            {/* Calculate win/loss record */}
            {(() => {
              const wins = games.filter(g => parseInt(g.niners_score) > parseInt(g.opponent_score)).length;
              const losses = games.length - wins;
              
              return (
                <div style={{ 
                  background: 'white', 
                  padding: '15px', 
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#666', fontSize: '14px' }}>SEASON RECORD</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                    {wins} - {losses}
                  </div>
                </div>
              );
            })()}
            
            {/* Calculate average points scored */}
            {(() => {
              const totalPoints = games.reduce((sum, game) => sum + parseInt(game.niners_score || 0), 0);
              const avg = games.length ? (totalPoints / games.length).toFixed(1) : 0;
              
              return (
                <div style={{ 
                  background: 'white', 
                  padding: '15px', 
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#666', fontSize: '14px' }}>AVG POINTS SCORED</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>
                    {avg}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      
      {/* Updated footer with matching gradient and Admin button */}
      <footer style={{ 
        padding: '15px', 
        background: 'linear-gradient(to right, #c9243f, #A71314)', // Matching gradient
        color: '#fff', 
        textAlign: 'center', 
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <p>49ers Dashboard • Stats and Game Results</p>
        
        {/* Admin Dashboard Button - moved from header to footer */}
        <a href="/admin" style={{
          display: 'inline-block',
          backgroundColor: '#C8AA76', // Gold color to match other elements
          color: '#333', // Darker text for contrast
          border: 'none',
          borderRadius: '4px',
          padding: '6px 15px',
          fontSize: '13px',
          fontWeight: 'bold',
          cursor: 'pointer',
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          Admin Dashboard
        </a>
      </footer>
    </div>
  );
}