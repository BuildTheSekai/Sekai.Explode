import { CompoundCommandBuilder } from 'core';
import { feature as db } from 'db';

interface PermSchema {
	guild: string;
	name: string;
	group: string;
}

const builder = new CompoundCommandBuilder('perm', '権限の設定');

builder
	.subcommand('set', '値の更新')
	.addStringOption({
		name: 'permission',
		description: '権限名',
		required: true,
	})
	.addMentionableOption({
		name: 'group',
		description: '対象のロールまたはユーザー',
		required: true,
	})
	.build(async (interaction, permissionName, group) => {
		const connection = db.connection;
		const guild = interaction.guild;
		if (guild == null) {
			interaction.reply({
				content: 'このコマンドはサーバー内で使用してください！',
				ephemeral: true,
			});
			return;
		}
		const collection = connection.collection<PermSchema>('perms');
		collection.insertOne({
			guild: guild.id,
			name: permissionName,
			group: group.id,
		});
		await interaction.reply(
			`権限を追加しました!\n権限名: ${permissionName}\nロール/メンバーID: ${group.id}`,
		);
	});

builder
	.subcommand('get', '値の取得')
	.addStringOption({
		name: 'permission',
		description: '権限名',
		required: true,
	})
	.build(async (interaction, permissionName) => {
		const connection = db.connection;
		const guild = interaction.guild;
		if (guild == null) {
			interaction.reply({
				content: 'このコマンドはサーバー内で使用してください！',
				ephemeral: true,
			});
			return;
		}
		const collection = connection.collection<PermSchema>('perms');
		const result = await collection.findOne({
			guild: guild.id,
			name: permissionName,
		});
		if (result != null) {
			await interaction.reply(
				`権限名: ${permissionName}\nロール/メンバーID: ${result.group}`,
			);
		} else {
			await interaction.reply(
				`権限名: ${permissionName}\nその名前の権限はありません!`,
			);
		}
	});

export default builder.build();
