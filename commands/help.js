const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('View all available commands and game information'),

	async execute(interaction, client) {
		const embed = new EmbedBuilder()
			.setColor(0x9C27B0)
			.setTitle('📖 EForea RPG - Command Guide')
			.setDescription('A text-based Discord RPG with combat, gathering, and progression!')
			.addFields(
				{
					name: '👤 Profile Commands',
					value: '`/profile` - View your character stats and info\n' +
						'`/balance` - Check your currency\n' +
						'`/inventory` - View your items\n' +
						'`/equip` - Equip an item\n' +
						'`/unequip` - Unequip from a slot',
					inline: false
				},
				{
					name: '⚔️ Combat Commands',
					value: '`/battle [enemy]` - Fight an enemy\n' +
						'`/enemies` - List all enemies',
					inline: false
				},
				{
					name: '🛒 Economy Commands',
					value: '`/shop [name]` - Browse a shop\n' +
						'`/buy [item]` - Purchase an item\n' +
						'`/sell [item]` - Sell an item\n' +
						'`/daily` - Claim daily rewards',
					inline: false
				},
				{
					name: '⛏️ Gathering Commands',
					value: '`/mine` - Mine for ores\n' +
						'`/forage` - Gather wood and herbs\n' +
						'`/fish` - Go fishing',
					inline: false
				},
				{
					name: '📊 Information',
					value: '`/help` - Show this help menu\n' +
						'`/leaderboard` - View top players',
					inline: false
				}
			)
			.setFooter({ text: 'More features coming soon!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
