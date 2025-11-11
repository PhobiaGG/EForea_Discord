const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addItemToInventory, getEffectiveStats } = require('../systems/items');
const { addExperience } = require('../systems/leveling');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mine')
		.setDescription('Mine for ores and minerals'),

	async execute(interaction, client) {
		const profile = client.db.getProfile(interaction.user.id);
		const stats = getEffectiveStats(profile);

		// Check cooldown (30 seconds)
		const now = Date.now();
		const lastMine = profile.LastMine || 0;
		const cooldown = 30000; // 30 seconds

		if (now - lastMine < cooldown) {
			const timeLeft = Math.ceil((cooldown - (now - lastMine)) / 1000);
			return interaction.reply({
				content: `⏰ You're tired from mining. Wait ${timeLeft} seconds before mining again.`,
				ephemeral: true
			});
		}

		// Determine what was mined
		const miningSpeed = stats.MiningSpeed || 1;
		const fortune = stats.Fortune || 1;

		const possibleDrops = [
			{ item: 'copper_ore', chance: 0.7, quantity: [1, 3] },
			{ item: 'iron_ore', chance: 0.25, quantity: [1, 2] },
			{ item: 'magic_crystal', chance: 0.05, quantity: [1, 1] }
		];

		const rewards = [];
		const expGained = 10 * miningSpeed;

		for (const drop of possibleDrops) {
			const adjustedChance = Math.min(1, drop.chance * (fortune * 0.1 + 1));

			if (Math.random() < adjustedChance) {
				const [min, max] = drop.quantity;
				const quantity = Math.floor(Math.random() * (max - min + 1) + min) * Math.ceil(miningSpeed);

				addItemToInventory(profile, drop.item, quantity);
				rewards.push({ item: drop.item, quantity });
			}
		}

		// Add experience
		const expResult = addExperience(profile, expGained, 'MiningExp');

		// Update cooldown
		profile.LastMine = now;

		// Save profile
		client.db.updateProfile(interaction.user.id, profile);

		// Create response embed
		const embed = new EmbedBuilder()
			.setColor(0x795548)
			.setTitle('⛏️ Mining Result')
			.setTimestamp();

		if (rewards.length === 0) {
			embed.setDescription('You swing your pickaxe but find nothing valuable this time.');
		} else {
			const rewardLines = rewards.map(r => {
				const itemModule = require('../systems/items');
				const item = itemModule.getItem(r.item);
				return `**${item.name}** x${r.quantity}`;
			});

			embed.setDescription('You strike the rock and discover:\n' + rewardLines.join('\n'));
		}

		embed.addFields({
			name: 'Experience',
			value: `+${expGained} Mining XP`,
			inline: true
		});

		// Check for level up (mining skill)
		const levelingModule = require('../systems/leveling');
		const miningLevel = levelingModule.getSkillLevel(profile.Exp.MiningExp);

		embed.addFields({
			name: 'Mining Level',
			value: `${miningLevel}`,
			inline: true
		});

		await interaction.reply({ embeds: [embed] });
	}
};
