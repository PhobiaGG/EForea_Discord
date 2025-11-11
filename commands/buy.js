const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getItem, addItemToInventory, subtractCurrency, getTotalCopper, getRarityColor } = require('../systems/items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('buy')
		.setDescription('Purchase an item from a shop')
		.addStringOption(option =>
			option
				.setName('item')
				.setDescription('Item ID to purchase')
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option
				.setName('quantity')
				.setDescription('Quantity to buy (for stackable items)')
				.setRequired(false)
				.setMinValue(1)
		),

	async execute(interaction, client) {
		const itemId = interaction.options.getString('item');
		const quantity = interaction.options.getInteger('quantity') || 1;
		const profile = client.db.getProfile(interaction.user.id);

		const item = getItem(itemId);

		if (!item) {
			return interaction.reply({
				content: '❌ Item not found! Use `/shop` to browse available items.',
				ephemeral: true
			});
		}

		// Check level requirement
		if (item.level && profile.PlrStats.Level < item.level) {
			return interaction.reply({
				content: `❌ You need to be level ${item.level} to purchase this item!`,
				ephemeral: true
			});
		}

		// Calculate total cost
		const totalCost = item.price * quantity;

		// Check if player can afford it
		const playerBalance = getTotalCopper(profile.Currency);
		if (playerBalance < totalCost) {
			return interaction.reply({
				content: `❌ Insufficient funds! You need ${totalCost} Copper but only have ${playerBalance} Copper.`,
				ephemeral: true
			});
		}

		// For unique items, only allow buying 1 at a time
		if (!item.stackable && quantity > 1) {
			return interaction.reply({
				content: `❌ ${item.name} is not stackable. You can only buy 1 at a time.`,
				ephemeral: true
			});
		}

		// Process purchase
		subtractCurrency(profile, totalCost);
		addItemToInventory(profile, itemId, quantity);

		// Save profile
		client.db.updateProfile(interaction.user.id, profile);

		// Send confirmation
		const embed = new EmbedBuilder()
			.setColor(getRarityColor(item.rarity))
			.setTitle('✅ Purchase Successful!')
			.setDescription(`You purchased **${item.name}** x${quantity}`)
			.addFields(
				{
					name: 'Cost',
					value: `${totalCost} Copper`,
					inline: true
				},
				{
					name: 'Remaining Balance',
					value: `${getTotalCopper(profile.Currency)} Copper`,
					inline: true
				}
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
