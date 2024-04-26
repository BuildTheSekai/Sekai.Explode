import { CompoundCommandBuilder } from '../../../common/CompoundCommand';

const builder = new CompoundCommandBuilder('date', '時刻の計算と表示');

builder.subcommand('now', '現在時刻を表示').build(async (i) => {
	await i.reply(new Date().toString());
});

export default builder.build();
