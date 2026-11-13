const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { completeQuestForHero } = require('../services/gamification');

const router = express.Router();

// CHECK-IN / VERIFY QUEST ATTENDANCE
router.post('/verify', verifyToken, async (req, res) => {
  const { questId } = req.body;
  const heroId = req.user.id; // Extracted securely from the JWT token

  try {
    const result = await completeQuestForHero(heroId, questId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to verify attendance.' });
  }
});

module.exports = router;