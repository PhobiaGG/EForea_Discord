const fs = require('fs');
const path = require('path');

/**
 * PlayerDataTemplate - The default structure for a new player's profile.
 * This template is deep-cloned whenever a new player is created.
 */
const PlayerDataTemplate = {
	PlrStats: {
		Level: 1,
		Mana: 100,
		BaseHealth: 100,
		Resistence: 0,
		Strength: 0,
		Wisdom: 100,
		CritDmg: 0,
		CritChance: 2,
		AtkSpeed: 1,
		HealthRegen: 2,
		Vitality: 1,
		Speed: 100,
		Fortune: 1,
		MiningSpeed: 1,
		BreakingPower: 1
	},
	Exp: {
		CombatExp: 0,
		MiningExp: 0,
		ForagingExp: 0,
		FishingExp: 0,
		DungeoneeringExp: 0,
		TamingExp: 0,
		ReforgeExp: 0
	},
	Currency: {
		Copper: 100,
		Silver: 0,
		Gold: 0,
		Platinum: 0
	},
	Character: {
		Face: 1,
		Hair: 1,
		HairColor: 1,
		SkinTone: 1,
		ShirtColor: 1,
		PantsColor: 1
	},
	EquippedItems: {
		Gauntlets: "",
		Chestplate: "",
		Greaves: "",
		Helmet: "",
		WeaponSlotOne: "",
		WeaponSlotTwo: "",
		AccessoryOne: "",
		AccessoryTwo: ""
	},
	Inventory: {},
	Settings: {
		MusicEnabled: true,
		TipsEnabled: true
	},
	JoinTimestamp: 0
};

/**
 * DatabaseManager - A simple file-based JSON database with in-memory caching.
 *
 * This class manages player profiles for a Discord RPG bot using a single JSON file
 * for persistence. All operations are performed on an in-memory cache for speed,
 * with periodic saves to disk.
 */
class DatabaseManager {
	/**
	 * Creates a new DatabaseManager instance.
	 * @param {string} dbFilePath - Path to the database JSON file (default: './database.json')
	 */
	constructor(dbFilePath = './database.json') {
		this.dbFilePath = path.resolve(dbFilePath);
		this.cache = new Map(); // In-memory cache: Map<userId, playerData>
		this.isLoaded = false;
		this.isSaving = false;

		// Load the database on initialization
		this.load();
	}

	/**
	 * Deep clones an object to prevent reference sharing.
	 * @private
	 * @param {Object} obj - The object to clone
	 * @returns {Object} A deep copy of the object
	 */
	_deepClone(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	/**
	 * Loads the database file into the in-memory cache.
	 * If the file doesn't exist, starts with an empty cache.
	 * @private
	 */
	load() {
		try {
			if (fs.existsSync(this.dbFilePath)) {
				const rawData = fs.readFileSync(this.dbFilePath, 'utf8');
				const data = JSON.parse(rawData);

				// Convert the loaded object into a Map
				this.cache = new Map(Object.entries(data));
				console.log(`[DatabaseManager] Loaded ${this.cache.size} player profiles from ${this.dbFilePath}`);
			} else {
				console.log(`[DatabaseManager] Database file not found. Starting with empty cache.`);
				this.cache = new Map();
			}

			this.isLoaded = true;
		} catch (error) {
			console.error(`[DatabaseManager] Error loading database:`, error);
			console.log(`[DatabaseManager] Starting with empty cache.`);
			this.cache = new Map();
			this.isLoaded = true;
		}
	}

	/**
	 * Saves the entire in-memory cache to the database file.
	 * Uses atomic write (write to temp file, then rename) to prevent corruption.
	 * @returns {Promise<boolean>} True if save was successful, false otherwise
	 */
	async save() {
		// Prevent concurrent saves
		if (this.isSaving) {
			console.log(`[DatabaseManager] Save already in progress, skipping...`);
			return false;
		}

		this.isSaving = true;
		const tempFilePath = `${this.dbFilePath}.tmp`;

		try {
			// Convert Map to plain object for JSON serialization
			const dataToSave = Object.fromEntries(this.cache);
			const jsonData = JSON.stringify(dataToSave, null, 2);

			// Write to temporary file first
			await fs.promises.writeFile(tempFilePath, jsonData, 'utf8');

			// Atomic rename: replace old file with new one
			await fs.promises.rename(tempFilePath, this.dbFilePath);

			console.log(`[DatabaseManager] Successfully saved ${this.cache.size} player profiles to ${this.dbFilePath}`);
			this.isSaving = false;
			return true;
		} catch (error) {
			console.error(`[DatabaseManager] Error saving database:`, error);
			this.isSaving = false;

			// Clean up temp file if it exists
			try {
				if (fs.existsSync(tempFilePath)) {
					await fs.promises.unlink(tempFilePath);
				}
			} catch (cleanupError) {
				console.error(`[DatabaseManager] Error cleaning up temp file:`, cleanupError);
			}

			return false;
		}
	}

	/**
	 * Synchronous version of save() for use in shutdown hooks.
	 * @returns {boolean} True if save was successful, false otherwise
	 */
	saveSync() {
		// Prevent concurrent saves
		if (this.isSaving) {
			console.log(`[DatabaseManager] Save already in progress, skipping...`);
			return false;
		}

		this.isSaving = true;
		const tempFilePath = `${this.dbFilePath}.tmp`;

		try {
			// Convert Map to plain object for JSON serialization
			const dataToSave = Object.fromEntries(this.cache);
			const jsonData = JSON.stringify(dataToSave, null, 2);

			// Write to temporary file first
			fs.writeFileSync(tempFilePath, jsonData, 'utf8');

			// Atomic rename: replace old file with new one
			fs.renameSync(tempFilePath, this.dbFilePath);

			console.log(`[DatabaseManager] Successfully saved ${this.cache.size} player profiles to ${this.dbFilePath}`);
			this.isSaving = false;
			return true;
		} catch (error) {
			console.error(`[DatabaseManager] Error saving database:`, error);
			this.isSaving = false;

			// Clean up temp file if it exists
			try {
				if (fs.existsSync(tempFilePath)) {
					fs.unlinkSync(tempFilePath);
				}
			} catch (cleanupError) {
				console.error(`[DatabaseManager] Error cleaning up temp file:`, cleanupError);
			}

			return false;
		}
	}

	/**
	 * Gets a player's profile. If the player doesn't exist, creates a new profile
	 * using the PlayerDataTemplate and adds it to the cache.
	 *
	 * @param {string} userId - The Discord user ID
	 * @returns {Object} The player's profile data
	 */
	getProfile(userId) {
		// Check if profile exists in cache
		if (this.cache.has(userId)) {
			return this.cache.get(userId);
		}

		// Player doesn't exist - create new profile from template
		console.log(`[DatabaseManager] Creating new profile for user: ${userId}`);

		const newProfile = this._deepClone(PlayerDataTemplate);

		// Set the join timestamp to current time
		newProfile.JoinTimestamp = Date.now();

		// Add to cache
		this.cache.set(userId, newProfile);

		return newProfile;
	}

	/**
	 * Updates a player's profile in the cache.
	 *
	 * @param {string} userId - The Discord user ID
	 * @param {Object} profileData - The complete profile data object
	 */
	updateProfile(userId, profileData) {
		this.cache.set(userId, profileData);
		console.log(`[DatabaseManager] Updated profile for user: ${userId}`);
	}

	/**
	 * Checks if a player profile exists in the cache.
	 *
	 * @param {string} userId - The Discord user ID
	 * @returns {boolean} True if profile exists, false otherwise
	 */
	hasProfile(userId) {
		return this.cache.has(userId);
	}

	/**
	 * Deletes a player profile from the cache.
	 *
	 * @param {string} userId - The Discord user ID
	 * @returns {boolean} True if profile was deleted, false if it didn't exist
	 */
	deleteProfile(userId) {
		const deleted = this.cache.delete(userId);
		if (deleted) {
			console.log(`[DatabaseManager] Deleted profile for user: ${userId}`);
		}
		return deleted;
	}

	/**
	 * Gets all player profiles.
	 *
	 * @returns {Map<string, Object>} Map of all player profiles
	 */
	getAllProfiles() {
		return this.cache;
	}

	/**
	 * Gets the number of player profiles in the database.
	 *
	 * @returns {number} The number of profiles
	 */
	getProfileCount() {
		return this.cache.size;
	}
}

module.exports = DatabaseManager;
