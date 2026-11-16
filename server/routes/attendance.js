const express = require('express');
const router = express.Router();
const prisma = require('../prisma'); // Ensure this matches your centralized Prisma client import
const { authenticateToken } = require('../middleware/auth'); // Aditya's authentication middleware

/**
 * @route   POST /api/attendance/checkin
 * @desc    Verify QR/Check-in code, record attendance, and award XP atomically
 * @access  Private (Hero)
 */
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { questId, checkInCode } = req.body;
    const heroId = req.user.id; // Populated from JWT payload

    if (!questId || !checkInCode) {
      return res.status(400).json({ error: 'questId and checkInCode are required.' });
    }

    // 1. Fetch the Quest to verify existence and check-in code
    const quest = await prisma.quest.findUnique({
      where: { id: Number(questId) },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    // Verify check-in code match
    if (quest.checkInCode && quest.checkInCode !== checkInCode.trim()) {
      return res.status(401).json({ error: 'Invalid check-in or QR code.' });
    }

    // 2. Prevent duplicate check-ins for the same quest
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: heroId,
        questId: quest.id,
      },
    });

    if (existingAttendance) {
      return res.status(409).json({ error: 'You have already checked into this quest.' });
    }

    const xpEarned = quest.xpReward || 50; // Default fallback XP

    // 3. Perform atomic transaction: create attendance + update user XP + update guild XP
    const result = await prisma.$transaction(async (tx) => {
      const attendance = await tx.attendance.create({
        data: {
          userId: heroId,
          questId: quest.id,
          xpEarned,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: heroId },
        data: {
          xp: { increment: xpEarned },
        },
        select: {
          id: true,
          name: true,
          xp: true,
          guildId: true,
        },
      });

      // Update Guild total XP if the hero belongs to one
      if (updatedUser.guildId) {
        await tx.guild.update({
          where: { id: updatedUser.guildId },
          data: {
            totalXp: { increment: xpEarned },
          },
        });
      }

      return { attendance, updatedUser };
    });

    return res.status(200).json({
      message: `Successfully checked in! Awarded +${xpEarned} XP.`,
      xpEarned,
      newTotalXp: result.updatedUser.xp,
      attendanceRecord: result.attendance,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Internal server error during attendance check-in.' });
  }
});

/**
 * @route   GET /api/attendance/leaderboard/heroes
 * @desc    Fetch top heroes ranked by XP
 * @access  Public
 */
router.get('/leaderboard/heroes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const heroes = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        xp: true,
        guild: {
          select: { name: true },
        },
      },
    });

    const leaderboard = heroes.map((hero, index) => ({
      rank: index + 1,
      name: hero.name,
      xp: hero.xp,
      guild: hero.guild ? hero.guild.name : 'Independent Hero',
    }));

    return res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve hero leaderboard.' });
  }
});

module.exports = router;