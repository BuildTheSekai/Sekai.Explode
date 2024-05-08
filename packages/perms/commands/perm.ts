import { CompoundCommandBuilder } from 'core';
import { feature as db } from 'db';
import { PermissionFlagsBits } from 'discord.js';
import { PermissionManager } from '../PermissionManager';

const builder = new CompoundCommandBuilder('perm', '権限の設定');

builder
	.subcommand('set', '値の更新')
	.addStringOption({
		name: 'permission',
		description: '権限名',
		required: true,
		async autocomplete(interaction) {
			await interaction.respond([
				{
					name: '自動応答の設定',
					value: 'replyCustomize',
				},
			]);
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
			await interaction.reply({
				content: 'このコマンドはサーバー内で使用してください！',
				ephemeral: true,
			});
			return;
		}
		if (
			!interaction.member.permissions.has(PermissionFlagsBits.Administrator)
		) {
			await interaction.reply({
				content: '権限がありません！',
				ephemeral: true,
			});
			return;
		}
		const permissions = PermissionManager.forClient(interaction.client);
		await permissions.set(interaction.guild, permissionName, group);
		await interaction.reply(
			`権限を追加しました!\n権限名: ${permissionName}\nロール/メンバー: ${group}`,
		);
	});

builder
	.subcommand('get', '値の取得')
	.addStringOption({
		name: 'permission',
		description: '権限名',
		required: true,
		async autocomplete(interaction) {
			await interaction.respond([
				{
					name: '自動応答の設定',
					value: 'replyCustomize',
				},
			]);
		},
	})
	.build(async (interaction, permissionName) => {
		const connection = db.connection;
		if (!interaction.inCachedGuild()) {
			await interaction.reply({
				content: 'このコマンドはサーバー内で使用してください！',
				ephemeral: true,
			});
			return;
		}
		const permissions = PermissionManager.forClient(interaction.client);
		const result = await permissions.get(interaction.guild, permissionName);
		if (result != null) {
			await interaction.reply(
				`権限名: ${permissionName}\nロール/メンバー: ${result}`,
			);
		} else {
			await interaction.reply(
				`権限名: ${permissionName}\nその名前の権限はありません!`,
			);
		}
	});

export default builder.build();
