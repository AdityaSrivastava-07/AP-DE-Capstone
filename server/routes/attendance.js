const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   POST /attendance/register
 * @desc    Register the authenticated Hero for a Quest and return qrToken
 * @access  Private (Hero)
 */
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { questId } = req.body;
    const heroId = req.user.id;
    const parsedQuestId = Number(questId);

    if (!parsedQuestId) {
      return res.status(400).json({ error: 'Valid questId is required.' });
    }

    const quest = await prisma.quest.findUnique({
      where: { id: parsedQuestId },
      include: { _count: { select: { registrations: true } } },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    if (quest.status !== 'APPROVED') {
      return res.status(400).json({ error: `Cannot register for a ${quest.status} quest.` });
    }

    const existingRegistration = await prisma.registration.findUnique({
      where: {
        heroId_questId: { heroId, questId: quest.id },
      },
    });

    if (existingRegistration) {
      return res.status(200).json({
        message: 'Already registered for this quest.',
        registration: existingRegistration,
      });
    }

    if (quest._count.registrations >= quest.capacity) {
      return res.status(409).json({ error: 'Quest capacity has been reached.' });
    }

    const registration = await prisma.registration.create({
      data: {
        heroId,
        questId: quest.id,
      },
    });

    return res.status(201).json({
      message: 'Registered for quest successfully!',
      registration,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to register for quest.' });
  }
});

/**
 * @route   POST /attendance/checkin
 * @desc    Verify registration/check-in code, record attendance badge, and award XP atomically
 * @access  Private (Hero)
 */
router.post('/checkin', authenticateToken, async (req, res) => {
  try {
    const { questId, checkInCode } = req.body;
    const heroId = req.user.id;
    const parsedQuestId = Number(questId);

    if (!parsedQuestId || !checkInCode || !String(checkInCode).trim()) {
      return res.status(400).json({ error: 'questId and checkInCode are required.' });
    }

    const code = String(checkInCode).trim();

    const quest = await prisma.quest.findUnique({
      where: { id: parsedQuestId },
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found.' });
    }

    // Check if the hero already earned a badge (checked in) for this quest
    const existingBadge = await prisma.badge.findUnique({
      where: {
        heroId_questId: { heroId, questId: quest.id },
      },
    });

    if (existingBadge) {
      return res.status(409).json({ error: 'You have already checked into this quest.' });
    }

    // Match either a personal registration qrToken for this quest or a quest check-in code
    const registration = await prisma.registration.findUnique({
      where: {
        heroId_questId: { heroId, questId: quest.id },
      },
    });

    const matchesQrToken = registration && registration.qrToken === code;
    const matchesQuestCode =
      (process.env.QUEST_CHECKIN_CODE && code === process.env.QUEST_CHECKIN_CODE) ||
      code === `QUEST-${quest.id}`;

    if (!matchesQrToken && !matchesQuestCode) {
      return res.status(401).json({ error: 'Invalid check-in or QR code.' });
    }

    const xpEarned = quest.xpReward || 50;

    const result = await prisma.$transaction(async (tx) => {
      // Ensure a Registration row exists even if checked in via event code
      const ensuredRegistration =
        registration ||
        (await tx.registration.create({
          data: { heroId, questId: quest.id },
        }));

      const badge = await tx.badge.create({
        data: {
          heroId,
          questId: quest.id,
        },
      });

      const currentHero = await tx.hero.findUnique({
        where: { id: heroId },
        select: { xp: true },
      });

      const newTotalXp = (currentHero?.xp ?? 0) + xpEarned;
      const newLevel = Math.floor(newTotalXp / 500) + 1;

      const updatedHero = await tx.hero.update({
        where: { id: heroId },
        data: {
          xp: newTotalXp,
          level: newLevel,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          xp: true,
          level: true,
        },
      });

      return { badge, updatedHero, registration: ensuredRegistration };
    });

    return res.status(200).json({
      message: `Successfully checked in! Awarded +${xpEarned} XP.`,
      xpEarned,
      newTotalXp: result.updatedHero.xp,
      newLevel: result.updatedHero.level,
      badge: result.badge,
      hero: result.updatedHero,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ error: 'Internal server error during attendance check-in.' });
  }
});

/**
 * @route   GET /attendance/leaderboard/heroes
 * @desc    Fetch top heroes ranked by XP
 * @access  Public
 */
router.get('/leaderboard/heroes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const heroes = await prisma.hero.findMany({
      orderBy: [{ xp: 'desc' }, { id: 'asc' }],
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

module.exports = router;