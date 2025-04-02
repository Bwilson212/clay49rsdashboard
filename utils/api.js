// API utility functions for CRUD operations

// Create a new game
export const createGame = async (gameData) => {
  try {
    const response = await fetch('http://localhost:8000/backend/api.php?table=games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating game:", error);
    return { error: error.message };
  }
};

// Create a new player
export const createPlayer = async (playerData) => {
  try {
    const response = await fetch('http://localhost:8000/backend/api.php?table=players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    });
    return await response.json();
  } catch (error) {
    console.error("Error creating player:", error);
    return { error: error.message };
  }
};

// Update a game
export const updateGame = async (id, gameData) => {
  try {
    const response = await fetch(`http://localhost:8000/backend/api.php?table=games&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameData)
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating game:", error);
    return { error: error.message };
  }
};

// Update a player
export const updatePlayer = async (id, playerData) => {
  try {
    const response = await fetch(`http://localhost:8000/backend/api.php?table=players&id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating player:", error);
    return { error: error.message };
  }
};

// Delete a game
export const deleteGame = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/backend/api.php?table=games&id=${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting game:", error);
    return { error: error.message };
  }
};

// Delete a player
export const deletePlayer = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/backend/api.php?table=players&id=${id}`, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting player:", error);
    return { error: error.message };
  }
};

// Fetch all players
export const fetchPlayers = async () => {
  try {
    const response = await fetch('http://localhost:8000/backend/api.php?table=players');
    return await response.json();
  } catch (error) {
    console.error("Error fetching players:", error);
    return { error: error.message };
  }
};

// Fetch a single player by ID
export const fetchPlayerById = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/backend/api.php?table=players&id=${id}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching player:", error);
    return { error: error.message };
  }
};

// Fetch all games
export const fetchGames = async () => {
  try {
    const response = await fetch('http://localhost:8000/backend/api.php?table=games');
    return await response.json();
  } catch (error) {
    console.error("Error fetching games:", error);
    return { error: error.message };
  }
};

// Fetch a single game by ID
export const fetchGameById = async (id) => {
  try {
    const response = await fetch(`http://localhost:8000/backend/api.php?table=games&id=${id}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching game:", error);
    return { error: error.message };
  }
};

// Fetch player stats for a specific game
export const fetchGamePlayers = async (gameId) => {
  try {
    const response = await fetch(`http://localhost:8000/backend/api.php?table=gameplayers&gameId=${gameId}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching game players:", error);
    return { error: error.message };
  }
};

// Initialize database
export const initializeDatabase = async () => {
  try {
    const response = await fetch('http://localhost:8000/backend/api.php?table=init');
    return await response.json();
  } catch (error) {
    console.error("Error initializing database:", error);
    return { error: error.message };
  }
};

// Regenerate database
export const regenerateDatabase = async () => {
  try {
    const response = await fetch('http://localhost:8000/backend/api.php?table=regenerate');
    return await response.json();
  } catch (error) {
    console.error("Error regenerating database:", error);
    return { error: error.message };
  }
}; 