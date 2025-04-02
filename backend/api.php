<?php
// Turn off output buffering to prevent corrupted responses
ob_end_clean();
if (ob_get_level()) ob_end_clean();

// Disable error display in output
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set proper JSON response headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

// Prevent PHP warnings from appearing in output
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // Log error to file instead of output
    error_log("PHP Error: $errstr in $errfile on line $errline");
    return true; // Don't execute PHP's internal error handler
});

// Database configuration
$dbConfig = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => '',     // Try with an empty password first
    'database' => 'ninersdb'
];

// Connect to database
function connectToDatabase() {
    global $dbConfig;
    
    try {
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        
        // First attempt with configured credentials
        try {
            $conn = new mysqli(
                $dbConfig['host'],
                $dbConfig['username'],
                $dbConfig['password'],
                $dbConfig['database']
            );
            
            if (!$conn->connect_error) {
                mysqli_report(MYSQLI_REPORT_OFF);
                return $conn;
            }
        } catch (Exception $e) {
            logDebug("First connection attempt failed: " . $e->getMessage());
        }
        
        // Second attempt with empty password
        try {
            if ($dbConfig['password'] !== '') {
                $conn = new mysqli(
                    $dbConfig['host'],
                    $dbConfig['username'],
                    '',
                    $dbConfig['database']
                );
                
                if (!$conn->connect_error) {
                    mysqli_report(MYSQLI_REPORT_OFF);
                    logDebug("Connected with empty password");
                    return $conn;
                }
            }
        } catch (Exception $e) {
            logDebug("Second connection attempt failed: " . $e->getMessage());
        }
        
        // Third attempt: connect without selecting a database, then create if needed
        try {
            $conn = new mysqli(
                $dbConfig['host'],
                $dbConfig['username'],
                $dbConfig['password']
            );
            
            if (!$conn->connect_error) {
                // Create DB if not exists, then select it
                $conn->query("CREATE DATABASE IF NOT EXISTS " . $dbConfig['database']);
                $conn->select_db($dbConfig['database']);
                createTablesIfNotExist($conn);
                
                mysqli_report(MYSQLI_REPORT_OFF);
                logDebug("Connected and created database");
                return $conn;
            }
        } catch (Exception $e) {
            logDebug("Third connection attempt failed: " . $e->getMessage());
        }
        
        // All attempts failed
        mysqli_report(MYSQLI_REPORT_OFF);
        logDebug("All database connection attempts failed");
        return null;
    } catch (Exception $e) {
        mysqli_report(MYSQLI_REPORT_OFF);
        logDebug("Database connection exception: " . $e->getMessage());
        return null;
    }
}

// Create tables if they don't exist
function createTablesIfNotExist($conn) {
    try {
        // Create games table
        $conn->query("CREATE TABLE IF NOT EXISTS games (
            id INT AUTO_INCREMENT PRIMARY KEY,
            game_date DATETIME NOT NULL,
            opponent VARCHAR(100) NOT NULL,
            venue VARCHAR(100) NOT NULL,
            niner_score INT NOT NULL,
            opponent_score INT NOT NULL
        )");
        
        // Create players table
        $conn->query("CREATE TABLE IF NOT EXISTS players (
            id INT AUTO_INCREMENT PRIMARY KEY,
            game_id INT NOT NULL,
            player_name VARCHAR(100) NOT NULL,
            touchdowns INT DEFAULT 0,
            yards INT DEFAULT 0,
            tackles INT DEFAULT 0,
            FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
        )");
        
        logDebug("Tables created if they didn't exist");
        return true;
    } catch (Exception $e) {
        logDebug("Error creating tables: " . $e->getMessage());
        return false;
    }
}

// Your Mockaroo API key
$mockarooKey = "be956510";

// Log function for debugging
function logDebug($message) {
    error_log("[DEBUG] " . $message);
}

// --- Helper function to fetch Mockaroo data (JSON) ---
function fetchMockarooData($endpoint) {
    global $mockarooKey;
    
    logDebug("Fetching from Mockaroo endpoint: $endpoint");
    
    $curl = curl_init();
    $url = "https://my.api.mockaroo.com/" . $endpoint . ".json?key=" . $mockarooKey;
    
    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => "GET",
        CURLOPT_HTTPHEADER => ["Accept: application/json"]
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    logDebug("Mockaroo HTTP code: $httpCode for $endpoint");
    
    if ($error) {
        logDebug("Curl error: $error");
        curl_close($curl);
        return ["error" => "Connection error: $error"];
    }
    
    if ($httpCode != 200) {
        logDebug("HTTP error $httpCode: $response");
        curl_close($curl);
        return ["error" => "API returned status $httpCode", "details" => substr($response, 0, 200)];
    }
    
    curl_close($curl);
    
    // Add additional debugging
    logDebug("Raw response from Mockaroo: " . substr($response, 0, 100) . "...");
    
    // Parse JSON response
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        logDebug("JSON parsing error: " . json_last_error_msg() . " in response: " . substr($response, 0, 200));
        return ["error" => "JSON parsing error: " . json_last_error_msg()];
    }
    
    logDebug("Successfully parsed " . count($data) . " records from $endpoint JSON");
    return $data;
}

// --- Database CRUD operations ---

// CREATE - Insert a new game
function createGame($gameData) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $stmt = $conn->prepare("INSERT INTO games (game_date, opponent, venue, niner_score, opponent_score) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssii", 
            $gameData['game_date'], 
            $gameData['opponent'], 
            $gameData['venue'], 
            $gameData['niners_score'], 
            $gameData['opponent_score']
        );
        
        if ($stmt->execute()) {
            $gameId = $conn->insert_id;
            $stmt->close();
            $conn->close();
            return ["success" => true, "id" => $gameId, "message" => "Game created successfully"];
        } else {
            $stmt->close();
            $conn->close();
            return ["error" => "Failed to create game: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Create game error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// CREATE - Insert a new player
function createPlayer($playerData) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $stmt = $conn->prepare("INSERT INTO players (game_id, player_name, touchdowns, yards, tackles) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issii", 
            $playerData['game_id'], 
            $playerData['player_name'], 
            $playerData['touchdowns'], 
            $playerData['yards'],
            $playerData['tackles']
        );
        
        if ($stmt->execute()) {
            $playerId = $conn->insert_id;
            $stmt->close();
            $conn->close();
            return ["success" => true, "id" => $playerId, "message" => "Player created successfully"];
        } else {
            $stmt->close();
            $conn->close();
            return ["error" => "Failed to create player: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Create player error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// READ - Get all games
function getAllGames() {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $result = $conn->query("SELECT id, DATE_FORMAT(game_date, '%Y-%m-%d') as game_date, opponent, venue, niner_score as niners_score, opponent_score FROM games ORDER BY game_date DESC");
        
        if ($result) {
            $games = [];
            while ($row = $result->fetch_assoc()) {
                $games[] = $row;
            }
            $result->free();
            $conn->close();
            return $games;
        } else {
            $conn->close();
            return ["error" => "Failed to fetch games: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Get games error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// READ - Get all players
function getAllPlayers() {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        // This query counts distinct games a player has participated in
        $sql = "SELECT p.id, p.player_name, 'N/A' as position, 
                       SUM(p.touchdowns) as touchdowns, 
                       SUM(p.yards) as yards, 
                       SUM(p.tackles) as tackles, 
                       COUNT(DISTINCT p.game_id) as games_played 
                  FROM players p 
              GROUP BY p.id, p.player_name";
                
        $result = $conn->query($sql);
        
        if ($result) {
            $players = [];
            while ($row = $result->fetch_assoc()) {
                $players[] = $row;
            }
            $result->free();
            $conn->close();
            return $players;
        } else {
            $conn->close();
            return ["error" => "Failed to fetch players: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Get players error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// READ - Get a single game by ID
function getGameById($id) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $stmt = $conn->prepare("SELECT id, DATE_FORMAT(game_date, '%Y-%m-%d') as game_date, opponent, venue, niner_score as niners_score, opponent_score FROM games WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result) {
            $game = $result->fetch_assoc();
            $stmt->close();
            $conn->close();
            return $game ? $game : ["error" => "Game not found"];
        } else {
            $stmt->close();
            $conn->close();
            return ["error" => "Failed to fetch game: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Get game error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// READ - Get a single player by ID
function getPlayerById($id) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $stmt = $conn->prepare("SELECT p.id, p.player_name, 'N/A' as position, 
                                      SUM(p.touchdowns) as touchdowns, 
                                      SUM(p.yards) as yards, 
                                      SUM(p.tackles) as tackles, 
                                      COUNT(DISTINCT p.game_id) as games_played 
                                 FROM players p 
                                WHERE p.id = ?
                             GROUP BY p.id, p.player_name");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result) {
            $player = $result->fetch_assoc();
            $stmt->close();
            $conn->close();
            return $player ? $player : ["error" => "Player not found"];
        } else {
            $stmt->close();
            $conn->close();
            return ["error" => "Failed to fetch player: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Get player error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// UPDATE - Update a game
function updateGame($id, $gameData) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $stmt = $conn->prepare("UPDATE games 
                                   SET game_date = ?, 
                                       opponent = ?, 
                                       venue = ?, 
                                       niner_score = ?, 
                                       opponent_score = ?
                                 WHERE id = ?");
        $stmt->bind_param("sssiii", 
            $gameData['game_date'], 
            $gameData['opponent'], 
            $gameData['venue'], 
            $gameData['niners_score'], 
            $gameData['opponent_score'],
            $id
        );
        
        if ($stmt->execute()) {
            $affected = $stmt->affected_rows;
            $stmt->close();
            $conn->close();
            
            if ($affected > 0) {
                return ["success" => true, "message" => "Game updated successfully"];
            } else {
                return ["error" => "Game not found or no changes made"];
            }
        } else {
            $stmt->close();
            $conn->close();
            return ["error" => "Failed to update game: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Update game error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// UPDATE - Update a player
function updatePlayer($id, $playerData) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $stmt = $conn->prepare("UPDATE players 
                                   SET game_id = ?, 
                                       player_name = ?, 
                                       touchdowns = ?, 
                                       yards = ?, 
                                       tackles = ? 
                                 WHERE id = ?");
        $stmt->bind_param("issiii", 
            $playerData['game_id'], 
            $playerData['player_name'], 
            $playerData['touchdowns'], 
            $playerData['yards'],
            $playerData['tackles'],
            $id
        );
        
        if ($stmt->execute()) {
            $affected = $stmt->affected_rows;
            $stmt->close();
            $conn->close();
            
            if ($affected > 0) {
                return ["success" => true, "message" => "Player updated successfully"];
            } else {
                return ["error" => "Player not found or no changes made"];
            }
        } else {
            $stmt->close();
            $conn->close();
            return ["error" => "Failed to update player: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Update player error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// DELETE - Delete a game (and related players)
function deleteGame($id) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $conn->begin_transaction();
        
        // Delete related players first
        $stmt1 = $conn->prepare("DELETE FROM players WHERE game_id = ?");
        $stmt1->bind_param("i", $id);
        $stmt1->execute();
        $stmt1->close();
        
        // Then delete the game
        $stmt2 = $conn->prepare("DELETE FROM games WHERE id = ?");
        $stmt2->bind_param("i", $id);
        $stmt2->execute();
        $affected = $stmt2->affected_rows;
        $stmt2->close();
        
        $conn->commit();
        $conn->close();
        
        if ($affected > 0) {
            return ["success" => true, "message" => "Game and related player records deleted successfully"];
        } else {
            return ["error" => "Game not found"];
        }
    } catch (Exception $e) {
        if ($conn) {
            $conn->rollback();
            $conn->close();
        }
        logDebug("Delete game error: " . $e->getMessage());
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// DELETE - Delete a player
function deletePlayer($id) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $stmt = $conn->prepare("DELETE FROM players WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            $affected = $stmt->affected_rows;
            $stmt->close();
            $conn->close();
            
            if ($affected > 0) {
                return ["success" => true, "message" => "Player deleted successfully"];
            } else {
                return ["error" => "Player not found"];
            }
        } else {
            $stmt->close();
            $conn->close();
            return ["error" => "Failed to delete player: " . $conn->error];
        }
    } catch (Exception $e) {
        logDebug("Delete player error: " . $e->getMessage());
        if ($conn) $conn->close();
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// Populate database from Mockaroo CSV data
function populateInitialData() {
    $conn = connectToDatabase();
    if (!$conn) {
        logDebug("Database connection failed in populateInitialData()");
        return ["error" => "Database connection failed", "details" => "Check your MySQL credentials and ensure the database exists"];
    }
    
    try {
        $tableCheckQuery = "SHOW TABLES LIKE 'games'";
        $tableCheck = $conn->query($tableCheckQuery);
        
        if ($tableCheck->num_rows == 0) {
            $conn->close();
            return ["error" => "Tables don't exist", "solution" => "Please create the required tables first."];
        }
        
        // If we already have data, skip
        $gamesResult = $conn->query("SELECT COUNT(*) as count FROM games");
        $gamesCount = $gamesResult->fetch_assoc()['count'];
        
        if ($gamesCount > 0) {
            $conn->close();
            return ["message" => "Database already has data. Skipping initialization.", "count" => $gamesCount];
        }
        
        // Fetch games from Mockaroo (JSON)
        $games = fetchMockarooData('gamedata');
        if (isset($games['error'])) {
            return ["error" => "Error fetching game data from Mockaroo", "details" => $games];
        }
        
        $conn->begin_transaction();
        logDebug("Starting transaction for data population with " . count($games) . " games");
        
        // Insert games
        $gameStmt = $conn->prepare("INSERT INTO games (game_date, opponent, venue, niner_score, opponent_score) VALUES (?, ?, ?, ?, ?)");
        $insertedGames = 0;
        
        foreach ($games as $game) {
            // Fields from the JSON structure
            $gameDate = isset($game['game_date']) ? $game['game_date'] : '';
            $opponent = isset($game['opponent']) ? $game['opponent'] : '';
            $venue = isset($game['venue']) ? $game['venue'] : 'Home'; // Default venue if not provided
            
            // Fix: Properly handle niners_score from Mockaroo data
            // The issue is in how we're using the field names
            $ninerScore = isset($game['niners_score']) ? (int)$game['niners_score'] : 0;
            
            // Also handle opponent_score properly
            $opponentScore = isset($game['opponent_score']) ? (int)$game['opponent_score'] : 0;
            
            // Debug the scores to make sure we're getting the right values
            logDebug("Game score data - niners: $ninerScore, opponent: $opponentScore");
            
            $gameStmt->bind_param("sssii", 
                $gameDate,
                $opponent,
                $venue,
                $ninerScore,
                $opponentScore
            );
            
            if ($gameStmt->execute()) {
                $gameId = $conn->insert_id;
                $insertedGames++;
                
                // Now fetch players for this game
                $playerData = fetchMockarooData('playerdata');
                if (isset($playerData['error'])) {
                    $conn->rollback();
                    $conn->close();
                    return ["error" => "Error fetching player data from Mockaroo", "details" => $playerData];
                }
                
                // Insert players for this game
                foreach ($playerData as $player) {
                    if (!isset($player['player_name'])) {
                        continue; // Skip invalid entries
                    }
                    
                    $playerName = $player['player_name'];
                    $touchdowns = isset($player['touchdowns']) ? (int)$player['touchdowns'] : 0;
                    $yards = isset($player['yards']) ? (int)$player['yards'] : 0;
                    $tackles = isset($player['tackles']) ? (int)$player['tackles'] : 0;
                    
                    $playerStmt = $conn->prepare("INSERT INTO players (game_id, player_name, touchdowns, yards, tackles) VALUES (?, ?, ?, ?, ?)");
                    $playerStmt->bind_param("isiii", 
                        $gameId,
                        $playerName,
                        $touchdowns,
                        $yards,
                        $tackles
                    );
                    $playerStmt->execute();
                    $playerStmt->close();
                }
            } else {
                logDebug("Failed to insert game: " . $conn->error);
            }
        }
        
        $gameStmt->close();
        $conn->commit();
        $conn->close();
        
        return [
            "success" => true,
            "message" => "Database initialized with Mockaroo JSON data",
            "games_added" => $insertedGames
        ];
    } catch (Exception $e) {
        if ($conn) {
            if (method_exists($conn, 'inTransaction') && $conn->inTransaction()) {
                $conn->rollback();
            }
            $conn->close();
        }
        logDebug("Populate data error: " . $e->getMessage());
        return ["error" => "Database error during populateInitialData", "details" => $e->getMessage()];
    }
}

// Test database connection and table existence
function testDatabaseSetup() {
    $conn = connectToDatabase();
    if (!$conn) {
        return ["error" => "Database connection failed", "details" => "Check your MySQL credentials."];
    }
    
    try {
        $status = ["database_connection" => "Connected successfully"];
        
        // Check if tables exist
        $tables = ['games', 'players'];
        $missingTables = [];
        
        foreach ($tables as $table) {
            $result = $conn->query("SHOW TABLES LIKE '$table'");
            if ($result->num_rows == 0) {
                $missingTables[] = $table;
            }
        }
        
        if (empty($missingTables)) {
            $status["tables"] = "All required tables exist";
            
            // Check record counts
            $gameCount = $conn->query("SELECT COUNT(*) as count FROM games")->fetch_assoc()['count'];
            $playerCount = $conn->query("SELECT COUNT(*) as count FROM players")->fetch_assoc()['count'];
            
            $status["records"] = [
                "games" => intval($gameCount),
                "players" => intval($playerCount)
            ];
        } else {
            $status["tables"] = "Missing tables: " . implode(", ", $missingTables);
            $status["solution"] = "Create the required tables or run the initialization.";
        }
        
        $conn->close();
        return $status;
    } catch (Exception $e) {
        $conn->close();
        return ["error" => "Database test error: " . $e->getMessage()];
    }
}

// Get players for a specific game
function getGamePlayerStats($gameId) {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        // Check if we already have players for this game
        $stmtCount = $conn->prepare("SELECT COUNT(*) as count FROM players WHERE game_id = ?");
        $stmtCount->bind_param("i", $gameId);
        $stmtCount->execute();
        $countResult = $stmtCount->get_result()->fetch_assoc();
        $stmtCount->close();
        
        // If there are records, just fetch them
        if ($countResult['count'] > 0) {
            $stmt = $conn->prepare("SELECT p.id, p.player_name, p.touchdowns, p.yards, p.tackles, 1 as games_played 
                                      FROM players p 
                                     WHERE p.game_id = ?");
            $stmt->bind_param("i", $gameId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $players = [];
            while ($row = $result->fetch_assoc()) {
                // Assign a generic position if needed (remove any real-player references)
                $row['position'] = assignGenericPosition($row['touchdowns'], $row['yards'], $row['tackles']);
                $players[] = $row;
            }
            $stmt->close();
            $conn->close();
            return $players;
        }
        
        // If no players found for this game, we can optionally fetch from CSV again,
        // or just return an empty array. For now, return empty.
        $conn->close();
        return [];
    } catch (Exception $e) {
        if ($conn) {
            $conn->close();
        }
        return ["error" => "Database error: " . $e->getMessage()];
    }
}

// A generic position assignment function with no hardcoded names
function assignGenericPosition($touchdowns, $yards, $tackles) {
    // Basic logic to guess position from stats
    $td = (int)$touchdowns;
    $yd = (int)$yards;
    $tk = (int)$tackles;
    
    // Example logic: you can expand or simplify as needed
    if ($td > 20) return 'QB';
    if ($td >= 5 && $yd > 500) return 'WR';
    if ($tk > 50) return 'LB';
    
    // Default to 'N/A'
    return 'N/A';
}

// Calculate player ranks (optional, but kept for completeness)
function calculatePlayerRanks($players) {
    if (!is_array($players) || empty($players)) {
        return $players;
    }
    
    // Copy for sorting
    $playersWithRanks = $players;
    
    // Sort by "season score"
    usort($playersWithRanks, function($a, $b) {
        $scoreA = ($a['touchdowns'] * 6) + ($a['yards'] * 0.1) + ($a['tackles'] * 0.5);
        $scoreB = ($b['touchdowns'] * 6) + ($b['yards'] * 0.1) + ($b['tackles'] * 0.5);
        return $scoreB <=> $scoreA;
    });
    
    foreach ($playersWithRanks as $i => $player) {
        // Find the original index in $players and assign
        foreach ($players as $j => $p) {
            if ($p['id'] === $player['id']) {
                $players[$j]['seasonRank'] = $i + 1;
                break;
            }
        }
    }
    
    // Sort by "game rank" (touchdowns desc, then yards desc)
    usort($playersWithRanks, function($a, $b) {
        if ($a['touchdowns'] !== $b['touchdowns']) {
            return $b['touchdowns'] <=> $a['touchdowns'];
        }
        return $b['yards'] <=> $a['yards'];
    });
    
    foreach ($playersWithRanks as $i => $player) {
        foreach ($players as $j => $p) {
            if ($p['id'] === $player['id']) {
                $players[$j]['gameRank'] = $i + 1;
                break;
            }
        }
    }
    
    return $players;
}

// Wipe and regenerate database solely with Mockaroo CSV data
function regenerateDatabase() {
    $conn = connectToDatabase();
    if (!$conn) return ["error" => "Database connection failed"];
    
    try {
        $conn->begin_transaction();
        $conn->query("SET FOREIGN_KEY_CHECKS = 0");
        $conn->query("TRUNCATE TABLE players");
        $conn->query("TRUNCATE TABLE games");
        $conn->query("SET FOREIGN_KEY_CHECKS = 1");
        
        logDebug("Tables cleared successfully");
        
        // Fetch fresh games from Mockaroo
        $games = fetchMockarooData('gamedata');
        if (isset($games['error'])) {
            return ["error" => "Error fetching game data", "details" => $games];
        }
        
        // Insert games
        $gameStmt = $conn->prepare("INSERT INTO games (game_date, opponent, venue, niner_score, opponent_score) VALUES (?, ?, ?, ?, ?)");
        $insertedGames = 0;
        
        foreach ($games as $game) {
            $gameDate = isset($game['game_date']) ? $game['game_date'] : '';
            $opponent = isset($game['opponent']) ? $game['opponent'] : '';
            $venue = isset($game['venue']) ? $game['venue'] : 'Home'; // Default venue if needed
            
            // Fix: Use the correct JSON field names and ensure we're getting the scores correctly
            $ninerScore = isset($game['niners_score']) ? (int)$game['niners_score'] : 0;
            $opponentScore = isset($game['opponent_score']) ? (int)$game['opponent_score'] : 0;
            
            // Log the values for debugging
            logDebug("Regenerate - Game score data - niners: $ninerScore, opponent: $opponentScore");
            
            $gameStmt->bind_param("sssii",
                $gameDate,
                $opponent,
                $venue,
                $ninerScore,
                $opponentScore
            );
            $gameStmt->execute();
            $gameId = $conn->insert_id;
            $insertedGames++;
            
            // Fetch fresh player data from Mockaroo for each game
            $playerData = fetchMockarooData('playerdata');
            if (isset($playerData['error'])) {
                return ["error" => "Error fetching player data", "details" => $playerData];
            }
            
            // Insert all the players from the CSV
            foreach ($playerData as $playerRow) {
                if (!isset($playerRow['player_name'])) {
                    continue; // skip invalid rows
                }
                
                $playerName = $playerRow['player_name'];
                $touchdowns = isset($playerRow['touchdowns']) ? (int)$playerRow['touchdowns'] : 0;
                $yards      = isset($playerRow['yards'])      ? (int)$playerRow['yards']      : 0;
                $tackles    = isset($playerRow['tackles'])    ? (int)$playerRow['tackles']    : 0;
                
                $playerStmt = $conn->prepare("INSERT INTO players (game_id, player_name, touchdowns, yards, tackles) VALUES (?, ?, ?, ?, ?)");
                $playerStmt->bind_param("isiii",
                    $gameId,
                    $playerName,
                    $touchdowns,
                    $yards,
                    $tackles
                );
                $playerStmt->execute();
                $playerStmt->close();
            }
        }
        
        $gameStmt->close();
        $conn->commit();
        $conn->close();
        
        return [
            "success" => true, 
            "message" => "Database regenerated with Mockaroo JSON data", 
            "games_added" => $insertedGames
        ];
    } catch (Exception $e) {
        if ($conn) {
            if (method_exists($conn, 'inTransaction') && $conn->inTransaction()) {
                $conn->rollback();
            }
            $conn->close();
        }
        logDebug("Regenerate database error: " . $e->getMessage());
        return ["error" => "Failed to regenerate database: " . $e->getMessage()];
    }
}

// MAIN ROUTING LOGIC
try {
    // For debugging in development, you might turn this on:
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Handle OPTIONS preflight
    if ($method == 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    
    // Parse JSON body for POST/PUT
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['table'])) {
                $table = $_GET['table'];
                logDebug("Handling GET for table: $table");
                
                // Database test
                if ($table === 'test') {
                    $conn = connectToDatabase();
                    if (!$conn) {
                        echo json_encode([
                            "db_status" => "connection_failed",
                            "message" => "Could not connect to MySQL database.",
                            "note" => "The dashboard can still attempt to use Mockaroo data."
                        ]);
                    } else {
                        $result = testDatabaseSetup();
                        $conn->close();
                        echo json_encode($result);
                    }
                    break;
                }
                
                // Initialize DB with Mockaroo CSV data
                if ($table === 'init') {
                    $result = populateInitialData();
                    echo json_encode($result);
                    break;
                }
                
                // Return all or single game
                if ($table === 'games') {
                    if (isset($_GET['id'])) {
                        $result = getGameById($_GET['id']);
                        echo json_encode($result);
                    } else {
                        $result = getAllGames();
                        echo json_encode($result);
                    }
                    break;
                }
                
                // Return all or single player
                if ($table === 'players') {
                    if (isset($_GET['id'])) {
                        $result = getPlayerById($_GET['id']);
                        echo json_encode($result);
                    } else {
                        $result = getAllPlayers();
                        echo json_encode($result);
                    }
                    break;
                }
                
                // Return players for a specific game
                if ($table === 'gameplayers' && isset($_GET['gameId'])) {
                    $gameId = $_GET['gameId'];
                    $players = getGamePlayerStats($gameId);
                    $playersWithRanks = calculatePlayerRanks($players);
                    echo json_encode($playersWithRanks);
                    break;
                }
                
                // Wipe and regenerate DB
                if ($table === 'regenerate') {
                    $result = regenerateDatabase();
                    echo json_encode($result);
                    break;
                }
                
                echo json_encode(["error" => "Unknown table specified: $table"]);
            } else {
                echo json_encode(["error" => "No table specified"]);
            }
            break;
        
        case 'POST':
            if (isset($_GET['table'])) {
                $table = $_GET['table'];
                logDebug("Handling POST for table: $table");
                
                if ($table === 'games') {
                    if (!$input) {
                        echo json_encode(["error" => "No data provided"]);
                        break;
                    }
                    $result = createGame($input);
                    echo json_encode($result);
                } elseif ($table === 'players') {
                    if (!$input) {
                        echo json_encode(["error" => "No data provided"]);
                        break;
                    }
                    $result = createPlayer($input);
                    echo json_encode($result);
                } else {
                    echo json_encode(["error" => "Unknown table specified: $table"]);
                }
            } else {
                echo json_encode(["error" => "No table specified"]);
            }
            break;
        
        case 'PUT':
            if (isset($_GET['table']) && isset($_GET['id'])) {
                $table = $_GET['table'];
                $id = $_GET['id'];
                logDebug("Handling PUT for table: $table, id: $id");
                
                if (!$input) {
                    echo json_encode(["error" => "No data provided"]);
                    break;
                }
                
                if ($table === 'games') {
                    $result = updateGame($id, $input);
                    echo json_encode($result);
                } elseif ($table === 'players') {
                    $result = updatePlayer($id, $input);
                    echo json_encode($result);
                } else {
                    echo json_encode(["error" => "Unknown table specified: $table"]);
                }
            } else {
                echo json_encode(["error" => "Table or ID not specified"]);
            }
            break;
        
        case 'DELETE':
            if (isset($_GET['table']) && isset($_GET['id'])) {
                $table = $_GET['table'];
                $id = $_GET['id'];
                logDebug("Handling DELETE for table: $table, id: $id");
                
                if ($table === 'games') {
                    $result = deleteGame($id);
                    echo json_encode($result);
                } elseif ($table === 'players') {
                    $result = deletePlayer($id);
                    echo json_encode($result);
                } else {
                    echo json_encode(["error" => "Unknown table specified: $table"]);
                }
            } else {
                echo json_encode(["error" => "Table or ID not specified"]);
            }
            break;
        
        default:
            echo json_encode(["error" => "Unsupported method"]);
    }
} catch (Exception $e) {
    logDebug("Exception: " . $e->getMessage());
    if (!headers_sent()) {
        header("Content-Type: application/json");
    }
    echo json_encode(["error" => "Server error: " . $e->getMessage()]);
}