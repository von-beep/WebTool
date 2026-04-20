const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nexus_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let db;

// Initialize database
async function initDatabase() {
  try {
    db = await mysql.createPool(dbConfig);

    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS pending_users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        fullName VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userEmail VARCHAR(255) NOT NULL,
        userName VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        timestamp VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS holiday_requests (
        id VARCHAR(36) PRIMARY KEY,
        userEmail VARCHAR(255) NOT NULL,
        userName VARCHAR(255) NOT NULL,
        holidayName VARCHAR(255) NOT NULL,
        holidayDate DATE NOT NULL,
        details TEXT,
        status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
        timestamp VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS leave_applications (
        id VARCHAR(36) PRIMARY KEY,
        userEmail VARCHAR(255) NOT NULL,
        userName VARCHAR(255) NOT NULL,
        leaveType VARCHAR(255) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        details TEXT,
        status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
        timestamp VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}

// API Routes

// Get all data
app.get('/api/data', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT * FROM users ORDER BY created_at DESC');
    const [pendingUsers] = await db.execute('SELECT * FROM pending_users ORDER BY created_at DESC');
    const [logs] = await db.execute('SELECT * FROM logs ORDER BY created_at DESC');
    const [holidayRequests] = await db.execute('SELECT * FROM holiday_requests ORDER BY created_at DESC');
    const [leaveApplications] = await db.execute('SELECT * FROM leave_applications ORDER BY created_at DESC');

    res.json({
      users,
      pendingUsers,
      logs,
      holidayRequests,
      leaveApplications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Add user
app.post('/api/users', async (req, res) => {
  try {
    const { id, email, password, fullName, role } = req.body;
    await db.execute(
      'INSERT INTO users (id, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, password, fullName, role]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Add pending user
app.post('/api/pending-users', async (req, res) => {
  try {
    const { id, email, password, fullName, role } = req.body;
    await db.execute(
      'INSERT INTO pending_users (id, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, password, fullName, role]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add pending user' });
  }
});

// Remove user from pending and add to users
app.post('/api/approve-user', async (req, res) => {
  try {
    const { userId } = req.body;
    // Get user data
    const [users] = await db.execute('SELECT * FROM pending_users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = users[0];

    // Add to users
    await db.execute(
      'INSERT INTO users (id, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, user.password, user.fullName, user.role]
    );

    // Remove from pending
    await db.execute('DELETE FROM pending_users WHERE id = ?', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// Deny user
app.delete('/api/pending-users/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM pending_users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to deny user' });
  }
});

// Add log
app.post('/api/logs', async (req, res) => {
  try {
    const { userEmail, userName, type, timestamp } = req.body;
    await db.execute(
      'INSERT INTO logs (userEmail, userName, type, timestamp) VALUES (?, ?, ?, ?)',
      [userEmail, userName, type, timestamp]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add log' });
  }
});

// Add holiday request
app.post('/api/holiday-requests', async (req, res) => {
  try {
    const { id, userEmail, userName, holidayName, holidayDate, details, status, timestamp } = req.body;
    await db.execute(
      'INSERT INTO holiday_requests (id, userEmail, userName, holidayName, holidayDate, details, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userEmail, userName, holidayName, holidayDate, details, status, timestamp]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add holiday request' });
  }
});

// Update holiday request status
app.put('/api/holiday-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute(
      'UPDATE holiday_requests SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update holiday request' });
  }
});

// Add leave application
app.post('/api/leave-applications', async (req, res) => {
  try {
    const { id, userEmail, userName, leaveType, startDate, endDate, details, status, timestamp } = req.body;
    await db.execute(
      'INSERT INTO leave_applications (id, userEmail, userName, leaveType, startDate, endDate, details, status, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, userEmail, userName, leaveType, startDate, endDate, details, status, timestamp]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add leave application' });
  }
});

// Update leave application status
app.put('/api/leave-applications/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute(
      'UPDATE leave_applications SET status = ? WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update leave application' });
  }
});

// Authenticate user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (users.length > 0) {
      res.json({ success: true, user: users[0] });
    } else {
      // Check pending users
      const [pending] = await db.execute(
        'SELECT * FROM pending_users WHERE email = ?',
        [email]
      );
      if (pending.length > 0) {
        res.status(403).json({ error: 'Account pending approval' });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initDatabase();
});