import { SlashCommandBuilder } from 'discord.js';
import { LANG } from 'core';
import { PlayerCommand } from '../PlayerCommand';
import { QueueRepeatMode } from 'discord-player';

module.exports = new PlayerCommand(
	new SlashCommandBuilder()
		.setName(LANG.commands.loop.name)
		.setDescription(LANG.commands.loop.description),

	async function (interaction, queue) {
		try {
			if (queue.repeatMode == QueueRepeatMode.OFF) {
				queue.setRepeatMode(QueueRepeatMode.TRACK);
				await interaction.reply(LANG.commands.loop.mode.track);
				return;
			}
			if (queue.repeatMode == QueueRepeatMode.TRACK) {
				queue.setRepeatMode(QueueRepeatMode.QUEUE);
				await interaction.reply(LANG.commands.loop.mode.queue);
				return;
			}
			if (queue.repeatMode == QueueRepeatMode.QUEUE) {
				queue.setRepeatMode(QueueRepeatMode.OFF);
				await interaction.reply(LANG.commands.loop.mode.off);
				return;
			}
		} catch (e) {
			await interaction.reply(`Something went wrong: ${e}`);
			return;
		}
	},
);

/*

declare enum QueueRepeatMode {
    OFF = 0,
    TRACK = 1,
    QUEUE = 2,
    AUTOPLAY = 3
}

*/
