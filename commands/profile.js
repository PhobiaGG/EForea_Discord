const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEffectiveStats, formatCurrency } = require('../systems/items');
const { getExpProgress, formatProgressBar, getSkillLevels } = require('../systems/leveling');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('View your player profile and stats')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('View another player\'s profile')
				.setRequired(false)
		),

	async execute(interaction, client) {
		const targetUser = interaction.options.getUser('user') || interaction.user;
		const profile = client.db.getProfile(targetUser.id);

		// Calculate effective stats (base + equipment)
		const effectiveStats = getEffectiveStats(profile);

		// Get XP progress
		const expProgress = getExpProgress(profile);

		// Get skill levels
		const skillLevels = getSkillLevels(profile);

		// Create embed
		const embed = new EmbedBuilder()
			.setColor(0x2196F3)
			.setTitle(`${targetUser.username}'s Profile`)
			.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
			.setTimestamp();

		// Level and XP section
		const progressBar = formatProgressBar(expProgress.percentage);
		embed.addFields({
			name: '📊 Level & Experience',
			value: `**Level:** ${effectiveStats.Level}\n` +
				`**XP:** ${expProgress.currentExp} / ${expProgress.requiredExp}\n` +
				`${progressBar} ${expProgress.percentage.toFixed(1)}%`,
			inline: false
		});

		// Combat Stats section
		embed.addFields({
			name: '⚔️ Combat Stats',
			value: `**Health:** ${effectiveStats.BaseHealth}\n` +
				`**Mana:** ${effectiveStats.Mana}\n` +
				`**Strength:** ${effectiveStats.Strength}\n` +
				`**Wisdom:** ${effectiveStats.Wisdom}\n` +
				`**Resistance:** ${effectiveStats.Resistence}\n` +
				`**Speed:** ${effectiveStats.Speed}`,
			inline: true
		});

		// Additional Stats section
		embed.addFields({
			name: '🎯 Additional Stats',
			value: `**Crit Chance:** ${effectiveStats.CritChance}%\n` +
				`**Crit Damage:** ${effectiveStats.CritDmg}%\n` +
				`**Attack Speed:** ${effectiveStats.AtkSpeed.toFixed(1)}\n` +
				`**Health Regen:** ${effectiveStats.HealthRegen}\n` +
				`**Vitality:** ${effectiveStats.Vitality}\n` +
				`**Fortune:** ${effectiveStats.Fortune}`,
			inline: true
		});

		// Currency section
		embed.addFields({
			name: '💰 Currency',
			value: formatCurrency(profile.Currency),
			inline: false
		});

		// Skills section
		embed.addFields({
			name: '🛠️ Skills',
			value: `**Mining:** Level ${skillLevels.Mining}\n` +
				`**Foraging:** Level ${skillLevels.Foraging}\n` +
				`**Fishing:** Level ${skillLevels.Fishing}\n` +
				`**Dungeoneering:** Level ${skillLevels.Dungeoneering}`,
			inline: true
		});

		// Equipment section
		const equippedItems = [];
		for (const slot in profile.EquippedItems) {
			const itemUuid = profile.EquippedItems[slot];
			if (itemUuid) {
				const itemsModule = require('../systems/items');
				const item = itemsModule.getItem(itemUuid);
				if (item) {
					equippedItems.push(`**${slot}:** ${item.name}`);
				}
			}
		}

		embed.addFields({
			name: '⚔️ Equipment',
			value: equippedItems.length > 0 ? equippedItems.join('\n') : '*No equipment*',
			inline: true
		});

		// Join date
		const joinDate = new Date(profile.JoinTimestamp);
		embed.setFooter({ text: `Player since ${joinDate.toLocaleDateString()}` });

		await interaction.reply({ embeds: [embed] });
	}
};
