/**
 * Leveling System
 * Handles experience, leveling up, and stat progression
 */

/**
 * Calculate XP required for next level
 * @param {number} level - Current level
 * @returns {number} XP required
 */
function getXPForLevel(level) {
	// Formula: 100 * level^2 + 50 * level
	return Math.floor(100 * Math.pow(level, 2) + 50 * level);
}

/**
 * Get XP required for current level to next
 * @param {Object} profile - Player profile
 * @param {string} expType - Type of XP (Combat, Mining, etc.)
 * @returns {Object} Current XP and required XP
 */
function getExpProgress(profile, expType = 'CombatExp') {
	const level = profile.PlrStats.Level;
	const currentExp = profile.Exp[expType];
	const requiredExp = getXPForLevel(level);

	return {
		currentExp,
		requiredExp,
		percentage: Math.min(100, (currentExp / requiredExp) * 100)
	};
}

/**
 * Add experience and check for level up
 * @param {Object} profile - Player profile
 * @param {number} amount - XP amount to add
 * @param {string} expType - Type of XP (Combat, Mining, etc.)
 * @returns {Object} Result with levelUp boolean and new level
 */
function addExperience(profile, amount, expType = 'CombatExp') {
	profile.Exp[expType] += amount;

	const result = {
		expGained: amount,
		levelUp: false,
		oldLevel: profile.PlrStats.Level,
		newLevel: profile.PlrStats.Level,
		statsGained: {}
	};

	// Check for level up (only for CombatExp)
	if (expType === 'CombatExp') {
		while (profile.Exp.CombatExp >= getXPForLevel(profile.PlrStats.Level)) {
			profile.Exp.CombatExp -= getXPForLevel(profile.PlrStats.Level);
			profile.PlrStats.Level++;
			result.levelUp = true;

			// Apply stat increases
			const statGains = getLevelUpStats(profile.PlrStats.Level);
			for (const stat in statGains) {
				profile.PlrStats[stat] += statGains[stat];
				result.statsGained[stat] = (result.statsGained[stat] || 0) + statGains[stat];
			}
		}

		result.newLevel = profile.PlrStats.Level;
	}

	return result;
}

/**
 * Get stat increases for leveling up
 * @param {number} newLevel - The new level
 * @returns {Object} Stat increases
 */
function getLevelUpStats(newLevel) {
	return {
		BaseHealth: 20,
		Mana: 10,
		Strength: 2,
		Wisdom: 2,
		Resistence: 1,
		Vitality: 1,
		Speed: 2
	};
}

/**
 * Get skill level based on experience
 * @param {number} exp - Experience amount
 * @returns {number} Skill level
 */
function getSkillLevel(exp) {
	// Simple formula: level = floor(sqrt(exp / 100))
	return Math.floor(Math.sqrt(exp / 100)) + 1;
}

/**
 * Get all skill levels for a profile
 * @param {Object} profile - Player profile
 * @returns {Object} Skill levels
 */
function getSkillLevels(profile) {
	return {
		Combat: profile.PlrStats.Level,
		Mining: getSkillLevel(profile.Exp.MiningExp),
		Foraging: getSkillLevel(profile.Exp.ForagingExp),
		Fishing: getSkillLevel(profile.Exp.FishingExp),
		Dungeoneering: getSkillLevel(profile.Exp.DungeoneeringExp),
		Taming: getSkillLevel(profile.Exp.TamingExp),
		Reforge: getSkillLevel(profile.Exp.ReforgeExp)
	};
}

/**
 * Format level progress bar
 * @param {number} percentage - Progress percentage (0-100)
 * @param {number} length - Bar length (default 10)
 * @returns {string} Progress bar string
 */
function formatProgressBar(percentage, length = 10) {
	const filled = Math.floor((percentage / 100) * length);
	const empty = length - filled;
	return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
	getXPForLevel,
	getExpProgress,
	addExperience,
	getLevelUpStats,
	getSkillLevel,
	getSkillLevels,
	formatProgressBar
};
