const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { unequipItem } = require('../systems/items');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unequip')
		.setDescription('Unequip an item from an equipment slot')
		.addStringOption(option =>
			option
				.setName('slot')
				.setDescription('Equipment slot to unequip from')
				.setRequired(true)
				.addChoices(
					{ name: 'Helmet', value: 'Helmet' },
					{ name: 'Chestplate', value: 'Chestplate' },
					{ name: 'Greaves', value: 'Greaves' },
					{ name: 'Gauntlets', value: 'Gauntlets' },
					{ name: 'Weapon Slot 1', value: 'WeaponSlotOne' },
					{ name: 'Weapon Slot 2', value: 'WeaponSlotTwo' },
					{ name: 'Accessory 1', value: 'AccessoryOne' },
					{ name: 'Accessory 2', value: 'AccessoryTwo' }
				)
		),

	async execute(interaction, client) {
		const slot = interaction.options.getString('slot');
		const profile = client.db.getProfile(interaction.user.id);

		// Attempt to unequip
		const result = unequipItem(profile, slot);

		if (!result.success) {
			return interaction.reply({
				content: `❌ ${result.error}`,
				ephemeral: true
			});
		}

		// Save profile
		client.db.updateProfile(interaction.user.id, profile);

		// Send confirmation
		const embed = new EmbedBuilder()
			.setColor(0x9E9E9E)
			.setTitle('⚔️ Equipment Updated')
			.setDescription(`Successfully unequipped **${result.item}** from ${slot}`)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
