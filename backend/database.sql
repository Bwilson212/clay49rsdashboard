CREATE DATABASE IF NOT EXISTS ninersdb;
USE ninersdb;

CREATE TABLE IF NOT EXISTS games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_date DATETIME NOT NULL,
  opponent VARCHAR(100) NOT NULL,
  venue VARCHAR(100) NOT NULL,
  niner_score INT NOT NULL,
  opponent_score INT NOT NULL
);

CREATE TABLE IF NOT EXISTS players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_id INT NOT NULL,
  player_name VARCHAR(100) NOT NULL,
  touchdowns INT DEFAULT 0,
  yards INT DEFAULT 0,
  tackles INT DEFAULT 0,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);