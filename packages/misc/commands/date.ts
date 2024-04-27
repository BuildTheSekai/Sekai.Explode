import { CompoundCommandBuilder } from '../../../common/CompoundCommand';

const builder = new CompoundCommandBuilder('date', '時刻の計算と表示');

builder.subcommand('now', '現在時刻を表示').build(async (i) => {
	await i.reply(new Date().toString());
});

builder
	.subcommand('diff', '時刻の差を計算')
	.addStringOption({
		name: 'date',
		description: '時刻',
		required: true,
	})
	.build(async (interaction, dateString) => {
		const match = /(\d+)[\/.-](\d+)[\/.-](\d+)/.exec(dateString);
		if (match == null) {
			await interaction.reply({
				ephemeral: true,
				content: '日付の形式が無効です',
			});
			return;
		}
		const date = new Date(
			Number.parseInt(match[1]),
			Number.parseInt(match[2]) - 1,
			Number.parseInt(match[3]),
		);
		interaction.reply(`${date.getTime() - Date.now()}秒後`);
	});

export default builder.build();
