# Nexus Portal

Integrated Attendance & Holiday Intelligence System

## Features

- User authentication and registration
- Attendance logging (Time In/Out)
- Holiday calendar with Philippine holidays
- Admin dashboard for user management
- Holiday work request system

## Tech Stack

- **Frontend**: React 18 with Tailwind CSS
- **Backend**: Node.js/Express API
- **Database**: MySQL
- **Icons**: Lucide React

## Architecture

- **Frontend**: React app (http://localhost:3000)
- **Backend**: Express API server (http://localhost:5000)
- **Database**: MySQL database

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MySQL Server** (v5.7 or higher)
3. **npm** or **yarn**

## MySQL Setup

### 1. Install MySQL
- **Windows**: Download from https://dev.mysql.com/downloads/mysql/
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt install mysql-server`

### 2. Start MySQL Service
```bash
# Windows (as Administrator)
net start mysql

# macOS/Linux
sudo systemctl start mysql
# or
brew services start mysql
```

### 3. Create Database
```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE nexus_portal;

-- Optional: Create dedicated user
CREATE USER 'nexus_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON nexus_portal.* TO 'nexus_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

## Project Structure

```
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json       # Backend dependencies
│   └── .env              # Database configuration
├── src/
│   ├── components/
│   │   └── HolidayCalendarView.js
│   ├── config/
│   │   ├── api.js        # API client functions
│   │   └── constants.js  # App constants
│   ├── App.js
│   ├── index.js
│   └── index.css
├── public/
└── package.json          # Frontend dependencies
```

## Quick Start (File-Based Backend)

For immediate testing without MySQL setup, use the file-based mock backend:

```bash
# Start mock backend (stores data in JSON file)
cd backend
npm run mock  # or: node mock-server.js

# In another terminal, start frontend
cd ..
npm start
```

**Benefits:**
- ✅ No database setup required
- ✅ Data persists in `backend/data.json`
- ✅ All features work immediately
- ✅ Perfect for development/demo

## Full MySQL Setup (Optional)

For production use with MySQL database:

## Database Schema

The system automatically creates these MySQL tables:

- **users**: Approved user accounts
- **pending_users**: Users awaiting approval
- **logs**: Attendance records
- **holiday_requests**: Holiday work requests

## Usage

1. **Start MySQL**: Ensure MySQL server is running
2. **Start Backend**: `cd backend && npm run dev`
3. **Start Frontend**: `npm start`
4. **Access App**: http://localhost:3000

## Default Admin Setup

1. Visit the app
2. Click "Admin Setup"
3. Use access code: `ADMIN-2024-SECURE`
4. Create your admin account

## API Endpoints

- `GET /api/data` - Get all app data
- `POST /api/auth/login` - User authentication
- `POST /api/users` - Add approved user
- `POST /api/pending-users` - Add user for approval
- `POST /api/logs` - Record attendance
- `POST /api/holiday-requests` - Submit holiday request
- And more...

- Landing page: Choose between login, user registration, or admin setup
- Users can log attendance and view holiday calendar
- Admins can approve user registrations and holiday requests

## Notes

- Uses anonymous authentication by default
- Holiday data fetched from Nager.Date API
- All data stored in Firestore