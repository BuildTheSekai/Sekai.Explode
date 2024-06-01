import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import FormData from 'form-data';
import { Config, LANG, strFormat } from 'core';

export default {
	data: new SlashCommandBuilder()
		.setName(LANG.commands.upload.name)
		.setDescription(LANG.commands.upload.description)
		.addAttachmentOption((option) =>
			option
				.setName(LANG.commands.upload.options.file.name)
				.setRequired(true)
				.setDescription(LANG.commands.upload.options.file.description),
		)
		.addStringOption((option) =>
			option
				.setName(LANG.commands.upload.options.filename.name)
				.setDescription(LANG.commands.upload.options.filename.description),
		)
		.addBooleanOption((option) =>
			option
				.setName(LANG.commands.upload.options.private.name)
				.setDescription(LANG.commands.upload.options.private.description)
				.setRequired(false),
		),
	execute: async function (interaction: ChatInputCommandInteraction) {
		if (!Config.cdnUploadURL || !Config.uploadAllowUsers) {
			await interaction.reply(LANG.commands.upload.internalError);
			return;
		}
		if (!Config.uploadAllowUsers.includes(interaction.user.id)) {
			await interaction.reply({
				content: LANG.commands.upload.permissionError,
				ephemeral: true,
			});
			return;
		}
		await interaction.deferReply();
		const file = interaction.options.getAttachment(
			LANG.commands.upload.options.file.name,
		)!;

		try {
			const res = await fetch(file.url);
			const resData = await res.arrayBuffer();
			const form = new FormData();
			const filename = interaction.options.getString(
				LANG.commands.upload.options.filename.name,
			);
			const isPrivate =
				interaction.options.getBoolean(
					LANG.commands.upload.options.private.name,
				) == true;
			console.log(strFormat(LANG.commands.upload.isPrivateLog, [isPrivate]));
			form.append('file', Buffer.from(resData), filename || file.name);
			const res2 = await axios.post(Config.cdnUploadURL, form, {
				params: {
					private: isPrivate,
				},
				headers: form.getHeaders(),
			});
			// console.log(res)
			// console.log("==========")
			// console.log(res2)
			const cdnURL =
				Config.cdnRootURL + (isPrivate ? 'private/' : '') + res2.data.fileName;
			interaction.editReply(LANG.commands.upload.fileUploaded + '\n' + cdnURL);
			const user = interaction.user;
			const dmChannel = await user.createDM();
			dmChannel.send({
				embeds: [
					{
						title: strFormat(LANG.commands.upload.result.title, {
							filename: res2.data.fileName,
							isPrivate: isPrivate
								? LANG.commands.upload.result.isPrivate.yes
								: LANG.commands.upload.result.isPrivate.no,
						}),
						color: 0x5865f2,
						fields: [
							{
								name: LANG.commands.upload.result.url,
								value:
									'```' +
									cdnURL +
									'```' +
									`\n[${LANG.commands.upload.result.clickToCopy}](https://paste-pgpj.onrender.com/?p=` +
									encodeURIComponent(cdnURL) +
									')',
							},
						],
					},
				],
			});
			try {
				if (!Config.cfZone || !Config.cfToken || !Config.cfPurgeUrl) return;
				axios.post(
					`https://api.cloudflare.com/client/v4/zones/${Config.cfZone}/purge_cache`,
					{
						files: [Config.cfPurgeUrl],
					},
					{
						headers: {
							Authorization: `Bearer ${Config.cfToken}`,
							'Content-Type': 'application/json',
						},
					},
				);
			} catch (e) {
				console.error(e);
			}
		} catch (e: any) {
			if (e?.name == 'AxiosError' && e?.response?.status) {
				await interaction.editReply({
					embeds: [
						{
							title: LANG.commands.upload.errorResult.title,
							description: strFormat(
								LANG.commands.upload.errorResult.description,
								{
									statusText: e.response.statusText,
									status: e.response.status,
								},
							),
							color: 0xff0000,
							footer: {
								text: LANG.commands.upload.errorResult.footer,
							},
						},
					],
				});
			} else {
				throw e;
			}
		}
	},
};
