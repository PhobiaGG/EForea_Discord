const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getEnemy, simulateCombat, applyRewards, formatCombatLog } = require('../systems/combat');
const { formatCurrency } = require('../systems/items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('battle')
		.setDescription('Engage in combat with an enemy')
		.addStringOption(option =>
			option
				.setName('enemy')
				.setDescription('The enemy to fight')
				.setRequired(true)
				.addChoices(
					{ name: 'Slime (Level 1)', value: 'slime' },
					{ name: 'Goblin (Level 3)', value: 'goblin' },
					{ name: 'Wolf (Level 5)', value: 'wolf' },
					{ name: 'Skeleton Warrior (Level 7)', value: 'skeleton' },
					{ name: 'Orc Brute (Level 10)', value: 'orc' },
					{ name: 'Dark Mage (Level 12)', value: 'dark_mage' },
					{ name: 'Dragon Whelp (Level 15)', value: 'dragon_whelp' },
					{ name: 'Ancient Golem (Level 20)', value: 'ancient_golem' }
				)
		),

	async execute(interaction, client) {
		const enemyId = interaction.options.getString('enemy');
		const profile = client.db.getProfile(interaction.user.id);

		// Get enemy data
		const enemy = getEnemy(enemyId);

		if (!enemy) {
			return interaction.reply({
				content: '❌ Enemy not found!',
				ephemeral: true
			});
		}

		// Defer reply for combat simulation
		await interaction.deferReply();

		// Simulate combat
		const combatResult = simulateCombat(profile, enemy);

		// Create combat embed
		const embed = new EmbedBuilder()
			.setTitle(`⚔️ Battle: ${interaction.user.username} vs ${enemy.name}`)
			.setDescription(enemy.description)
			.setColor(combatResult.victory ? 0x4CAF50 : 0xF44336)
			.setTimestamp();

		// Add combat log
		const combatLogText = formatCombatLog(combatResult.combatLog);
		embed.addFields({
			name: '📜 Combat Log',
			value: combatLogText.length > 1024 ? combatLogText.substring(0, 1021) + '...' : combatLogText,
			inline: false
		});

		// Result
		if (combatResult.victory) {
			// Apply rewards
			const expResult = applyRewards(profile, combatResult.rewards);

			// Save profile
			client.db.updateProfile(interaction.user.id, profile);

			// Victory message
			embed.addFields({
				name: '🎉 Victory!',
				value: `You defeated the ${enemy.name}!`,
				inline: false
			});

			// Rewards
			const rewardLines = [
				`**Experience:** +${combatResult.rewards.exp} XP`
			];

			if (Object.keys(combatResult.rewards.currency).length > 0) {
				rewardLines.push(`**Currency:** ${formatCurrency(combatResult.rewards.currency)}`);
			}

			if (combatResult.rewards.items.length > 0) {
				const itemsModule = require('../systems/items');
				const itemNames = combatResult.rewards.items.map(itemId => {
					const item = itemsModule.getItem(itemId);
					return item ? item.name : itemId;
				});
				rewardLines.push(`**Items:** ${itemNames.join(', ')}`);
			}

			embed.addFields({
				name: '🎁 Rewards',
				value: rewardLines.join('\n'),
				inline: false
			});

			// Level up notification
			if (expResult.levelUp) {
				const statsGained = [];
				for (const stat in expResult.statsGained) {
					statsGained.push(`+${expResult.statsGained[stat]} ${stat}`);
				}

				embed.addFields({
					name: '🆙 Level Up!',
					value: `**${expResult.oldLevel} → ${expResult.newLevel}**\n${statsGained.join(', ')}`,
					inline: false
				});
			}
		} else {
			// Defeat message
			embed.addFields({
				name: '💀 Defeat',
				value: `You were defeated by the ${enemy.name}.\nTrain harder and try again!`,
				inline: false
			});

			// Save profile anyway (XP from attempts could be added here in future)
			client.db.updateProfile(interaction.user.id, profile);
		}

		await interaction.editReply({ embeds: [embed] });
	}
};
