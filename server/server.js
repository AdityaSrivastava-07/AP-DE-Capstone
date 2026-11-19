const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const managementRoutes = require('./routes/management');

app.use('/auth', authRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/manage', managementRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Heroics Gamification API is running! ⚔️' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});