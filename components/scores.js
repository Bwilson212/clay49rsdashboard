import React, { useEffect, useState } from 'react';
import { fetchGames } from '../utils/api';

export default function Scores({ onGameSelect }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  
  // Fetch games data from the API
  useEffect(() => {
    const getGames = async () => {
      try {
        setLoading(true);
        const data = await fetchGames();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setGames(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('Failed to load games data.');
        setLoading(false);
      }
    };
    
    getGames();
  }, []);
  
  // Event listener for clicking outside of a game box
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.game-box')) {
        setSelectedGameId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Pull team logo based on opponent name
  const getTeamLogoPath = (opponent) => {
    if (!opponent) return null;
    
    // filter down to just the team name for file extraction
    const teamNameParts = opponent.split(' ');
    const teamName = teamNameParts[teamNameParts.length - 1].toLowerCase();
    
    return `/images/team-logos/${teamName}.png`;
  };
  
  // Get stadium based on opponent
  const getStadium = (opponent) => {
    if (!opponent) return 'Unknown Stadium';
    
    const teamNameParts = opponent.split(' ');
    const teamName = teamNameParts[teamNameParts.length - 1];
    
    const stadiums = {
      'Seahawks': 'Lumen Field',
      'Cardinals': 'State Farm Stadium',
      'Rams': 'SoFi Stadium',
      'Cowboys': 'AT&T Stadium',
      'Eagles': 'Lincoln Financial Field',
      'Packers': 'Lambeau Field',
      'Chiefs': 'Arrowhead Stadium',
      'Bengals': 'Paycor Stadium',
      'Ravens': 'M&T Bank Stadium',
      'Buccaneers': 'Raymond James Stadium',
      'Jaguars': 'TIAA Bank Field',
      'Giants': 'MetLife Stadium',
      'Saints': 'Caesars Superdome',
    };
    
    return stadiums[teamName] || 'Levi\'s Stadium';
  };
  
  // Extract city from fetched data
  const getTeamCity = (opponent) => {
    if (!opponent) return '';
    
    const parts = opponent.split(' ');
    if (parts.length <= 1) return '';
    
    return parts.slice(0, parts.length - 1).join(' ');
  };
  
  // Get team name from full opponent string
  const getTeamName = (opponent) => {
    if (!opponent) return 'Unknown Team';
    
    // Extract just the team name
    const parts = opponent.split(' ');
    if (parts.length === 0) return 'Unknown Team';
    
    return parts[parts.length - 1];
  };
  
  // Loading state
  if (loading) {
    return <div style={{ padding: '15px', background: '#f9f9f9' }}>Loading game data...</div>;
  }
  
  // Error state
  if (error) {
    return <div style={{ padding: '15px', background: '#f9f9f9', color: 'red' }}>{error}</div>;
  }

  // data error state
  if (!games || games.length === 0) {
    return <div style={{ padding: '15px', background: '#f9f9f9' }}>No game data available.</div>;
  }

  // Sort games by date
  const sortedGames = [...games].sort((a, b) => new Date(b.game_date) - new Date(a.game_date));


////////////////////////////////////////////////////////////
// Below is the UI/HTML for the leaderboard component
// All functionality code is above this section
////////////////////////////////////////////////////////////


  return (
    
    <div style={{ 
      padding: '15px', 
      background: 'linear-gradient(to right, #c9243f, #A71314)', // Matching gradient
      overflowX: 'auto', 
      whiteSpace: 'nowrap',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {sortedGames.map(game => {
        const isWin = parseInt(game.niners_score) > parseInt(game.opponent_score);
        const isSelected = game.id === selectedGameId;
        
        return (
          <div 
            key={game.id} 
            className="game-box"
            style={{
              display: 'inline-block', 
              margin: '0 10px',
              padding: '10px',
              background: isSelected ? '#fff' : '#C8AA76',
              borderRadius: '6px',
              boxShadow: isSelected ? '0 0 8px rgba(255,255,255,0.5)' : '0 2px 5px rgba(0,0,0,0.15)',
              width: 'calc(10% - 20px)',
              minWidth: '130px',
              height: '240px',
              textAlign: 'center',
              position: 'relative',
              verticalAlign: 'top',
              cursor: 'pointer',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: isSelected ? '#fff' : 'transparent',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setSelectedGameId(game.id);
              if (onGameSelect) {
                onGameSelect(game);
              }
            }}
          >
            {/* Date on top - smaller font */}
            <div style={{ 
              fontSize: '12px', 
              fontWeight: 'bold', 
              marginBottom: '2px', 
              color: '#333',
              lineHeight: '1.2' 
            }}>
              {game.game_date ? new Date(game.game_date).toLocaleDateString('en-US', {
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              }) : 'No Date'}
            </div>
            
            {/* Stadium - smaller and now bold */}
            <div style={{ 
              fontSize: '12px', 
              color: '#333', 
              marginBottom: '8px', 
              fontStyle: 'italic',
              fontWeight: 'bold', 
              lineHeight: '1.2' 
            }}>
              {getStadium(game.opponent)}
            </div>
            
            {/* Team Logo - make larger with transparent background */}
            <div style={{ 
              marginBottom: '6px',
              display: 'flex',
              justifyContent: 'center'
            }}>
              <div style={{ 
                width: '80px', // Increased from 42px
                height: '80px', // Increased from 42px
                background: 'transparent', // Changed from white to transparent
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: 'none' // Removed shadow which would show with transparent background
              }}>
                {/* Team logo image */}
                {game.opponent ? (
                  <>
                    <span style={{ 
                      color: '#333',
                      fontWeight: 'bold',
                      position: 'absolute',
                      zIndex: 1,
                      fontSize: '12px',
                      opacity: 0.8, // Added slight transparency to the fallback text
                      display: 'none' // Initially hide the text fallback to prioritize the image
                    }}>
                      {getTeamName(game.opponent).toUpperCase()}
                    </span>
                    <img 
                      src={getTeamLogoPath(game.opponent)}
                      alt={game.opponent}
                      style={{
                        maxWidth: '85%', // Increased from 75%
                        maxHeight: '85%', // Increased from 75%
                        position: 'relative',
                        zIndex: 2
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'; // Hide image on error
                        // Show the fallback text when image fails to load
                        e.target.previousSibling.style.display = 'block';
                      }}
                    />
                  </>
                ) : 'OPP'}
              </div>
            </div>
            
            {/* VS - smaller with less margin */}
            <div style={{ 
              fontSize: '14px', // Reduced from 16px
              fontWeight: 'bold', 
              margin: '4px 0', // Reduced from 5px
              color: '#333',
              lineHeight: '1' // Tighter line height
            }}>
              VS
            </div>
            
            {/* Team City */}
            <div style={{ 
              fontSize: '18px',
              fontWeight: 'normal',
              color: '#333',
              lineHeight: '1.2',
              fontFamily: "'Bebas Neue', sans-serif"
            }}>
              {getTeamCity(game.opponent)}
            </div>
            
            {/* Team Name */}
            <div style={{ 
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '8px',
              lineHeight: '1.2',
              fontFamily: "'Bebas Neue', sans-serif"
            }}>
              {getTeamName(game.opponent) || 'Unknown Team'}
            </div>
            
            {/* Score with Win/Loss Badge to the left */}
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '4px 0',
              lineHeight: '1.2'
            }}>
              {/* Win/Loss Badge */}
              <div style={{
                width: '22px',
                height: '22px',
                marginRight: '6px',
                borderRadius: '4px',
                background: '#C8AA76', // Match the gold background of the box
                border: `0px solid ${isWin ? '#008800' : '#CC0000'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '24px',
                color: isWin ? '#008800' : '#CC0000' // Text itself is colored red/green
              }}>
                {isWin ? 'W' : 'L'}
              </div>
              
              {/* Score next to the badge */}
              <div style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                {game.niners_score || 0} - {game.opponent_score || 0}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}