import { CompoundCommandBuilder, LANG, strFormat } from 'core';
import { feature as db } from 'db';
import {
	APIEmbed,
	ApplicationCommandOptionChoiceData,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
} from 'discord.js';
import { Permission, PermissionManager } from '../PermissionManager';

const builder = new CompoundCommandBuilder(
	LANG.commands.perm.name,
	LANG.commands.perm.description,
);

const choices: ApplicationCommandOptionChoiceData<string>[] = [];

export function addChoice(choice: ApplicationCommandOptionChoiceData<string>) {
	choices.push(choice);
}

async function informNotInGuild(interaction: ChatInputCommandInteraction) {
	await interaction.reply({
		content: LANG.common.message.useCommandInGuild,
		ephemeral: true,
	});
	return;
}

async function checkMemberIsAdministrator(
	interaction: ChatInputCommandInteraction<'cached'>,
): Promise<boolean> {
	if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
		await interaction.reply({
			content: LANG.common.message.noPermission,
			ephemeral: true,
		});
		return false;
	}
	return true;
}

async function getPermissionOrInformNotFound(
	interaction: ChatInputCommandInteraction<'cached'>,
	permissionName: string,
): Promise<Permission | null> {
	const permissions = PermissionManager.forClient(interaction.client);
	const result = await permissions.get(interaction.guild, permissionName);
	if (result == null) {
		await interaction.reply(
			LANG.commands.perm.noSuchPermission
				.map((s) => strFormat(s, [permissionName]))
				.join('\n'),
		);
	}
	return result;
}

function permissionToEmbed(permission: Permission): APIEmbed {
	return {
		color: 0x88ff44,
		title: LANG.commands.perm.permissionInformation,
		fields: [
			{
				name: LANG.commands.perm.permissionName,
				value: permission.name,
			},
			{
				name: LANG.commands.perm.permissionGroup,
				value: permission.group.join(', '),
			},
		],
	};
}

builder
	.subcommand(
		LANG.commands.perm.subcommands.set.name,
		LANG.commands.perm.subcommands.set.description,
	)
	.addStringOption({
		name: LANG.commands.perm.options.permission.name,
		description: LANG.commands.perm.options.permission.description,
		required: true,
		async autocomplete(interaction) {
			await interaction.respond(choices);
		},
	})
	.addMentionableOption({
		name: LANG.commands.perm.options.group.name,
		description: LANG.commands.perm.options.group.description,
		required: true,
	})
	.build(async (interaction, permissionName, group) => {
		const connection = db.connection;
		if (!interaction.inCachedGuild()) {
			await informNotInGuild(interaction);
			return;
		}
		if (!(await checkMemberIsAdministrator(interaction))) {
			return;
		}
		const permissions = PermissionManager.forClient(interaction.client);
		const permission = await permissions.set(
			interaction.guild,
			permissionName,
			group,
		);
		await interaction.reply({
			content: LANG.commands.perm.permissionSet,
			embeds: [permissionToEmbed(permission)],
		});
	});

builder
	.subcommand(
		LANG.commands.perm.subcommands.get.name,
		LANG.commands.perm.subcommands.get.description,
	)
	.addStringOption({
		name: LANG.commands.perm.options.permission.name,
		description: LANG.commands.perm.options.permission.description,
		required: true,
		async autocomplete(interaction) {
			await interaction.respond(choices);
		},
	})
	.build(async (interaction, permissionName) => {
		const connection = db.connection;
		if (!interaction.inCachedGuild()) {
			await informNotInGuild(interaction);
			return;
		}
		const permission = await getPermissionOrInformNotFound(
			interaction,
			permissionName,
		);
		if (permission != null) {
			await interaction.reply({
				embeds: [permissionToEmbed(permission)],
			});
		}
	});

builder
	.subcommand(
		LANG.commands.perm.subcommands.remove.name,
		LANG.commands.perm.subcommands.remove.description,
	)
	.addStringOption({
		name: LANG.commands.perm.options.permission.name,
		description: LANG.commands.perm.options.permission.description,
		required: true,
		async autocomplete(interaction) {
			await interaction.respond(choices);
		},
	})
	.build(async (interaction, permissionName) => {
		if (!interaction.inCachedGuild()) {
			await informNotInGuild(interaction);
			return;
		}
		const permission = await getPermissionOrInformNotFound(
			interaction,
			permissionName,
		);
		if (permission != null) {
			await permission.remove();
			await interaction.reply({
				content: LANG.commands.perm.permissionRemoved,
				embeds: [permissionToEmbed(permission)],
			});
		}
	});

export default builder.build();
