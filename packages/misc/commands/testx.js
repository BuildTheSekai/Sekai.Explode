const { SlashCommandBuilder } = require('discord.js');
const { LANG } = require('core');

module.exports = {
	data: new SlashCommandBuilder()
		.setName(LANG.commands.testx.name)
		.setDescription(LANG.commands.testx.description),
	execute: async function (interaction) {
		await interaction.reply(LANG.commands.testx.message);
	},
};
