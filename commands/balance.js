const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatCurrency, getTotalCopper } = require('../systems/items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Check your currency balance')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Check another player\'s balance')
				.setRequired(false)
		),

	async execute(interaction, client) {
		const targetUser = interaction.options.getUser('user') || interaction.user;
		const profile = client.db.getProfile(targetUser.id);

		const totalCopper = getTotalCopper(profile.Currency);

		const embed = new EmbedBuilder()
			.setColor(0xFFD700)
			.setTitle(`💰 ${targetUser.username}'s Balance`)
			.setDescription(formatCurrency(profile.Currency))
			.addFields({
				name: 'Total Value',
				value: `${totalCopper} Copper`,
				inline: false
			})
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
