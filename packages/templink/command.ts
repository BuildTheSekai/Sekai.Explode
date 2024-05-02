import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { LANG, strFormat } from 'core';
import {
	areTempLinksEnabled,
	createTempLink,
	InvalidURLError,
} from './templinks';
import { AxiosError } from 'axios';

export default {
	data: new SlashCommandBuilder()
		.setName(LANG.commands.templink.name)
		.setDescription(LANG.commands.templink.description)
		.addStringOption((option) =>
			option
				.setName(LANG.commands.templink.options.url.name)
				.setDescription(LANG.commands.templink.options.url.description)
				.setRequired(true),
		),
	execute: async function (interaction: CommandInteraction) {
		if (!areTempLinksEnabled()) {
			await interaction.reply(LANG.commands.templink.internalError);
			return;
		}
		const url = interaction.options.get(
			LANG.commands.templink.options.url.name,
			true,
		).value as string;
		try {
			const { id, link } = await createTempLink(url, 1000 * 300);
			console.log(strFormat(LANG.commands.templink.linkCreated, { id, url }));
			await interaction.reply({
				content: undefined,
				embeds: [
					{
						title: LANG.commands.templink.result.title,
						description: LANG.commands.templink.result.description,
						fields: [
							{
								name: LANG.commands.templink.result.link,
								value: link,
							},
						],
					},
				],
			});
		} catch (e) {
			if (e instanceof InvalidURLError) {
				await interaction.reply({
					content: LANG.commands.templink.invalidUrlError.join('\n'),
					ephemeral: true,
				});
			} else if (e instanceof AxiosError) {
				await interaction.reply({
					content:
						strFormat(LANG.commands.templink.httpError, [e.response?.status]) +
						'\n' +
						e.response?.data?.error?.description,
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: LANG.commands.templink.generalError,
					ephemeral: true,
				});
				console.error(e);
			}
		}
	},
};
