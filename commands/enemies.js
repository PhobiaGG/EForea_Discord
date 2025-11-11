const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAllEnemies } = require('../systems/combat');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('enemies')
		.setDescription('View all available enemies'),

	async execute(interaction, client) {
		const enemies = getAllEnemies();

		const embed = new EmbedBuilder()
			.setColor(0xF44336)
			.setTitle('👹 Enemy Bestiary')
			.setDescription('Choose your battles wisely!')
			.setTimestamp();

		// Sort enemies by level
		const sortedEnemies = Object.values(enemies).sort((a, b) => a.level - b.level);

		for (const enemy of sortedEnemies) {
			const rewardText = [];

			if (enemy.rewards.exp) {
				rewardText.push(`${enemy.rewards.exp} XP`);
			}

			if (enemy.rewards.copper) {
				const [min, max] = enemy.rewards.copper;
				rewardText.push(`${min}-${max} 🪙`);
			}

			if (enemy.rewards.silver) {
				const [min, max] = enemy.rewards.silver;
				rewardText.push(`${min}-${max} 🥈`);
			}

			if (enemy.rewards.gold) {
				const [min, max] = enemy.rewards.gold;
				rewardText.push(`${min}-${max} 🥇`);
			}

			embed.addFields({
				name: `${enemy.name} (Level ${enemy.level})`,
				value: `**HP:** ${enemy.health} | **STR:** ${enemy.stats.Strength} | **RES:** ${enemy.stats.Resistence}\n` +
					`**Rewards:** ${rewardText.join(', ')}\n` +
					`*${enemy.description}*`,
				inline: false
			});
		}

		embed.setFooter({ text: 'Use /battle [enemy] to fight!' });

		await interaction.reply({ embeds: [embed] });
	}
};
