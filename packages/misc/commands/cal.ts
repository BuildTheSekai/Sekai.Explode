import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';

export default SimpleSlashCommandBuilder.create(
	'cal',
	'カレンダーを表示します',
).build(async (interaction) => {
	await interaction.reply({
		content: '開発中',
		ephemeral: true,
	});
});
