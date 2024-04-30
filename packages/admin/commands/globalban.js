const {
	SlashCommandBuilder,
	PermissionsBitField,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} = require('discord.js');
const { feature: db } = require('db'); //*MongoDB
const { AdminUserIDs } = require('../../../config.json');
const Pager = require('../../../util/pager');
const { LANG, strFormat } = require('../../../util/languages');
const config = require('../../../config.json');
const cooldowns = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName(LANG.commands.globalban.name)
		.setDescription(LANG.commands.globalban.description)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.globalban.subcommands.sync.name)
				.setDescription(LANG.commands.globalban.subcommands.sync.description),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.globalban.subcommands.add.name)
				.setDescription(LANG.commands.globalban.subcommands.add.description)
				.addUserOption((option) =>
					option
						.setName(LANG.commands.globalban.addRemoveOptionNames.user)
						.setDescription(
							LANG.commands.globalban.subcommands.add.options.user.description,
						)
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName(LANG.commands.globalban.addRemoveOptionNames.reason)
						.setDescription(
							LANG.commands.globalban.subcommands.add.options.reason
								.description,
						)
						.setRequired(false),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.globalban.subcommands.remove.name)
				.setDescription(LANG.commands.globalban.subcommands.remove.description)
				.addUserOption((option) =>
					option
						.setName(LANG.commands.globalban.addRemoveOptionNames.user)
						.setDescription(
							LANG.commands.globalban.subcommands.remove.options.user
								.description,
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.globalban.subcommands.report.name)
				.setDescription(LANG.commands.globalban.subcommands.report.description),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.globalban.subcommands.list.name)
				.setDescription(LANG.commands.globalban.subcommands.list.description),
		),
	execute: async function (
		/** @type {import("discord.js").CommandInteraction} */ interaction,
		/** @type {Client} */ client,
	) {
		const executorID = interaction.user.id; // executed by
		const subcommand = interaction.options.getSubcommand();
		if (!subcommand) {
			await interaction.reply(
				LANG.commands.globalban.subcommandUnspecifiedError,
			);
			return;
		}

		if (subcommand !== LANG.commands.globalban.subcommands.report.name) {
			// console.log('Defering'); devlog
			await interaction.deferReply();
		}
		if (subcommand === LANG.commands.globalban.subcommands.sync.name) {
			const member = interaction.guild.members.cache.get(interaction.user.id);
			if (!member.permissions.has([PermissionsBitField.Flags.Administrator])) {
				await interaction.editReply({
					content: LANG.commands.globalban.subcommands.sync.permissionError,
					ephemeral: true,
				});
				return;
			}
			try {
				// データベースから全てのユーザーを取得
				const userCollection = db.connection.collection('globalBans');
				const allUsers = await userCollection.find({}).toArray();

				// ユーザー情報をログに表示
				await interaction.editReply(
					LANG.commands.globalban.subcommands.sync.synchronizingWithDatabase,
				);
				const bans = await interaction.guild.bans.fetch();
				let banscount = 0;
				allUsers.forEach((user) => {
					console.log(
						strFormat(LANG.commands.globalban.subcommands.sync.userBanning, {
							name: user.userName,
							id: user.userId,
							reason:
								user.reason ||
								LANG.commands.globalban.subcommands.sync.reasonNotProvided,
						}),
					);
					const usrid = user.userId;
					if (!bans.has(usrid)) {
						const reason = `${user.reason || LANG.commands.globalban.noReason}`;
						interaction.guild.members.ban(user.userId, {
							reason: strFormat(
								LANG.commands.globalban.globalBanReason,
								reason,
							),
						});
						banscount++;
					}
				});

				await interaction.editReply({
					embeds: [
						{
							title:
								LANG.commands.globalban.subcommands.sync
									.synchronizedWithDatabase,
							description: strFormat(
								LANG.commands.globalban.subcommands.sync.bannedUsers,
								[banscount],
							),
							color: 0xff0000,
							footer: {
								text: LANG.commands.globalban.subcommands.sync.serviceProvider,
							},
						},
					],
				});
				return;
			} catch (error) {
				console.error(error);
				await interaction.editReply(
					LANG.commands.globalban.generalError + '\n```' + error + '\n```',
				);
				return;
			}
		}
		let user = null;
		let reason = null;
		if (
			subcommand === LANG.commands.globalban.subcommands.add.name ||
			subcommand === LANG.commands.globalban.subcommands.remove.name
		) {
			if (!AdminUserIDs.includes(executorID)) {
				await interaction.editReply(LANG.commands.globalban.permissionError);
				return;
			}
			user = interaction.options.getUser(
				LANG.commands.globalban.addRemoveOptionNames.user,
			);
			reason = interaction.options.getString(
				LANG.commands.globalban.addRemoveOptionNames.reason,
			);
		}

		//*add/rm
		if (subcommand === LANG.commands.globalban.subcommands.add.name) {
			try {
				const existingBan = await db.connection
					.collection('globalBans')
					.findOne({ userId: user.id });
				if (existingBan) {
					await interaction.editReply(
						strFormat(LANG.commands.globalban.subcommands.add.alreadyExists, [
							user.tag,
						]),
					);
					return;
				}
				await db.connection.collection('globalBans').insertOne({
					userId: user.id,
					userName: user.tag,
					reason: reason,
				});
				let done = 0;
				let fail = 0;
				await interaction.client.guilds.cache.forEach((g) => {
					// Botが参加しているすべてのサーバーで実行
					try {
						g.members.ban(user.id, {
							reason: strFormat(LANG.commands.globalban.globalBanReason, [
								reason,
							]),
						}); // メンバーをBAN
						done++;
					} catch (e) {
						fail++;
						if (e.code) {
							console.error(
								strFormat(LANG.commands.globalban.operationFailedWithCode, {
									guildName: g.name,
									code: e.code,
								}),
							);
						} else {
							console.log(
								strFormat(LANG.commands.globalban.operationFailed, {
									guildName: g.name,
								}) +
									'\n' +
									e,
							); // エラーが出たとき
						}
					}
				});
				await interaction.editReply(
					strFormat(LANG.commands.globalban.subcommands.add.userAdded, [
						user.tag,
					]),
				);
				console.log(
					strFormat(LANG.commands.globalban.operationResult, { done, fail }),
				);
				return;
			} catch (error) {
				console.error(error);
				await interaction.editReply(
					LANG.commands.globalban.generalError + '\n```' + error + '\n```',
				);
				return;
			}
		} else if (subcommand === LANG.commands.globalban.subcommands.remove.name) {
			try {
				const existingBan = await db.connection
					.collection('globalBans')
					.findOne({ userId: user.id });
				if (!existingBan) {
					await interaction.editReply(
						strFormat(LANG.commands.globalban.subcommands.remove.doNotExist, [
							user.tag,
						]),
					);
					return;
				}

				await db.connection
					.collection('globalBans')
					.deleteOne({ userId: user.id });
				let done = 0;
				let fail = 0;
				interaction.client.guilds.cache.forEach((g) => {
					// Botが参加しているすべてのサーバーで実行
					try {
						g.members.unban(user.id); // メンバーをBAN
						console.log(
							strFormat(LANG.commands.globalban.operationSucceeded, {
								guildName: g.name,
							}),
						); // 成功したらコンソールに出す
						done++;
					} catch (e) {
						fail++;
						if (e.code) {
							console.error(
								strFormat(LANG.commands.globalban.operationFailedWithCode, {
									guildName: g.name,
									code: e.code,
								}),
							);
						} else {
							console.log(
								strFormat(LANG.commands.globalban.operationFailed, {
									guildName: g.name,
								}),
							); // エラーが出たとき
						}
					}
				});
				await interaction.editReply(
					strFormat(LANG.commands.globalban.subcommands.remove.userRemoved, [
						user.tag,
					]),
				);
				console.log(
					strFormat(LANG.commands.globalban.operationResult, { done, fail }),
				);
			} catch (error) {
				console.error(error);
				await interaction.editReply(
					LANG.commands.globalban.generalError + '\n```' + error + '\n```',
				);
			}

			//*LIST
		} else if (subcommand === LANG.commands.globalban.subcommands.list.name) {
			try {
				const userCollection = db.connection.collection('globalBans');
				const bans = await userCollection.find({}).toArray();
				const pager = new Pager(
					bans.map((ban) =>
						strFormat(LANG.commands.globalban.subcommands.list.record, {
							user:
								'**' +
								strFormat(LANG.commands.globalban.subcommands.list.recordUser, {
									name: ban.userName,
									id: ban.userId,
								}) +
								'**',
							reason: ban.reason || LANG.commands.globalban.noReason,
						}),
					),
					{
						title: (pager) =>
							!pager.isEmpty()
								? LANG.commands.globalban.subcommands.list.title
								: LANG.commands.globalban.subcommands.list.errorTitle,
						color: (pager) => (!pager.isEmpty() ? 0xde2323 : 0xff0000),
						fieldName: (pager) =>
							!pager.isEmpty()
								? LANG.commands.globalban.subcommands.list.fieldName
								: null,
						emptyMessage: LANG.commands.globalban.subcommands.list.emptyMessage,
						footer(pager) {
							if (pager.isEmpty()) {
								return {
									text: LANG.commands.globalban.subcommands.list.errorFooter,
								};
							}
							return {
								text: strFormat(
									LANG.commands.globalban.subcommands.list.footer,
									{
										page: pager.page + 1,
										pageCount: pager.pageCount,
										length: pager.items.length,
										start: pager.start + 1,
										end: pager.end,
									},
								),
							};
						},
					},
				);
				await pager.replyTo(interaction);
			} catch (error) {
				console.error(error);

				await interaction.editReply({
					embeds: [
						{
							title: LANG.commands.globalban.subcommands.list.errorTitle,
							description: strFormat(
								LANG.commands.globalban.subcommands.list.errorDescription,
								[error],
							),
							color: 0xff0000,
							footer: {
								text: LANG.commands.globalban.subcommands.list.errorFooter,
							},
						},
					],
				});
			}
		} else if (subcommand === LANG.commands.globalban.subcommands.report.name) {
			const cooldownTime = 30;
			if (cooldowns.has(interaction.user.id)) {
				const expirationTime = cooldowns.get(interaction.user.id);
				const currTime = Date.now();

				const remainingTime = Math.ceil((expirationTime - currTime) / 1000);
				if (remainingTime > 0) {
					await interaction.reply(
						strFormat(LANG.commands.dm.cooldown, [remainingTime]),
					);
					return;
				}
			}
			const modal = new ModalBuilder()
				.setCustomId('gbanReport')
				.setTitle(LANG.commands.globalban.subcommands.report.modal.title);
			const targetid = new TextInputBuilder()
				.setCustomId('reportuserid')
				.setLabel(
					LANG.commands.globalban.subcommands.report.modal.firstRow.label,
				)
				.setStyle(TextInputStyle.Short)
				.setMinLength(17)
				.setPlaceholder(
					LANG.commands.globalban.subcommands.report.modal.firstRow.placeholder,
				)
				.setRequired(true);

			const reason = new TextInputBuilder()
				.setCustomId('reason')
				.setLabel(
					LANG.commands.globalban.subcommands.report.modal.secondRow.label,
				)
				.setStyle(TextInputStyle.Paragraph)
				.setPlaceholder(
					LANG.commands.globalban.subcommands.report.modal.secondRow
						.placeholder,
				)
				.setRequired(true);
			const firstRow = new ActionRowBuilder().addComponents(targetid);
			const secondRow = new ActionRowBuilder().addComponents(reason);
			modal.addComponents(firstRow, secondRow);
			await interaction.showModal(modal);
			// const filter = (mInteraction) => mInteraction.customId === 'gbanreport';
			const submitted = await interaction
				.awaitModalSubmit({
					time: 60000,
					filter: (i) => i.user.id === interaction.user.id,
				})
				.catch((e) => console.error(e));
			if (submitted) {
				//TODO: 通報された情報をどこかに送信
				const resultid = submitted.fields.getTextInputValue('reportuserid');
				const resultreason = submitted.fields.getTextInputValue('reason');
				await submitted.reply({
					embeds: [
						{
							title: LANG.commands.globalban.subcommands.report.submitted.title,
							description: strFormat(
								LANG.commands.globalban.subcommands.report.submitted
									.description,
								resultid,
							),
						},
					],
					ephemeral: true,
				});
				if (!config.notificationChannel) {
					throw new Error(LANG.commands.globalban.subcommands.report.error);
				}
				const channel = client.channels.cache.get(config.notificationChannel);
				const d = new Date();
				const u = d.getTime();
				const fxunix = Math.floor(u / 1000);
				const reportedby = interaction.user.id;
				await channel.send({
					embeds: [
						{
							title: LANG.commands.globalban.subcommands.report.result.title,
							description: strFormat(
								LANG.commands.globalban.subcommands.report.result.description,
								reportedby,
								fxunix,
							),
							color: 0xff0000,
							fields: [
								{
									name: LANG.commands.globalban.subcommands.report.result.field1
										.name,
									value: strFormat(
										LANG.commands.globalban.subcommands.report.result.field1
											.value,
										resultid,
									),
								},
								{
									name: LANG.commands.globalban.subcommands.report.result.field2
										.name,
									value: resultreason,
								},
							],
						},
					],
				});
			}
			const expirationTime = Date.now() + cooldownTime * 1000;
			cooldowns.set(interaction.user.id, expirationTime);
		} else {
			await interaction.editReply(
				LANG.commands.globalban.unsupportedSubcommandError,
			);
		}
	},
};
