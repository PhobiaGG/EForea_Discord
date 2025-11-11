const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addCurrency, formatCurrency } = require('../systems/items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Claim your daily login rewards'),

	async execute(interaction, client) {
		const profile = client.db.getProfile(interaction.user.id);

		// Check if daily was already claimed today
		const now = Date.now();
		const lastDaily = profile.LastDaily || 0;
		const dayInMs = 24 * 60 * 60 * 1000;

		if (now - lastDaily < dayInMs) {
			const timeLeft = dayInMs - (now - lastDaily);
			const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
			const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

			return interaction.reply({
				content: `⏰ You've already claimed your daily reward! Come back in ${hoursLeft}h ${minutesLeft}m.`,
				ephemeral: true
			});
		}

		// Calculate daily rewards (scales with level)
		const level = profile.PlrStats.Level;
		const baseCopper = 100;
		const baseSilver = 1;

		const copperReward = Math.floor(baseCopper + (level * 10));
		const silverReward = Math.floor(baseSilver + (level * 0.5));

		const rewards = {
			Copper: copperReward,
			Silver: silverReward,
			Gold: 0,
			Platinum: 0
		};

		// Bonus rewards for higher levels
		if (level >= 10) {
			rewards.Gold = Math.floor(level / 10);
		}

		// Apply rewards
		addCurrency(profile, rewards);
		profile.LastDaily = now;

		// Save profile
		client.db.updateProfile(interaction.user.id, profile);

		// Send confirmation
		const embed = new EmbedBuilder()
			.setColor(0xFFD700)
			.setTitle('🎁 Daily Reward Claimed!')
			.setDescription(`Welcome back, ${interaction.user.username}!`)
			.addFields({
				name: 'Rewards',
				value: formatCurrency(rewards),
				inline: false
			})
			.setFooter({ text: 'Come back tomorrow for more rewards!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
