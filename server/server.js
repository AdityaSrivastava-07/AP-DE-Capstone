const express = require('express');
const cors = require('cors');

const app = express();

// 1. Core Middlewares
app.use(cors());
app.use(express.json());

// 2. Import Routes (Must be declared before app.use)
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');

// 3. Register Routes
app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'Heroics Gamification API is running! ⚔️' });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});