require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const DatabaseManager = require('./DatabaseManager');

/**
 * EForea Discord RPG Bot
 * A text-based RPG with combat, gathering, crafting, and progression systems
 */

// Initialize Discord client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
	]
});

// Initialize database manager
const db = new DatabaseManager('./database.json');

// Store commands in a collection
client.commands = new Collection();

// Make database accessible to commands
client.db = db;

/**
 * Load all command files from the commands directory
 */
function loadCommands() {
	const commandsPath = path.join(__dirname, 'commands');

	if (!fs.existsSync(commandsPath)) {
		console.log('[Bot] Commands directory not found, creating it...');
		fs.mkdirSync(commandsPath);
		return;
	}

	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

	console.log(`[Bot] Loading ${commandFiles.length} commands...`);

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			console.log(`[Bot] ✓ Loaded command: ${command.data.name}`);
		} else {
			console.log(`[Bot] ⚠ Skipped ${file}: missing 'data' or 'execute' property`);
		}
	}
}

/**
 * Register slash commands with Discord
 */
async function registerCommands() {
	const commands = [];

	for (const command of client.commands.values()) {
		commands.push(command.data.toJSON());
	}

	const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

	try {
		console.log(`[Bot] Started refreshing ${commands.length} application (/) commands.`);

		// Register commands globally (takes up to 1 hour to propagate)
		// For testing, use guild commands instead (instant)
		if (process.env.GUILD_ID) {
			await rest.put(
				Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
				{ body: commands },
			);
			console.log(`[Bot] Successfully registered commands to guild ${process.env.GUILD_ID}`);
		} else {
			await rest.put(
				Routes.applicationCommands(process.env.CLIENT_ID),
				{ body: commands },
			);
			console.log('[Bot] Successfully registered commands globally');
		}
	} catch (error) {
		console.error('[Bot] Error registering commands:', error);
	}
}

/**
 * Set up auto-save system (saves database every 5 minutes)
 */
function setupAutoSave() {
	const AUTO_SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes

	setInterval(async () => {
		console.log('[AutoSave] Saving database...');
		const success = await db.save();
		if (success) {
			console.log('[AutoSave] Database saved successfully');
		}
	}, AUTO_SAVE_INTERVAL);

	console.log('[Bot] Auto-save enabled (every 5 minutes)');
}

/**
 * Set up graceful shutdown to save database before exit
 */
function setupGracefulShutdown() {
	const gracefulShutdown = async (signal) => {
		console.log(`\n[Shutdown] Received ${signal} signal`);
		console.log('[Shutdown] Saving database...');

		db.saveSync();

		console.log('[Shutdown] Closing Discord connection...');
		await client.destroy();

		console.log('[Shutdown] Shutdown complete');
		process.exit(0);
	};

	process.on('SIGINT', () => gracefulShutdown('SIGINT'));
	process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

	console.log('[Bot] Graceful shutdown handlers registered');
}

// Event: Bot is ready
client.once('ready', async () => {
	console.log(`[Bot] Logged in as ${client.user.tag}`);
	console.log(`[Bot] Serving ${client.guilds.cache.size} guilds`);
	console.log(`[Bot] Database contains ${db.getProfileCount()} player profiles`);

	// Set bot status
	client.user.setActivity('a text RPG | /help', { type: 'Playing' });

	// Register commands
	await registerCommands();

	console.log('[Bot] Bot is ready!');
});

// Event: Handle slash command interactions
client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`[Bot] No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction, client);
	} catch (error) {
		console.error(`[Bot] Error executing ${interaction.commandName}:`, error);

		const errorMessage = {
			content: '❌ There was an error executing this command!',
			ephemeral: true
		};

		if (interaction.replied || interaction.deferred) {
			await interaction.followUp(errorMessage);
		} else {
			await interaction.reply(errorMessage);
		}
	}
});

// Event: Handle errors
client.on('error', error => {
	console.error('[Bot] Discord client error:', error);
});

// Event: Handle warnings
client.on('warn', warning => {
	console.warn('[Bot] Discord client warning:', warning);
});

// Initialize bot
async function init() {
	console.log('[Bot] Starting EForea Discord RPG...');

	// Validate environment variables
	if (!process.env.DISCORD_TOKEN) {
		console.error('[Bot] ERROR: DISCORD_TOKEN not found in environment variables!');
		console.error('[Bot] Please create a .env file with your bot token.');
		console.error('[Bot] See .env.example for the required format.');
		process.exit(1);
	}

	if (!process.env.CLIENT_ID) {
		console.error('[Bot] ERROR: CLIENT_ID not found in environment variables!');
		console.error('[Bot] Please add your application client ID to the .env file.');
		process.exit(1);
	}

	// Load commands
	loadCommands();

	// Set up auto-save and graceful shutdown
	setupAutoSave();
	setupGracefulShutdown();

	// Login to Discord
	try {
		await client.login(process.env.DISCORD_TOKEN);
	} catch (error) {
		console.error('[Bot] Failed to login:', error);
		process.exit(1);
	}
}

// Start the bot
init();
