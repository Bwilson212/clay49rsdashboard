startup: 
brew install php
brew install mysql
brew services start mysql
mysql -u root < backend/database.sql
npm install
php -S localhost:8000
npm run dev

PROJECT OVERVIEW:
This is my implementation of the 49ers dashboard, attempting to meet both the
front and back end spec.  The MySQL database is hosted locally, Mockaroo data
is fetched using a php api file, the dashboard page renders the information 
very close to the adobe info provided, and the admin page at the bottom 
allows you to perform CRUD operations on the database.

KEY FILES AND COMPONENTS:

backend/api.php:
The primary file of our backend, this handles fetching Mockaroo Data
and provides endpoints for our javascript components to get player/game info.

backend/database.sql:
SQL schema we use to initialize our MySQL database
Defines a structure for players and games data

components/scores.js:
Displays game scores in a horizontal scrollable view,
close match to the game score in the adobe mockup.

components/leaderboard.js:
Displays player statistics in a sortable table,
Can filter by attribute or name, allows for export.

utils/api.js:
Frontend utility functions for API requests to the PHP
backend, handles creation, updating, deleting.

pages/index.js:
Main dashboard page that combines scores and leaderboard components.
Provides interactivity between game selection and player display,
as well as the popups for selecting players.

pages/admin.js:
Administrative interface for managing game and player data, 
I wanted to make sure I was being thorough in meeting the CRUD
requirements.
