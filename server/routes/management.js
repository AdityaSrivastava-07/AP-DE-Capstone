const express = require('express');
const prisma = require('../prisma');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

const canManage = requireRole('GUILD_MASTER', 'ADMIN');

// GET /manage/guilds — List all guilds with Guild Master and quest count
router.get('/guilds', verifyToken, async (req, res) => {
  try {
    const guilds = await prisma.guild.findMany({
      include: {
        master: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { quests: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ guilds });
  } catch (err) {
    console.error('Error fetching guilds:', err);
    res.status(500).json({ error: 'Failed to load guilds.' });
  }
});

// POST /manage/guilds — Create a new Guild (GUILD_MASTER or ADMIN)
router.post('/guilds', verifyToken, canManage, async (req, res) => {
  try {
    const { name, description, logoUrl, headId } = req.body;
    const resolvedHeadId = Number(headId) || req.user.id;

    if (!name || !description) {
      return res.status(400).json({ error: 'name and description are required.' });
    }

    const headHero = await prisma.hero.findUnique({ where: { id: resolvedHeadId } });
    if (!headHero) {
      return res.status(404).json({ error: 'Assigned headId Hero not found.' });
    }

    const guild = await prisma.guild.create({
      data: {
        name,
        description,
        logoUrl: logoUrl || null,
        headId: resolvedHeadId,
      },
      include: {
        master: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json({ message: 'Guild created successfully!', guild });
  } catch (err) {
    console.error('Error creating guild:', err);
    if (err.code === 'P2002') {
      return res.status(400).json({
        error: 'Guild name or headId is already assigned to another guild.',
      });
    }
    res.status(500).json({ error: 'Failed to create guild.' });
  }
});

// GET /manage/quests — List quests with guild info and registration count
router.get('/quests', async (req, res) => {
  try {
    const quests = await prisma.quest.findMany({
      include: {
        guild: { select: { id: true, name: true } },
        _count: { select: { registrations: true, badges: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    res.json({ quests });
  } catch (err) {
    console.error('Error fetching quests:', err);
    res.status(500).json({ error: 'Failed to load quests.' });
  }
});

// POST /manage/quests — Create a new Quest (GUILD_MASTER or ADMIN)
router.post('/quests', verifyToken, canManage, async (req, res) => {
  try {
    const {
      title,
      description,
      venue,
      capacity,
      xpReward,
      status,
      startTime,
      endTime,
      guildId,
    } = req.body;

    if (!title || !description || !venue || !capacity || !startTime || !endTime || !guildId) {
      return res.status(400).json({
        error: 'title, description, venue, capacity, startTime, endTime, and guildId are required.',
      });
    }

    const parsedGuildId = Number(guildId);
    const guild = await prisma.guild.findUnique({ where: { id: parsedGuildId } });
    if (!guild) {
      return res.status(404).json({ error: 'Referenced guildId not found.' });
    }

    const quest = await prisma.quest.create({
      data: {
        title,
        description,
        venue,
        capacity: Number(capacity),
        xpReward: xpReward !== undefined ? Number(xpReward) : 50,
        status: status || 'APPROVED',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        guildId: parsedGuildId,
      },
      include: {
        guild: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ message: 'Quest created successfully!', quest });
  } catch (err) {
    console.error('Error creating quest:', err);
    res.status(500).json({ error: 'Failed to create quest.' });
  }
});

// PATCH /manage/quests/:id/status — Update quest status (PENDING, APPROVED, REJECTED, COMPLETED)
router.patch('/quests/:id/status', verifyToken, canManage, async (req, res) => {
  try {
    const questId = Number(req.params.id);
    const { status } = req.body;
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const updatedQuest = await prisma.quest.update({
      where: { id: questId },
      data: { status },
    });

    res.json({ message: 'Quest status updated!', quest: updatedQuest });
  } catch (err) {
    console.error('Error updating quest status:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Quest not found.' });
    }
    res.status(500).json({ error: 'Failed to update quest status.' });
  }
});

// GET /manage/heroes — List heroes with XP, level, and badge count (GUILD_MASTER or ADMIN)
router.get('/heroes', verifyToken, canManage, async (req, res) => {
  try {
    const heroes = await prisma.hero.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        level: true,
        createdAt: true,
        ledGuild: {
          select: { id: true, name: true },
        },
        _count: {
          select: { registrations: true, badges: true },
        },
      },
      orderBy: [{ xp: 'desc' }, { id: 'asc' }],
    });
    res.json({ heroes });
  } catch (err) {
    console.error('Error fetching heroes:', err);
    res.status(500).json({ error: 'Failed to load heroes.' });
  }
});

// PATCH /manage/heroes/:id/role — Update a hero's role (ADMIN only)
router.patch('/heroes/:id/role', verifyToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const heroId = Number(req.params.id);
    const { role } = req.body;
    const validRoles = ['HERO', 'GUILD_MASTER', 'ADMIN'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role value.' });
    }

    const updatedHero = await prisma.hero.update({
      where: { id: heroId },
      data: { role },
      select: { id: true, name: true, email: true, role: true, xp: true, level: true },
    });

    res.json({ message: 'Hero role updated!', hero: updatedHero });
  } catch (err) {
    console.error('Error updating hero role:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Hero not found.' });
    }
    res.status(500).json({ error: 'Failed to update hero role.' });
  }
});

module.exports = router;