const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Items System
 * Handles item data, inventory management, and equipment
 */

// Load item data
const itemsPath = path.join(__dirname, '../data/items.json');
const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

// Flatten all items into a single object for easy lookup
const allItems = {};
for (const category in itemsData) {
	Object.assign(allItems, itemsData[category]);
}

/**
 * Get item by ID
 * @param {string} itemId - The item ID
 * @returns {Object|null} The item data or null if not found
 */
function getItem(itemId) {
	return allItems[itemId] || null;
}

/**
 * Get all items in a category
 * @param {string} category - The category (weapons, armor, consumables, etc.)
 * @returns {Object} Items in that category
 */
function getItemsByCategory(category) {
	return itemsData[category] || {};
}

/**
 * Get rarity color for Discord embeds
 * @param {string} rarity - The item rarity
 * @returns {number} Discord color code
 */
function getRarityColor(rarity) {
	const colors = {
		common: 0x9E9E9E,      // Gray
		uncommon: 0x4CAF50,    // Green
		rare: 0x2196F3,        // Blue
		epic: 0x9C27B0,        // Purple
		legendary: 0xFF9800     // Orange
	};
	return colors[rarity] || colors.common;
}

/**
 * Get rarity emoji
 * @param {string} rarity - The item rarity
 * @returns {string} Emoji representation
 */
function getRarityEmoji(rarity) {
	const emojis = {
		common: '⚪',
		uncommon: '🟢',
		rare: '🔵',
		epic: '🟣',
		legendary: '🟠'
	};
	return emojis[rarity] || emojis.common;
}

/**
 * Add item to player inventory
 * @param {Object} profile - Player profile
 * @param {string} itemId - Item ID to add
 * @param {number} quantity - Quantity to add (for stackable items)
 * @returns {Object} Result with success and UUID (for unique items)
 */
function addItemToInventory(profile, itemId, quantity = 1) {
	const item = getItem(itemId);

	if (!item) {
		return { success: false, error: 'Item not found' };
	}

	// Stackable items (consumables, materials)
	if (item.stackable) {
		if (!profile.Inventory[itemId]) {
			profile.Inventory[itemId] = { count: 0 };
		}
		profile.Inventory[itemId].count += quantity;
		return { success: true, itemId, quantity, stackable: true };
	}

	// Unique items (equipment, tools)
	const uuid = uuidv4();
	profile.Inventory[uuid] = {
		itemId: itemId,
		...item
	};

	return { success: true, uuid, itemId, stackable: false };
}

/**
 * Remove item from player inventory
 * @param {Object} profile - Player profile
 * @param {string} identifier - Item ID (stackable) or UUID (unique)
 * @param {number} quantity - Quantity to remove (for stackable items)
 * @returns {boolean} Success status
 */
function removeItemFromInventory(profile, identifier, quantity = 1) {
	if (!profile.Inventory[identifier]) {
		return false;
	}

	const inventoryItem = profile.Inventory[identifier];

	// Stackable item
	if (inventoryItem.count !== undefined) {
		inventoryItem.count -= quantity;
		if (inventoryItem.count <= 0) {
			delete profile.Inventory[identifier];
		}
		return true;
	}

	// Unique item
	delete profile.Inventory[identifier];
	return true;
}

/**
 * Get item count in inventory
 * @param {Object} profile - Player profile
 * @param {string} itemId - Item ID
 * @returns {number} Item count
 */
function getItemCount(profile, itemId) {
	const item = getItem(itemId);

	if (!item) return 0;

	if (item.stackable) {
		return profile.Inventory[itemId]?.count || 0;
	}

	// Count unique items with this itemId
	let count = 0;
	for (const key in profile.Inventory) {
		if (profile.Inventory[key].itemId === itemId) {
			count++;
		}
	}
	return count;
}

/**
 * Find item in inventory by UUID or itemId
 * @param {Object} profile - Player profile
 * @param {string} search - UUID or item ID to search for
 * @returns {Object|null} { key, item } or null
 */
function findItemInInventory(profile, search) {
	// Direct UUID lookup
	if (profile.Inventory[search]) {
		return { key: search, item: profile.Inventory[search] };
	}

	// Search by item ID for unique items
	for (const key in profile.Inventory) {
		const item = profile.Inventory[key];
		if (item.itemId === search) {
			return { key, item };
		}
	}

	return null;
}

/**
 * Equip an item
 * @param {Object} profile - Player profile
 * @param {string} uuid - UUID of item in inventory
 * @returns {Object} Result object
 */
function equipItem(profile, uuid) {
	const inventoryItem = profile.Inventory[uuid];

	if (!inventoryItem) {
		return { success: false, error: 'Item not found in inventory' };
	}

	const item = getItem(inventoryItem.itemId);

	if (!item || !item.slot) {
		return { success: false, error: 'Item cannot be equipped' };
	}

	// Check level requirement
	if (item.level && profile.PlrStats.Level < item.level) {
		return { success: false, error: `Requires level ${item.level}` };
	}

	const slot = item.slot;

	// Unequip current item in slot
	if (profile.EquippedItems[slot]) {
		const oldUuid = profile.EquippedItems[slot];
		const oldItem = getItem(oldUuid);

		// Return old item to inventory
		if (oldItem) {
			addItemToInventory(profile, oldUuid);
		}
	}

	// Equip new item
	profile.EquippedItems[slot] = uuid;

	// Remove from inventory
	delete profile.Inventory[uuid];

	return { success: true, item: item.name, slot };
}

/**
 * Unequip an item
 * @param {Object} profile - Player profile
 * @param {string} slot - Equipment slot
 * @returns {Object} Result object
 */
function unequipItem(profile, slot) {
	const uuid = profile.EquippedItems[slot];

	if (!uuid) {
		return { success: false, error: 'No item equipped in that slot' };
	}

	const item = getItem(uuid);

	if (!item) {
		return { success: false, error: 'Equipped item data not found' };
	}

	// Return to inventory
	addItemToInventory(profile, uuid);

	// Remove from equipment
	profile.EquippedItems[slot] = "";

	return { success: true, item: item.name };
}

/**
 * Calculate total stats from equipped items
 * @param {Object} profile - Player profile
 * @returns {Object} Total stat bonuses
 */
function calculateEquipmentStats(profile) {
	const totalStats = {
		Level: 0,
		Mana: 0,
		BaseHealth: 0,
		Resistence: 0,
		Strength: 0,
		Wisdom: 0,
		CritDmg: 0,
		CritChance: 0,
		AtkSpeed: 0,
		HealthRegen: 0,
		Vitality: 0,
		Speed: 0,
		Fortune: 0,
		MiningSpeed: 0,
		BreakingPower: 0
	};

	for (const slot in profile.EquippedItems) {
		const uuid = profile.EquippedItems[slot];
		if (!uuid) continue;

		const item = getItem(uuid);
		if (!item || !item.stats) continue;

		for (const stat in item.stats) {
			if (totalStats[stat] !== undefined) {
				totalStats[stat] += item.stats[stat];
			}
		}
	}

	return totalStats;
}

/**
 * Get player's effective stats (base + equipment)
 * @param {Object} profile - Player profile
 * @returns {Object} Effective stats
 */
function getEffectiveStats(profile) {
	const baseStats = { ...profile.PlrStats };
	const equipmentStats = calculateEquipmentStats(profile);

	const effectiveStats = {};
	for (const stat in baseStats) {
		effectiveStats[stat] = baseStats[stat] + (equipmentStats[stat] || 0);
	}

	return effectiveStats;
}

/**
 * Format currency for display
 * @param {Object} currency - Currency object
 * @returns {string} Formatted string
 */
function formatCurrency(currency) {
	const parts = [];
	if (currency.Platinum > 0) parts.push(`${currency.Platinum} 💎`);
	if (currency.Gold > 0) parts.push(`${currency.Gold} 🥇`);
	if (currency.Silver > 0) parts.push(`${currency.Silver} 🥈`);
	if (currency.Copper > 0 || parts.length === 0) parts.push(`${currency.Copper} 🪙`);
	return parts.join(', ');
}

/**
 * Get total copper value of currency
 * @param {Object} currency - Currency object
 * @returns {number} Total value in copper
 */
function getTotalCopper(currency) {
	return currency.Copper +
		(currency.Silver * 100) +
		(currency.Gold * 10000) +
		(currency.Platinum * 1000000);
}

/**
 * Convert copper to higher denominations
 * @param {number} copper - Copper amount
 * @returns {Object} Currency object
 */
function convertCopper(copper) {
	const currency = {
		Platinum: Math.floor(copper / 1000000),
		Gold: Math.floor((copper % 1000000) / 10000),
		Silver: Math.floor((copper % 10000) / 100),
		Copper: copper % 100
	};
	return currency;
}

/**
 * Add currency to profile
 * @param {Object} profile - Player profile
 * @param {Object} amount - Amount to add (can specify any denomination)
 */
function addCurrency(profile, amount) {
	profile.Currency.Copper += amount.Copper || 0;
	profile.Currency.Silver += amount.Silver || 0;
	profile.Currency.Gold += amount.Gold || 0;
	profile.Currency.Platinum += amount.Platinum || 0;

	// Convert overflow
	const totalCopper = getTotalCopper(profile.Currency);
	const converted = convertCopper(totalCopper);
	profile.Currency = converted;
}

/**
 * Subtract currency from profile
 * @param {Object} profile - Player profile
 * @param {number} copperAmount - Amount in copper
 * @returns {boolean} Success status
 */
function subtractCurrency(profile, copperAmount) {
	const totalCopper = getTotalCopper(profile.Currency);

	if (totalCopper < copperAmount) {
		return false;
	}

	const remaining = totalCopper - copperAmount;
	profile.Currency = convertCopper(remaining);

	return true;
}

module.exports = {
	getItem,
	getItemsByCategory,
	getRarityColor,
	getRarityEmoji,
	addItemToInventory,
	removeItemFromInventory,
	getItemCount,
	findItemInInventory,
	equipItem,
	unequipItem,
	calculateEquipmentStats,
	getEffectiveStats,
	formatCurrency,
	getTotalCopper,
	convertCopper,
	addCurrency,
	subtractCurrency
};
