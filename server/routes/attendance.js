const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');
const { completeQuestForHero } = require('../services/gamification');

function parsePositiveInt(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

/**
 * @route   POST /attendance/register
 * @desc    Register the authenticated Hero for an APPROVED Quest and return qrToken
 * @access  Private (Hero)
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const heroId = req.user.id;
    const parsedQuestId = parsePositiveInt(req.body.questId);

    if (!parsedQuestId) {
      return res.status(400).json({ error: 'Valid positive questId is required.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const quest = await tx.quest.findUnique({
        where: { id: parsedQuestId },
        include: { _count: { select: { registrations: true } } },
      });

      if (!quest) {
        return { status: 404, body: { error: 'Quest not found.' } };
      }

      if (quest.status !== 'APPROVED') {
        return {
          status: 400,
          body: { error: `Cannot register for a ${quest.status} quest.` },
        };
      }

      if (quest.endTime && new Date() > new Date(quest.endTime)) {
        return {
          status: 400,
          body: { error: 'Cannot register for a quest that has already ended.' },
        };
      }

      const existingRegistration = await tx.registration.findUnique({
        where: {
          heroId_questId: { heroId, questId: quest.id },
        },
      });

      if (existingRegistration) {
        return {
          status: 200,
          body: {
            message: 'Already registered for this quest.',
            registration: existingRegistration,
          },
        };
      }

      if (quest.capacity != null && quest._count.registrations >= quest.capacity) {
        return { status: 409, body: { error: 'Quest capacity has been reached.' } };
      }

      const registration = await tx.registration.create({
        data: {
          heroId,
          questId: quest.id,
        },
      });

      return {
        status: 201,
        body: {
          message: 'Registered for quest successfully!',
          registration,
        },
      };
    });

    return res.status(result.status).json(result.body);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Already registered for this quest.' });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register for quest.' });
  }
});

/**
 * @route   POST /attendance/checkin
 * @desc    Verify registration qrToken or check-in code, issue badge, and award XP atomically
 * @access  Private (Hero)
 */
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const heroId = req.user.id;
    const parsedQuestId = parsePositiveInt(req.body.questId);
    const rawCode = req.body.checkInCode;

    if (!parsedQuestId || typeof rawCode !== 'string' || !rawCode.trim()) {
      return res.status(400).json({ error: 'Valid questId and non-empty checkInCode are required.' });
    }

    const code = rawCode.trim();

    const quest = await prisma.quest.findUnique({
      where: { id: parsedQuestId },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    if (quest.status !== 'APPROVED') {
      return res.status(400).json({
        error: `Check-in is not allowed for a ${quest.status} quest.`,
      });
    }

    if (quest.endTime && new Date() > new Date(quest.endTime)) {
      return res.status(400).json({ error: 'This quest has already ended.' });
    }

    // Check if already checked in early for a clear 409 response
    const existingBadge = await prisma.badge.findUnique({
      where: {
        heroId_questId: { heroId, questId: quest.id },
      },
    });

    if (existingBadge) {
      return res.status(409).json({ error: 'You have already checked into this quest.' });
    }

    // Validate check-in code against personal Registration.qrToken or configured secret
    const registration = await prisma.registration.findUnique({
      where: {
        heroId_questId: { heroId, questId: quest.id },
      },
    });

    const matchesQrToken = Boolean(registration && registration.qrToken && registration.qrToken === code);
    const matchesEnvCode = Boolean(
      process.env.QUEST_CHECKIN_CODE && code === process.env.QUEST_CHECKIN_CODE
    );
    const matchesDevFallback =
      process.env.NODE_ENV !== 'production' && code === `QUEST-${quest.id}`;

    if (!matchesQrToken && !matchesEnvCode && !matchesDevFallback) {
      return res.status(401).json({ error: 'Invalid check-in or QR code.' });
    }

    const result = await completeQuestForHero(heroId, quest.id);

    return res.status(200).json({
      message: result.message,
      xpEarned: result.xpEarned,
      newTotalXp: result.newTotalXp,
      newLevel: result.newLevel,
      leveledUp: result.leveledUp,
      progress: result.progress,
      badge: result.badge,
      hero: result.updatedHero,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You have already checked into this quest.' });
    }
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Internal server error during attendance check-in.' });
  }
});

/**
 * @route   GET /attendance/leaderboard/heroes
 * @desc    Fetch top heroes ranked by XP & level
 * @access  Public
 */
router.get('/leaderboard/heroes', async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 100);

    const heroes = await prisma.hero.findMany({
      orderBy: [{ xp: 'desc' }, { level: 'desc' }, { id: 'asc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        role: true,
        xp: true,
        level: true,
        ledGuild: {
          select: { name: true },
        },
        _count: {
          select: { badges: true },
        },
      },
    });

    const leaderboard = heroes.map((hero, index) => ({
      rank: index + 1,
      id: hero.id,
      name: hero.name,
      role: hero.role,
      xp: hero.xp,
      level: hero.level,
      badgesCount: hero._count.badges,
      guild: hero.ledGuild ? hero.ledGuild.name : 'Campus Hero',
    }));

    return res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve hero leaderboard.' });
  }
});

/**
 * @route   GET /attendance/leaderboard/guilds
 * @desc    Fetch active guilds ranked by total attendance XP and hosted quests
 * @access  Public
 */
router.get('/leaderboard/guilds', async (req, res) => {
  try {
    const guilds = await prisma.guild.findMany({
      include: {
        master: {
          select: { id: true, name: true, xp: true, level: true },
        },
        quests: {
          where: { status: { in: ['APPROVED', 'COMPLETED'] } },
          select: {
            xpReward: true,
            _count: { select: { badges: true } },
          },
        },
      },
    });

    const standings = guilds
      .map((guild) => {
        const questAttendanceXp = guild.quests.reduce(
          (sum, q) => sum + q.xpReward * q._count.badges,
          0
        );
        const totalAttendees = guild.quests.reduce(
          (sum, q) => sum + q._count.badges,
          0
        );

        return {
          id: guild.id,
          name: guild.name,
          description: guild.description,
          logoUrl: guild.logoUrl,
          guildMaster: guild.master ? guild.master.name : 'Unassigned',
          totalXp: questAttendanceXp,
          questsHosted: guild.quests.length,
          totalAttendees,
        };
      })
      .sort((a, b) => b.totalXp - a.totalXp || b.totalAttendees - a.totalAttendees || a.id - b.id)
      .map((guild, index) => ({
        rank: index + 1,
        ...guild,
      }));

    return res.status(200).json({ standings });
  } catch (error) {
    console.error('Guild leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to retrieve guild standings.' });
  }
});

module.exports = router;