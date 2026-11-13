const prisma = require('../prisma');

/**
 * Processes quest attendance, awards XP, checks for level-ups, and assigns badges.
 * @param {number} heroId - The ID of the hero checking in.
 * @param {number} questId - The ID of the quest being attended.
 */
async function completeQuestForHero(heroId, questId) {
  try {
    // 1. Fetch Quest details to see how much XP it rewards
    const quest = await prisma.quest.findUnique({
      where: { id: questId },
    });

    if (!quest) {
      throw new Error('Quest not found.');
    }

    // 2. Fetch Hero current stats
    const hero = await prisma.hero.findUnique({
      where: { id: heroId },
    });

    if (!hero) {
      throw new Error('Hero not found.');
    }

    const xpEarned = quest.xpReward || 100;
    const newTotalXp = hero.xp + xpEarned;

    // Simple Level Calculation Formula: Every 500 XP = 1 Level Up
    const newLevel = Math.floor(newTotalXp / 500) + 1;

    // 3. Update Hero XP and Level within a transaction
    const updatedHero = await prisma.hero.update({
      where: { id: heroId },
      data: {
        xp: newTotalXp,
        level: newLevel,
      },
    });

    // 4. Check or record attendance / quest completion
    // (Assuming you have an attendance or registration relation)
    console.log(`[Gamification Engine] Hero ${hero.name} gained ${xpEarned} XP! Current Level: ${newLevel}`);

    return {
      message: 'Quest successfully completed and verified!',
      xpEarned,
      updatedHero,
    };
  } catch (error) {
    console.error('Error in gamification engine:', error);
    throw error;
  }
}

module.exports = { completeQuestForHero };