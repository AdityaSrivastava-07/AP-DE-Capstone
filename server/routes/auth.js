const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma'); // Imports your shared, configured client

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_heroics_key';

// SIGNUP: Register a new Hero
// ... (keep the rest of your signup route exactly the same)

// SIGNUP: Register a new Hero
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if the email already exists
    const existingHero = await prisma.hero.findUnique({ where: { email } });
    if (existingHero) {
      return res.status(400).json({ error: 'A Hero with this email already exists.' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create the Hero in the database
    const newHero = await prisma.hero.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'HERO', // Defaults to standard student
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: newHero.id, role: newHero.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      message: 'Hero created successfully!', 
      token, 
      hero: { id: newHero.id, name: newHero.name, role: newHero.role, xp: newHero.xp } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create Hero.' });
  }
});

module.exports = router;