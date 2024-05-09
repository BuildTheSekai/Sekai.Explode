import { CompoundCommandBuilder } from 'core';
import { feature as db } from 'db';
import {
	APIEmbed,
	ApplicationCommandOptionChoiceData,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
} from 'discord.js';
import { Permission, PermissionManager } from '../PermissionManager';

const builder = new CompoundCommandBuilder('perm', '権限の設定');

const choices: ApplicationCommandOptionChoiceData<string>[] = [];

export function addChoice(choice: ApplicationCommandOptionChoiceData<string>) {
	choices.push(choice);
}

async function informNotInGuild(interaction: ChatInputCommandInteraction) {
	await interaction.reply({
		content: 'このコマンドはサーバー内で使用してください！',
		ephemeral: true,
	});
	return;
}

async function checkMemberIsAdministrator(
	interaction: ChatInputCommandInteraction<'cached'>,
): Promise<boolean> {
	if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
		await interaction.reply({
			content: '権限がありません！',
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
			`権限名: ${permissionName}\nその名前の権限はありません!`,
		);
	}
	return result;
}

function permissionToEmbed(permission: Permission): APIEmbed {
	return {
		color: 0x88ff44,
		title: '権限情報',
		fields: [
			{
				name: '権限名',
				value: permission.name,
			},
			{
				name: 'ロール/メンバー',
				value: permission.group.join(', '),
			},
		],
	};
}

builder
	.subcommand('set', '値の更新')
	.addStringOption({
		name: 'permission',
		description: '権限名',
		required: true,
		async autocomplete(interaction) {
			await interaction.respond(choices);
		},
	})
	.addMentionableOption({
		name: 'group',
		description: '対象のロールまたはユーザー',
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
			content: '権限を追加しました!',
			embeds: [permissionToEmbed(permission)],
		});
	});

builder
	.subcommand('get', '値の取得')
	.addStringOption({
		name: 'permission',
		description: '権限名',
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
	.subcommand('remove', '値の削除')
	.addStringOption({
		name: 'permission',
		description: '権限名',
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
				content: '権限を削除しました',
				embeds: [permissionToEmbed(permission)],
			});
		}
	});

export default builder.build();
