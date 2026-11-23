require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Heroics database...');

  const passwordHash = await bcrypt.hash('Heroics@123', 10);

  // 1. Seed Users (1 Admin, 2 Guild Masters, 3 Heroes)
  const admin = await prisma.hero.upsert({
    where: { email: 'admin@heroics.edu' },
    update: {},
    create: {
      name: 'Aditya Admin',
      email: 'admin@heroics.edu',
      passwordHash,
      role: 'ADMIN',
      xp: 1200,
      level: 3,
    },
  });

  const gm1 = await prisma.hero.upsert({
    where: { email: 'yash.gm@heroics.edu' },
    update: {},
    create: {
      name: 'Yash GuildMaster',
      email: 'yash.gm@heroics.edu',
      passwordHash,
      role: 'GUILD_MASTER',
      xp: 850,
      level: 2,
    },
  });

  const gm2 = await prisma.hero.upsert({
    where: { email: 'rajveer.gm@heroics.edu' },
    update: {},
    create: {
      name: 'Rajveer GuildMaster',
      email: 'rajveer.gm@heroics.edu',
      passwordHash,
      role: 'GUILD_MASTER',
      xp: 700,
      level: 2,
    },
  });

  const hero1 = await prisma.hero.upsert({
    where: { email: 'naitik@heroics.edu' },
    update: {},
    create: {
      name: 'Naitik',
      email: 'naitik@heroics.edu',
      passwordHash,
      role: 'HERO',
      xp: 350,
      level: 1,
    },
  });

  const hero2 = await prisma.hero.upsert({
    where: { email: 'aarav@heroics.edu' },
    update: {},
    create: {
      name: 'Aarav Sharma',
      email: 'aarav@heroics.edu',
      passwordHash,
      role: 'HERO',
      xp: 600,
      level: 2,
    },
  });

  const hero3 = await prisma.hero.upsert({
    where: { email: 'priya@heroics.edu' },
    update: {},
    create: {
      name: 'Priya Verma',
      email: 'priya@heroics.edu',
      passwordHash,
      role: 'HERO',
      xp: 150,
      level: 1,
    },
  });

  // 2. Seed 2 Guilds (safe even if Guild.name is not marked @unique in schema.prisma)
  // 2. Seed 2 Guilds
  let codingGuild = await prisma.guild.findFirst({ where: { name: 'Coding Guild' } });
  if (!codingGuild) {
    codingGuild = await prisma.guild.create({
      data: {
        name: 'Coding Guild',
        description: 'Full-stack engineering sprints, hackathons, and open-source quests.',
        master: { connect: { id: gm1.id } },
      },
    });
  }

  let dataGuild = await prisma.guild.findFirst({ where: { name: 'Data & Systems Guild' } });
  if (!dataGuild) {
    dataGuild = await prisma.guild.create({
      data: {
        name: 'Data & Systems Guild',
        description: 'Database optimization, analytics challenges, and system design workshops.',
        master: { connect: { id: gm2.id } },
      },
    });
  }

  // 3. Seed 4 Future-Dated APPROVED Quests
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const questSeeds = [
    {
      title: 'Full-Stack React & Express Sprint',
      description: 'Build and deploy an authenticated campus microservice in 3 hours.',
      venue: 'Innovation Lab 204',
      capacity: 40,
      xpReward: 150,
      status: 'APPROVED',
      startTime: new Date(now + 2 * day),
      endTime: new Date(now + 2 * day + 3 * 60 * 60 * 1000),
      guildId: codingGuild.id,
    },
    {
      title: 'PostgreSQL Query Tuning & Indexing',
      description: 'Optimize slow relational queries using composite indexes and EXPLAIN ANALYZE.',
      venue: 'Database Studio B',
      capacity: 30,
      xpReward: 200,
      status: 'APPROVED',
      startTime: new Date(now + 4 * day),
      endTime: new Date(now + 4 * day + 2 * 60 * 60 * 1000),
      guildId: dataGuild.id,
    },
    {
      title: 'Open-Source PR Marathon',
      description: 'Collaborate on Git workflows, PR reviews, and automated CI checks.',
      venue: 'Main Auditorium',
      capacity: 60,
      xpReward: 100,
      status: 'APPROVED',
      startTime: new Date(now + 6 * day),
      endTime: new Date(now + 6 * day + 4 * 60 * 60 * 1000),
      guildId: codingGuild.id,
    },
    {
      title: 'System Design & Prisma Schema Workshop',
      description: 'Model normalized schemas with atomic transactions and role-based access.',
      venue: 'Seminar Hall 1',
      capacity: 35,
      xpReward: 150,
      status: 'APPROVED',
      startTime: new Date(now + 9 * day),
      endTime: new Date(now + 9 * day + 2 * 60 * 60 * 1000),
      guildId: dataGuild.id,
    },
  ];

  for (const q of questSeeds) {
    const existing = await prisma.quest.findFirst({ where: { title: q.title } });
    if (!existing) {
      await prisma.quest.create({ data: q });
    }
  }

  console.log('Seed completed! Demo password for all accounts: Heroics@123');
  console.log({
    admin: admin.email,
    guildMasters: [gm1.email, gm2.email],
    heroes: [hero1.email, hero2.email, hero3.email],
  });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });