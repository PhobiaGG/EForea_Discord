const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { findItemInInventory, equipItem, getItem, getRarityColor } = require('../systems/items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('equip')
		.setDescription('Equip an item from your inventory')
		.addStringOption(option =>
			option
				.setName('item')
				.setDescription('Item ID or name to equip')
				.setRequired(true)
		),

	async execute(interaction, client) {
		const itemSearch = interaction.options.getString('item');
		const profile = client.db.getProfile(interaction.user.id);

		// Find item in inventory
		const found = findItemInInventory(profile, itemSearch);

		if (!found) {
			return interaction.reply({
				content: `❌ Item not found in your inventory! Use \`/inventory\` to see your items.`,
				ephemeral: true
			});
		}

		// Attempt to equip
		const result = equipItem(profile, found.key);

		if (!result.success) {
			return interaction.reply({
				content: `❌ ${result.error}`,
				ephemeral: true
			});
		}

		// Save profile
		client.db.updateProfile(interaction.user.id, profile);

		// Get full item details
		const item = getItem(found.item.itemId || found.item.id);

		// Send confirmation
		const embed = new EmbedBuilder()
			.setColor(getRarityColor(item.rarity))
			.setTitle('⚔️ Equipment Updated')
			.setDescription(`Successfully equipped **${result.item}** to ${result.slot}`)
			.setTimestamp();

		// Show item stats if available
		if (item.stats) {
			const statLines = [];
			for (const stat in item.stats) {
				const value = item.stats[stat];
				const prefix = value >= 0 ? '+' : '';
				statLines.push(`${stat}: ${prefix}${value}`);
			}

			embed.addFields({
				name: 'Item Stats',
				value: statLines.join('\n'),
				inline: false
			});
		}

		await interaction.reply({ embeds: [embed] });
	}
};
