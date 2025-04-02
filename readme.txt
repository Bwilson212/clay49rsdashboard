startup: 
brew install php
mysql -u root < backend/database.sql
npm install
php -S localhost:8000
npm run dev