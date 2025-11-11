const DatabaseManager = require('./DatabaseManager');

/**
 * Example usage of DatabaseManager for a Discord RPG bot
 */

// ===========================
// 1. Initialize the DatabaseManager
// ===========================
const db = new DatabaseManager('./database.json');

console.log('\n=== Database Manager Example ===\n');

// ===========================
// 2. Set up periodic auto-save (every 5 minutes)
// ===========================
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

const autoSaveTimer = setInterval(async () => {
	console.log('\n[Auto-Save] Triggering periodic save...');
	await db.save();
}, AUTO_SAVE_INTERVAL);

console.log(`[Setup] Auto-save enabled (every ${AUTO_SAVE_INTERVAL / 1000} seconds)`);

// ===========================
// 3. Set up graceful shutdown hooks
// ===========================
const gracefulShutdown = (signal) => {
	console.log(`\n[Shutdown] Received ${signal} signal. Saving database before exit...`);

	// Clear the auto-save timer
	clearInterval(autoSaveTimer);

	// Perform final synchronous save
	db.saveSync();

	console.log('[Shutdown] Database saved. Exiting gracefully.');
	process.exit(0);
};

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle SIGTERM (kill command)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle process exit
process.on('exit', (code) => {
	console.log(`[Exit] Process exiting with code ${code}`);
});

console.log('[Setup] Graceful shutdown hooks registered (SIGINT, SIGTERM)\n');

// ===========================
// 4. Example: Get a NEW player's profile
// ===========================
console.log('--- Example 1: New Player Joining ---');

const newPlayerId = '123456789012345678'; // Simulated Discord user ID

// First time accessing this player - will create a new profile
const newPlayerProfile = db.getProfile(newPlayerId);

console.log(`New player profile created for ${newPlayerId}:`);
console.log(`  - Level: ${newPlayerProfile.PlrStats.Level}`);
console.log(`  - Copper: ${newPlayerProfile.Currency.Copper}`);
console.log(`  - Join Timestamp: ${new Date(newPlayerProfile.JoinTimestamp).toLocaleString()}`);
console.log(`  - Total profiles in database: ${db.getProfileCount()}\n`);

// ===========================
// 5. Example: Modify player's currency
// ===========================
console.log('--- Example 2: Modifying Player Data ---');

// Get the profile (already exists, so won't create a new one)
const playerProfile = db.getProfile(newPlayerId);

// Give the player some rewards
playerProfile.Currency.Copper += 500;
playerProfile.Currency.Silver += 10;
playerProfile.PlrStats.Level = 2;
playerProfile.Exp.CombatExp = 150;

// Update the profile in the database
db.updateProfile(newPlayerId, playerProfile);

console.log(`Updated player ${newPlayerId}:`);
console.log(`  - Level: ${playerProfile.PlrStats.Level}`);
console.log(`  - Copper: ${playerProfile.Currency.Copper}`);
console.log(`  - Silver: ${playerProfile.Currency.Silver}`);
console.log(`  - Combat Exp: ${playerProfile.Exp.CombatExp}\n`);

// ===========================
// 6. Example: Get same player's profile again
// ===========================
console.log('--- Example 3: Retrieving Existing Player ---');

// Simulate a subsequent command from the same player
const existingPlayerProfile = db.getProfile(newPlayerId);

console.log(`Retrieved existing player ${newPlayerId}:`);
console.log(`  - Level: ${existingPlayerProfile.PlrStats.Level}`);
console.log(`  - Copper: ${existingPlayerProfile.Currency.Copper}`);
console.log(`  - Silver: ${existingPlayerProfile.Currency.Silver}`);
console.log(`  - Combat Exp: ${existingPlayerProfile.Exp.CombatExp}`);
console.log(`  - Profile exists: ${db.hasProfile(newPlayerId)}\n`);

// ===========================
// 7. Example: Multiple players
// ===========================
console.log('--- Example 4: Multiple Players ---');

const player2Id = '987654321098765432';
const player3Id = '111222333444555666';

const player2 = db.getProfile(player2Id);
player2.PlrStats.Level = 5;
player2.Currency.Gold = 3;
db.updateProfile(player2Id, player2);

const player3 = db.getProfile(player3Id);
player3.PlrStats.Level = 10;
player3.Currency.Platinum = 1;
db.updateProfile(player3Id, player3);

console.log(`Total players in database: ${db.getProfileCount()}`);
console.log(`Player 2 (${player2Id}): Level ${player2.PlrStats.Level}, Gold ${player2.Currency.Gold}`);
console.log(`Player 3 (${player3Id}): Level ${player3.PlrStats.Level}, Platinum ${player3.Currency.Platinum}\n`);

// ===========================
// 8. Example: Manual save
// ===========================
console.log('--- Example 5: Manual Save ---');

(async () => {
	console.log('Manually triggering save...');
	const saveResult = await db.save();
	console.log(`Save result: ${saveResult ? 'Success' : 'Failed'}\n`);

	console.log('=== Examples Complete ===');
	console.log('\nThe database will auto-save every 5 minutes.');
	console.log('Press Ctrl+C to trigger graceful shutdown and final save.\n');
})();

// ===========================
// 9. Example: Discord.js integration (commented out)
// ===========================

/*
// Example of how to integrate with Discord.js:

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	// Get the player's profile
	const profile = db.getProfile(interaction.user.id);

	if (interaction.commandName === 'balance') {
		await interaction.reply(
			`Your balance:\n` +
			`🪙 Copper: ${profile.Currency.Copper}\n` +
			`🥈 Silver: ${profile.Currency.Silver}\n` +
			`🥇 Gold: ${profile.Currency.Gold}\n` +
			`💎 Platinum: ${profile.Currency.Platinum}`
		);
	}

	if (interaction.commandName === 'stats') {
		await interaction.reply(
			`**Level ${profile.PlrStats.Level} Player**\n` +
			`Health: ${profile.PlrStats.BaseHealth}\n` +
			`Strength: ${profile.PlrStats.Strength}\n` +
			`Wisdom: ${profile.PlrStats.Wisdom}\n` +
			`Speed: ${profile.PlrStats.Speed}`
		);
	}

	if (interaction.commandName === 'daily') {
		// Give daily reward
		profile.Currency.Copper += 100;
		profile.Currency.Silver += 1;
		db.updateProfile(interaction.user.id, profile);

		await interaction.reply('Daily reward claimed! +100 Copper, +1 Silver');
	}
});

client.login('YOUR_BOT_TOKEN');
*/
