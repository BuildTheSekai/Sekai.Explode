import assert from 'assert';
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { LANG, Config, Command, Pager } from 'core';
import { ClientMessageHandler, ReplyPattern } from '../util/messages';
import { feature as perms } from 'perms';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(LANG.commands.reply.name)
		.setDescription(LANG.commands.reply.description)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.reply.subcommands.add.name)
				.setDescription(LANG.commands.reply.subcommands.add.description)
				.addStringOption((option) =>
					option
						.setName(LANG.commands.reply.subcommands.add.options.message.name)
						.setDescription(
							LANG.commands.reply.subcommands.add.options.message.description,
						)
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName(LANG.commands.reply.subcommands.add.options.reply.name)
						.setDescription(
							LANG.commands.reply.subcommands.add.options.reply.description,
						)
						.setRequired(true),
				)
				.addBooleanOption((option) =>
					option
						.setName(
							LANG.commands.reply.subcommands.add.options.perfectMatching.name,
						)
						.setDescription(
							LANG.commands.reply.subcommands.add.options.perfectMatching
								.description,
						)
						.setRequired(false),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.reply.subcommands.remove.name)
				.setDescription(LANG.commands.reply.subcommands.remove.description)
				.addStringOption((option) =>
					option
						.setName(
							LANG.commands.reply.subcommands.remove.options.message.name,
						)
						.setDescription(
							LANG.commands.reply.subcommands.remove.options.message
								.description,
						)
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName(LANG.commands.reply.subcommands.list.name)
				.setDescription(LANG.commands.reply.subcommands.list.description),
		),

	async execute(interaction) {
		if (!interaction.inCachedGuild()) {
			await interaction.reply(LANG.commands.reply.notInGuildError);
			return;
		}
		const guild = interaction.guild;

		const subcommand = interaction.options.getSubcommand();
		const clientMessageHandler = ClientMessageHandler.instance;
		assert(clientMessageHandler != null);

		const guildMessageHandler = clientMessageHandler.getGuildMessageHandler(
			guild.id,
		);

		switch (subcommand) {
			case LANG.commands.reply.subcommands.add.name: {
				if (!(await checkPermission(interaction))) {
					return;
				}
				const replyPattern = new ReplyPattern(
					interaction.options.getString(
						LANG.commands.reply.subcommands.add.options.message.name,
						true,
					),
					interaction.options.getString(
						LANG.commands.reply.subcommands.add.options.reply.name,
						true,
					),
					interaction.options.getBoolean(
						LANG.commands.reply.subcommands.add.options.perfectMatching.name,
						false,
					) ?? false,
				);
				const success = await guildMessageHandler.addReplyPattern(replyPattern);
				if (success) {
					await interaction.reply(
						LANG.commands.reply.subcommands.add.succeeded + '\n' + replyPattern,
					);
				} else {
					await interaction.reply({
						content: LANG.commands.reply.subcommands.add.alreadyExists,
						ephemeral: true,
					});
				}
				return;
			}

			case LANG.commands.reply.subcommands.remove.name: {
				if (!(await checkPermission(interaction))) {
					return;
				}
				const replyPattern = await guildMessageHandler.removeReplyPattern(
					interaction.options.getString(
						LANG.commands.reply.subcommands.remove.options.message.name,
						true,
					),
				);
				if (replyPattern != null) {
					await interaction.reply(
						LANG.commands.reply.subcommands.remove.succeeded +
							'\n' +
							replyPattern,
					);
				} else {
					await interaction.reply({
						content: LANG.commands.reply.subcommands.remove.doNotExist,
						ephemeral: true,
					});
				}
				return;
			}

			case LANG.commands.reply.subcommands.list.name: {
				const replyPatterns = await guildMessageHandler.getReplyPatterns();
				const pager = new Pager(
					replyPatterns.map((pattern) => `- ${pattern}`),
					{
						title: LANG.commands.reply.subcommands.list.title,
						color: 'Green',
						emptyMessage: LANG.commands.reply.subcommands.list.emptyMessage,
					},
				);
				await pager.replyTo(interaction);
				return;
			}

			default:
				assert.fail(subcommand);
		}
	},
} as Command;

/**
 * 使う権限があるかをチェックする。
 */
async function checkPermission(
	interaction: ChatInputCommandInteraction<'cached'>,
) {
	const replyCustomizePermission = await perms.permissions?.get(
		interaction.guild,
		'replyCustomize',
	);
	if (
		interaction.member != null &&
		replyCustomizePermission?.hasMember(interaction.member)
	) {
		return true;
	}
	if (!Config.replyCustomizeAllowedUsers?.includes(interaction.user.id)) {
		await interaction.reply({
			content: LANG.commands.reply.permissionError,
			ephemeral: true,
		});
		return false;
	}
	return true;
}
