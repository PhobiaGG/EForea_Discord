const fs = require('fs');
const path = require('path');
const { getEffectiveStats } = require('./items');
const { addExperience } = require('./leveling');

/**
 * Combat System
 * Handles turn-based combat, damage calculation, and rewards
 */

// Load enemy data
const enemiesPath = path.join(__dirname, '../data/enemies.json');
const enemiesData = JSON.parse(fs.readFileSync(enemiesPath, 'utf8'));

/**
 * Get enemy by ID
 * @param {string} enemyId - Enemy ID
 * @returns {Object|null} Enemy data
 */
function getEnemy(enemyId) {
	return enemiesData[enemyId] ? JSON.parse(JSON.stringify(enemiesData[enemyId])) : null;
}

/**
 * Get all enemies
 * @returns {Object} All enemy data
 */
function getAllEnemies() {
	return enemiesData;
}

/**
 * Get enemies by level range
 * @param {number} minLevel - Minimum level
 * @param {number} maxLevel - Maximum level
 * @returns {Array} Array of enemies
 */
function getEnemiesByLevel(minLevel, maxLevel) {
	const enemies = [];
	for (const id in enemiesData) {
		const enemy = enemiesData[id];
		if (enemy.level >= minLevel && enemy.level <= maxLevel) {
			enemies.push({ id, ...enemy });
		}
	}
	return enemies;
}

/**
 * Calculate damage dealt
 * @param {Object} attackerStats - Attacker's stats
 * @param {Object} defenderStats - Defender's stats
 * @returns {Object} Damage info
 */
function calculateDamage(attackerStats, defenderStats) {
	// Base damage from strength
	let baseDamage = attackerStats.Strength || 10;

	// Apply attack speed modifier (affects damage slightly)
	const atkSpeedMod = 1 + ((attackerStats.AtkSpeed || 0) * 0.1);
	baseDamage *= atkSpeedMod;

	// Calculate if critical hit
	const critChance = attackerStats.CritChance || 0;
	const isCrit = Math.random() * 100 < critChance;

	if (isCrit) {
		const critDmg = attackerStats.CritDmg || 0;
		baseDamage *= (1 + critDmg / 100);
	}

	// Apply resistance
	const resistance = defenderStats.Resistence || 0;
	const damageReduction = resistance / (resistance + 100);
	const finalDamage = Math.max(1, Math.floor(baseDamage * (1 - damageReduction)));

	return {
		damage: finalDamage,
		isCrit
	};
}

/**
 * Determine turn order based on speed
 * @param {Object} playerStats - Player stats
 * @param {Object} enemyStats - Enemy stats
 * @returns {string} 'player' or 'enemy' for who goes first
 */
function determineTurnOrder(playerStats, enemyStats) {
	const playerSpeed = playerStats.Speed || 100;
	const enemySpeed = enemyStats.Speed || 100;

	// Higher speed goes first, with random tiebreaker
	if (playerSpeed > enemySpeed) return 'player';
	if (enemySpeed > playerSpeed) return 'enemy';
	return Math.random() < 0.5 ? 'player' : 'enemy';
}

/**
 * Simulate a full combat encounter
 * @param {Object} profile - Player profile
 * @param {Object} enemy - Enemy data
 * @returns {Object} Combat result
 */
function simulateCombat(profile, enemy) {
	const playerStats = getEffectiveStats(profile);
	const enemyStats = enemy.stats;

	let playerHP = playerStats.BaseHealth;
	let enemyHP = enemy.health;

	const combatLog = [];
	let turn = 1;
	let currentTurn = determineTurnOrder(playerStats, enemyStats);

	combatLog.push({
		type: 'start',
		message: `⚔️ **Battle Start!**\nYou (Level ${playerStats.Level}) vs ${enemy.name} (Level ${enemy.level})`,
		playerHP,
		enemyHP,
		playerMaxHP: playerStats.BaseHealth,
		enemyMaxHP: enemy.health
	});

	// Combat loop (max 50 turns to prevent infinite battles)
	while (playerHP > 0 && enemyHP > 0 && turn <= 50) {
		if (currentTurn === 'player') {
			// Player attacks
			const dmgInfo = calculateDamage(playerStats, enemyStats);
			enemyHP -= dmgInfo.damage;

			combatLog.push({
				type: 'player_attack',
				turn,
				damage: dmgInfo.damage,
				isCrit: dmgInfo.isCrit,
				enemyHP: Math.max(0, enemyHP)
			});

			currentTurn = 'enemy';
		} else {
			// Enemy attacks
			const dmgInfo = calculateDamage(enemyStats, playerStats);
			playerHP -= dmgInfo.damage;

			combatLog.push({
				type: 'enemy_attack',
				turn,
				damage: dmgInfo.damage,
				isCrit: dmgInfo.isCrit,
				playerHP: Math.max(0, playerHP)
			});

			currentTurn = 'player';
		}

		turn++;
	}

	// Determine victory
	const victory = enemyHP <= 0;

	const result = {
		victory,
		combatLog,
		playerHP: Math.max(0, playerHP),
		enemyHP: Math.max(0, enemyHP),
		turns: turn - 1
	};

	if (victory) {
		// Calculate rewards
		result.rewards = calculateRewards(profile, enemy);
	}

	return result;
}

/**
 * Calculate combat rewards
 * @param {Object} profile - Player profile
 * @param {Object} enemy - Enemy data
 * @returns {Object} Rewards object
 */
function calculateRewards(profile, enemy) {
	const rewards = {
		exp: enemy.rewards.exp,
		currency: {},
		items: []
	};

	// Currency rewards
	const fortune = (profile.PlrStats.Fortune || 1);
	const fortuneMod = 1 + ((fortune - 1) * 0.1);

	if (enemy.rewards.copper) {
		const [min, max] = enemy.rewards.copper;
		rewards.currency.Copper = Math.floor((Math.random() * (max - min + 1) + min) * fortuneMod);
	}

	if (enemy.rewards.silver) {
		const [min, max] = enemy.rewards.silver;
		rewards.currency.Silver = Math.floor((Math.random() * (max - min + 1) + min) * fortuneMod);
	}

	if (enemy.rewards.gold) {
		const [min, max] = enemy.rewards.gold;
		rewards.currency.Gold = Math.floor((Math.random() * (max - min + 1) + min) * fortuneMod);
	}

	// Item drops
	if (enemy.loot) {
		for (const lootEntry of enemy.loot) {
			// Apply fortune to drop chance
			const dropChance = Math.min(1, lootEntry.chance * fortuneMod);

			if (Math.random() < dropChance) {
				rewards.items.push(lootEntry.item);
			}
		}
	}

	return rewards;
}

/**
 * Apply combat rewards to profile
 * @param {Object} profile - Player profile
 * @param {Object} rewards - Rewards object
 * @returns {Object} Level up info
 */
function applyRewards(profile, rewards) {
	// Add experience
	const expResult = addExperience(profile, rewards.exp, 'CombatExp');

	// Add currency
	if (rewards.currency) {
		const itemsModule = require('./items');
		itemsModule.addCurrency(profile, rewards.currency);
	}

	// Add items
	if (rewards.items) {
		const itemsModule = require('./items');
		for (const itemId of rewards.items) {
			itemsModule.addItemToInventory(profile, itemId);
		}
	}

	return expResult;
}

/**
 * Format combat log for Discord
 * @param {Array} combatLog - Combat log entries
 * @returns {string} Formatted combat summary
 */
function formatCombatLog(combatLog) {
	const lines = [];

	for (const entry of combatLog) {
		if (entry.type === 'start') {
			lines.push(entry.message);
			lines.push('');
		} else if (entry.type === 'player_attack') {
			const critText = entry.isCrit ? ' **CRIT!**' : '';
			lines.push(`Turn ${entry.turn}: You deal ${entry.damage} damage${critText} (Enemy HP: ${entry.enemyHP})`);
		} else if (entry.type === 'enemy_attack') {
			const critText = entry.isCrit ? ' **CRIT!**' : '';
			lines.push(`Turn ${entry.turn}: Enemy deals ${entry.damage} damage${critText} (Your HP: ${entry.playerHP})`);
		}
	}

	// Limit to first and last few turns if too long
	if (lines.length > 15) {
		const start = lines.slice(0, 5);
		const end = lines.slice(-8);
		return [...start, `... ${lines.length - 13} turns ...`, ...end].join('\n');
	}

	return lines.join('\n');
}

module.exports = {
	getEnemy,
	getAllEnemies,
	getEnemiesByLevel,
	calculateDamage,
	determineTurnOrder,
	simulateCombat,
	calculateRewards,
	applyRewards,
	formatCombatLog
};
