const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_heroics_key';

// SIGNUP: Register a new Hero
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existingHero = await prisma.hero.findUnique({ where: { email } });
    if (existingHero) {
      return res.status(400).json({ error: 'A Hero with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newHero = await prisma.hero.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'HERO',
      },
    });

    const token = jwt.sign(
      { id: newHero.id, role: newHero.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Hero created successfully!',
      token,
      hero: {
        id: newHero.id,
        name: newHero.name,
        role: newHero.role,
        xp: newHero.xp,
        level: newHero.level,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create Hero.' });
  }
});

// LOGIN: Authenticate an existing Hero
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const hero = await prisma.hero.findUnique({ where: { email } });
    if (!hero) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, hero.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: hero.id, role: hero.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      hero: {
        id: hero.id,
        name: hero.name,
        role: hero.role,
        xp: hero.xp,
        level: hero.level,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const hero = await prisma.hero.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        level: true,
        ledGuild: { select: { id: true, name: true } },
        badges: {
          include: {
            quest: { select: { id: true, title: true, xpReward: true } },
          },
          orderBy: { earnedAt: 'desc' },
        },
        _count: { select: { registrations: true, badges: true } },
      },
    });

    if (!hero) return res.status(404).json({ error: 'Hero not found.' });
    res.json({ hero });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

module.exports = router;