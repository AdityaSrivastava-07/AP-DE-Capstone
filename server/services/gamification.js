const prisma = require('../prisma');

const XP_PER_LEVEL = 500;
const DEFAULT_QUEST_XP = 50; // Matches Quest.xpReward @default(50) in schema.prisma

class GamificationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'GamificationError';
    this.statusCode = statusCode;
  }
}

/**
 * Calculate Hero level from total XP (Level 1 at 0 XP, +1 Level per 500 XP)
 */
function calculateLevel(totalXp) {
  const safeXp = Math.max(0, Number(totalXp) || 0);
  return Math.floor(safeXp / XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP progress toward the next level threshold
 */
function getLevelProgress(totalXp) {
  const safeXp = Math.max(0, Number(totalXp) || 0);
  const level = calculateLevel(safeXp);
  const currentLevelFloor = (level - 1) * XP_PER_LEVEL;
  const nextLevelThreshold = level * XP_PER_LEVEL;

  return {
    level,
    xp: safeXp,
    xpIntoLevel: safeXp - currentLevelFloor,
    xpForNextLevel: XP_PER_LEVEL,
    nextLevelThreshold,
  };
}

/**
 * Core transactional helper: verifies quest status/window, enforces capacity,
 * ensures registration, prevents duplicate badges, and updates Hero XP & Level atomically.
 */
async function processQuestCompletionTx(tx, heroId, questId) {
  const quest = await tx.quest.findUnique({
    where: { id: questId },
    include: { _count: { select: { registrations: true } } },
  });

  if (!quest) {
    throw new GamificationError('Quest not found.', 404);
  }

  if (quest.status !== 'APPROVED') {
    throw new GamificationError(`Cannot check in to a ${quest.status} quest.`, 400);
  }

  if (quest.endTime && new Date() > new Date(quest.endTime)) {
    throw new GamificationError('This quest has already ended.', 400);
  }

  const hero = await tx.hero.findUnique({
    where: { id: heroId },
    select: { id: true, name: true, email: true, role: true, xp: true, level: true },
  });

  if (!hero) {
    throw new GamificationError('Hero not found.', 404);
  }

  // Prevent duplicate badge issuance (@@unique([heroId, questId]))
  const existingBadge = await tx.badge.findUnique({
    where: {
      heroId_questId: { heroId, questId: quest.id },
    },
  });

  if (existingBadge) {
    throw new GamificationError('You have already checked into this quest.', 409);
  }

  // Ensure registration exists and enforce quest capacity for walk-in check-ins
  let registration = await tx.registration.findUnique({
    where: {
      heroId_questId: { heroId, questId: quest.id },
    },
  });

  if (!registration) {
    if (quest.capacity != null && quest._count.registrations >= quest.capacity) {
      throw new GamificationError('Quest capacity has been reached.', 409);
    }

    registration = await tx.registration.create({
      data: { heroId, questId: quest.id },
    });
  }

  // Create attendance Badge
  const badge = await tx.badge.create({
    data: { heroId, questId: quest.id },
  });

  // Award XP and recalculate level threshold
  const rawReward = quest.xpReward != null ? Number(quest.xpReward) : DEFAULT_QUEST_XP;
  const xpEarned = Math.max(0, Number.isNaN(rawReward) ? DEFAULT_QUEST_XP : rawReward);
  const newTotalXp = Math.max(0, Number(hero.xp) || 0) + xpEarned;
  const newLevel = calculateLevel(newTotalXp);
  const previousLevel = hero.level ?? calculateLevel(hero.xp);
  const leveledUp = newLevel > previousLevel;

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

  console.log(
    `[Gamification Engine] Hero ${updatedHero.name} gained +${xpEarned} XP! Current Level: ${newLevel}`
  );

  return {
    message: leveledUp
      ? `Quest completed! +${xpEarned} XP — Leveled up to Level ${newLevel}!`
      : `Successfully checked in! Awarded +${xpEarned} XP.`,
    xpEarned,
    newTotalXp: updatedHero.xp,
    newLevel: updatedHero.level,
    leveledUp,
    progress: getLevelProgress(updatedHero.xp),
    badge,
    registration,
    updatedHero,
  };
}

/**
 * Public entry point to complete a quest for a hero inside a Prisma transaction.
 */
async function completeQuestForHero(heroId, questId) {
  try {
    return await prisma.$transaction((tx) => processQuestCompletionTx(tx, heroId, questId));
  } catch (error) {
    if (error.code === 'P2002') {
      throw new GamificationError('You have already checked into this quest.', 409);
    }
    console.error('Error in gamification engine:', error);
    throw error;
  }
}

module.exports = {
  XP_PER_LEVEL,
  DEFAULT_QUEST_XP,
  GamificationError,
  calculateLevel,
  getLevelProgress,
  processQuestCompletionTx,
  completeQuestForHero,
};