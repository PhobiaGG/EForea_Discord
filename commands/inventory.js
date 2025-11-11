const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getItem, getRarityEmoji } = require('../systems/items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('View your inventory')
		.addStringOption(option =>
			option
				.setName('filter')
				.setDescription('Filter items by type')
				.setRequired(false)
				.addChoices(
					{ name: 'All', value: 'all' },
					{ name: 'Weapons', value: 'weapon' },
					{ name: 'Armor', value: 'armor' },
					{ name: 'Accessories', value: 'accessory' },
					{ name: 'Consumables', value: 'consumable' },
					{ name: 'Materials', value: 'material' },
					{ name: 'Tools', value: 'tool' }
				)
		),

	async execute(interaction, client) {
		const filter = interaction.options.getString('filter') || 'all';
		const profile = client.db.getProfile(interaction.user.id);

		const embed = new EmbedBuilder()
			.setColor(0x673AB7)
			.setTitle(`🎒 ${interaction.user.username}'s Inventory`)
			.setTimestamp();

		// Group items by type
		const itemsByType = {
			weapon: [],
			armor: [],
			accessory: [],
			consumable: [],
			material: [],
			tool: [],
			other: []
		};

		// Process inventory
		for (const key in profile.Inventory) {
			const inventoryItem = profile.Inventory[key];

			// Stackable items
			if (inventoryItem.count !== undefined) {
				const item = getItem(key);
				if (item) {
					const type = item.type || 'other';
					itemsByType[type].push({
						name: item.name,
						rarity: item.rarity,
						count: inventoryItem.count
					});
				}
			} else {
				// Unique items
				const item = getItem(inventoryItem.itemId);
				if (item) {
					const type = item.type || 'other';
					itemsByType[type].push({
						name: item.name,
						rarity: item.rarity,
						uuid: key
					});
				}
			}
		}

		// Build embed fields
		let hasItems = false;

		for (const type in itemsByType) {
			if (filter !== 'all' && type !== filter) continue;

			const items = itemsByType[type];
			if (items.length === 0) continue;

			hasItems = true;

			const itemLines = items.map(item => {
				const rarityEmoji = getRarityEmoji(item.rarity);
				if (item.count) {
					return `${rarityEmoji} ${item.name} x${item.count}`;
				} else {
					return `${rarityEmoji} ${item.name}`;
				}
			});

			const typeName = type.charAt(0).toUpperCase() + type.slice(1) + 's';

			embed.addFields({
				name: typeName,
				value: itemLines.join('\n'),
				inline: false
			});
		}

		if (!hasItems) {
			embed.setDescription('*Your inventory is empty. Visit a shop to purchase items!*');
		}

		embed.setFooter({ text: 'Use /equip to equip items' });

		await interaction.reply({ embeds: [embed] });
	}
};
