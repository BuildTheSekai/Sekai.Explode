import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';

export default SimpleSlashCommandBuilder.create('date', '時刻を表示').build(
	async (i) => {
		await i.reply(new Date().toString());
	},
);
