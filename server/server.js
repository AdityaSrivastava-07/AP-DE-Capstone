const express = require('express');
const cors = require('cors');

const app = express();

const attendanceRoutes = require('./routes/attendance');
app.use('/attendance', attendanceRoutes);

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'Heroics Gamification API is running! ⚔️' });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

