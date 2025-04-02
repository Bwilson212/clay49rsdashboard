import { useState, useEffect } from 'react';
import { createGame, updateGame, deleteGame, createPlayer, updatePlayer, deletePlayer } from '../utils/api';

/**
 * @component AdminPanel
 * @description Administrative interface for managing game and player data with full CRUD functionality
 * @returns {JSX.Element} Admin page with all required buttons and web functionality
 */

///////////////////////////////////////////////////////////////////////
// CRUD functionality was listed in the requirements for this project,
// so i went ahead and implemented a new page for it, just to cover all bases
// JSX/UI can be found at the bottom of the file
///////////////////////////////////////////////////////////////////////


export default function AdminPanel() {
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('games'); // state to toggle between games and players
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [formData, setFormData] = useState({
    game_date: '',
    opponent: '',
    venue: 'Levi\'s Stadium',
    niners_score: 0,
    opponent_score: 0
  });
  
  // Add player form state
  const [playerFormData, setPlayerFormData] = useState({
    game_id: '',
    player_name: '',
    touchdowns: 0,
    yards: 0,
    tackles: 0
  });
  const [editingPlayer, setEditingPlayer] = useState(null);

  // Fetch games and players data
  useEffect(() => {
    fetchGames();
    fetchPlayers();
  }, []);

  const fetchGames = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/backend/api.php?table=games');
      if (!response.ok) throw new Error('Failed to fetch games');
      const data = await response.json();
      setGames(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    try {
      const response = await fetch('http://localhost:8000/backend/api.php?table=players');
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  // Function to regenerate all data
  const regenerateDatabase = async () => {
    if (!confirm('This will delete ALL existing data and regenerate the database. Are you sure?')) {
      return;
    }
    
    setRegenerating(true);
    try {
      const response = await fetch('http://localhost:8000/backend/api.php?table=regenerate');
      const data = await response.json();
      
      if (data.success) {
        alert(`Database regenerated successfully! Added ${data.games_added} games with players.`);
        fetchGames();
        fetchPlayers();
      } else {
        alert(`Error: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Error regenerating database:', error);
      alert('Failed to regenerate database. Check console for details.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePlayerInputChange = (e) => {
    const { name, value } = e.target;
    setPlayerFormData({
      ...playerFormData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editing) {
        // updating
        await updateGame(editing, formData);
      } else {
        // creating
        await createGame(formData);
      }
      
      // reset form
      setFormData({
        game_date: '',
        opponent: '',
        venue: 'Levi\'s Stadium',
        niners_score: 0,
        opponent_score: 0
      });
      setEditing(null);
      fetchGames();
    } catch (error) {
      console.error('Error saving game:', error);
      alert('Failed to save game. Check console for details.');
    }
  };

  const handlePlayerSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPlayer) {
        // Update existing player
        await updatePlayer(editingPlayer, playerFormData);
      } else {
        // Create new player
        await createPlayer(playerFormData);
      }
      
      // Reset form and refresh data
      setPlayerFormData({
        game_id: '',
        player_name: '',
        touchdowns: 0,
        yards: 0,
        tackles: 0
      });
      setEditingPlayer(null);
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Failed to save player. Check console for details.');
    }
  };

  const handleEdit = (game) => {
    setEditing(game.id);
    setFormData({
      game_date: game.game_date,
      opponent: game.opponent,
      venue: game.venue || 'Levi\'s Stadium',
      niners_score: game.niners_score,
      opponent_score: game.opponent_score
    });
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player.id);
    setPlayerFormData({
      game_id: player.game_id || games[0]?.id || '', // Default to first game if needed
      player_name: player.player_name,
      touchdowns: player.touchdowns,
      yards: player.yards,
      tackles: player.tackles
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    try {
      await deleteGame(id);
      fetchGames();
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete game. Check console for details.');
    }
  };


///////////////////////////////////////////////////////////////////////
// Below is the JSX/UI for the admin panel
// All functionality code is above this section
///////////////////////////////////////////////////////////////////////


  const handleDeletePlayer = async (id) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    try {
      await deletePlayer(id);
      fetchPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player. Check console for details.');
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: 0 }}>49ers Admin Panel</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={regenerateDatabase}
            disabled={regenerating}
            style={{
              backgroundColor: '#C8AA76',
              color: '#333',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: regenerating ? 'not-allowed' : 'pointer',
              opacity: regenerating ? 0.7 : 1
            }}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Database'}
          </button>
          <a href="/" style={{
            display: 'inline-block',
            backgroundColor: '#c9243f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 15px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            Return to Dashboard
          </a>
        </div>
      </div>
      
      {/* Database Statistics */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          flex: 1,
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Database Stats</h3>
          <p style={{ margin: '5px 0' }}><strong>Games:</strong> {games.length}</p>
          <p style={{ margin: '5px 0' }}><strong>Players:</strong> {players.length}</p>
        </div>
        
        <div style={{
          flex: 2,
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Database Management</h3>
          <p>This page will allow us to make sure we have CRUD functionality on mysql. Although in any real scenario this would be blocked from the dashboard, I just added a button for the sake of testing</p>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>Create new games and player records</li>
            <li>Read existing data from your database</li>
            <li>Update information for games and players</li>
            <li>Delete records that are no longer needed</li>
          </ul>
        </div>
      </div>
      
      {/* Tabs for switching between Games and Players */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ddd', 
        marginBottom: '20px' 
      }}>
        <button
          onClick={() => setActiveTab('games')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'games' ? '#c9243f' : '#f5f5f5',
            color: activeTab === 'games' ? 'white' : '#333',
            border: 'none',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'games' ? 'bold' : 'normal'
          }}
        >
          Games
        </button>
        
        <button
          onClick={() => setActiveTab('players')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'players' ? '#c9243f' : '#f5f5f5',
            color: activeTab === 'players' ? 'white' : '#333',
            border: 'none',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            cursor: 'pointer',
            fontWeight: activeTab === 'players' ? 'bold' : 'normal',
            marginLeft: '5px'
          }}
        >
          Players
        </button>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === 'games' ? (
        <>
          <div style={{ marginBottom: '30px' }}>
            <h2>{editing ? 'Edit Game' : 'Add New Game'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '500px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label>Date:</label>
                <input 
                  type="date" 
                  name="game_date" 
                  value={formData.game_date} 
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Opponent:</label>
                <input 
                  type="text" 
                  name="opponent" 
                  value={formData.opponent} 
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Venue:</label>
                <input 
                  type="text" 
                  name="venue" 
                  value={formData.venue} 
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>49ers Score:</label>
                <input 
                  type="number" 
                  name="niners_score" 
                  value={formData.niners_score} 
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Opponent Score:</label>
                <input 
                  type="number" 
                  name="opponent_score" 
                  value={formData.opponent_score} 
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit"
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#c9243f', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {editing ? 'Update Game' : 'Add Game'}
                </button>
                
                {editing && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setFormData({
                        game_date: '',
                        opponent: '',
                        venue: 'Levi\'s Stadium',
                        niners_score: 0,
                        opponent_score: 0
                      });
                    }}
                    style={{ 
                      padding: '10px 20px',
                      backgroundColor: '#333', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          
          <h2>Games List</h2>
          {loading ? (
            <p>Loading games...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f2f2f2' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Opponent</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Venue</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>49ers Score</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Opponent Score</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map(game => (
                  <tr key={game.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{game.id}</td>
                    <td style={{ padding: '10px' }}>{game.game_date}</td>
                    <td style={{ padding: '10px' }}>{game.opponent}</td>
                    <td style={{ padding: '10px' }}>{game.venue || 'Levi\'s Stadium'}</td>
                    <td style={{ padding: '10px' }}>{game.niners_score}</td>
                    <td style={{ padding: '10px' }}>{game.opponent_score}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleEdit(game)}
                        style={{ 
                          marginRight: '10px',
                          padding: '5px 10px',
                          backgroundColor: '#C8AA76', 
                          color: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(game.id)}
                        style={{ 
                          padding: '5px 10px',
                          backgroundColor: '#c9243f', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {games.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No games found</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          {/* Player Edit Form */}
          <div style={{ marginBottom: '30px' }}>
            <h2>{editingPlayer ? 'Edit Player' : 'Add New Player'}</h2>
            <form onSubmit={handlePlayerSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '500px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label>Game:</label>
                <select
                  name="game_id"
                  value={playerFormData.game_id}
                  onChange={handlePlayerInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                >
                  <option value="">Select a game</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.opponent} ({game.game_date})
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Player Name:</label>
                <input 
                  type="text" 
                  name="player_name" 
                  value={playerFormData.player_name} 
                  onChange={handlePlayerInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Touchdowns:</label>
                <input 
                  type="number" 
                  name="touchdowns" 
                  value={playerFormData.touchdowns} 
                  onChange={handlePlayerInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Yards:</label>
                <input 
                  type="number" 
                  name="yards" 
                  value={playerFormData.yards} 
                  onChange={handlePlayerInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Tackles:</label>
                <input 
                  type="number" 
                  name="tackles" 
                  value={playerFormData.tackles} 
                  onChange={handlePlayerInputChange}
                  required
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit"
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#c9243f', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {editingPlayer ? 'Update Player' : 'Add Player'}
                </button>
                
                {editingPlayer && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingPlayer(null);
                      setPlayerFormData({
                        game_id: '',
                        player_name: '',
                        touchdowns: 0,
                        yards: 0,
                        tackles: 0
                      });
                    }}
                    style={{ 
                      padding: '10px 20px',
                      backgroundColor: '#333', 
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <h2>Players Database</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Position</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Touchdowns</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Yards</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Tackles</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Games Played</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px' }}>{player.id}</td>
                    <td style={{ padding: '10px' }}>{player.player_name}</td>
                    <td style={{ padding: '10px' }}>{player.position}</td>
                    <td style={{ padding: '10px' }}>{player.touchdowns}</td>
                    <td style={{ padding: '10px' }}>{player.yards}</td>
                    <td style={{ padding: '10px' }}>{player.tackles}</td>
                    <td style={{ padding: '10px' }}>{player.games_played}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleEditPlayer(player)}
                        style={{ 
                          marginRight: '10px',
                          padding: '5px 10px',
                          backgroundColor: '#C8AA76', 
                          color: '#333',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeletePlayer(player.id)}
                        style={{ 
                          padding: '5px 10px',
                          backgroundColor: '#c9243f', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {players.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}>No players found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
} 