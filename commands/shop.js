const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getItem, getRarityEmoji, getTotalCopper } = require('../systems/items');

// Load shop data
const shopsPath = path.join(__dirname, '../data/shops.json');
const shopsData = JSON.parse(fs.readFileSync(shopsPath, 'utf8'));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Browse a shop')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('Shop to browse')
				.setRequired(true)
				.addChoices(
					{ name: 'General Store', value: 'general_store' },
					{ name: 'Blacksmith', value: 'blacksmith' },
					{ name: 'Magic Shop', value: 'magic_shop' },
					{ name: 'Rare Merchant', value: 'rare_merchant' }
				)
		),

	async execute(interaction, client) {
		const shopId = interaction.options.getString('name');
		const shop = shopsData[shopId];
		const profile = client.db.getProfile(interaction.user.id);

		if (!shop) {
			return interaction.reply({
				content: '❌ Shop not found!',
				ephemeral: true
			});
		}

		const embed = new EmbedBuilder()
			.setColor(0xFF9800)
			.setTitle(`🏪 ${shop.name}`)
			.setDescription(shop.description)
			.setTimestamp();

		// List items
		const itemLines = [];

		for (const shopItem of shop.items) {
			const item = getItem(shopItem.item);
			if (!item) continue;

			const rarityEmoji = getRarityEmoji(item.rarity);
			const stockText = shopItem.stock === -1 ? '∞' : shopItem.stock;
			const levelReq = item.level ? ` (Lv ${item.level})` : '';

			itemLines.push(
				`${rarityEmoji} **${item.name}**${levelReq}\n` +
				`  💰 ${item.price} Copper | Stock: ${stockText}\n` +
				`  *${item.description}*`
			);
		}

		embed.addFields({
			name: 'Available Items',
			value: itemLines.join('\n\n') || '*No items available*',
			inline: false
		});

		// Show player balance
		const playerBalance = getTotalCopper(profile.Currency);
		embed.setFooter({ text: `Your balance: ${playerBalance} Copper | Use /buy to purchase` });

		await interaction.reply({ embeds: [embed] });
	}
};
