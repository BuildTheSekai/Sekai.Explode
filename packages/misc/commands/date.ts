import { CompoundCommandBuilder } from '../../../common/CompoundCommand';
import { LANG, strFormat } from '../../../util/languages';
import { Day } from '../util/calendar';

const builder = new CompoundCommandBuilder(
	LANG.commands.date.name,
	LANG.commands.date.description,
);

builder
	.subcommand(
		LANG.commands.date.subcommands.now.name,
		LANG.commands.date.subcommands.now.description,
	)
	.build(async (interaction) => {
		const date = new Date();
		const day = new Day(date.getFullYear(), date.getMonth(), date.getDate());
		const time = strFormat(LANG.common.timeFormat, {
			hour: date.getHours().toString().padStart(2, '0'),
			minute: date.getMinutes().toString().padStart(2, '0'),
			second: date.getSeconds().toString().padStart(2, '0'),
		});
		await interaction.reply(
			strFormat(LANG.common.dateTimeFormat, {
				date: day.toHumanReadable(),
				time: time,
			}),
		);
	});

builder
	.subcommand(
		LANG.commands.date.subcommands.diff.name,
		LANG.commands.date.subcommands.diff.description,
	)
	.addStringOption({
		name: LANG.commands.date.subcommands.diff.options.date.name,
		description: LANG.commands.date.subcommands.diff.options.date.description,
		required: true,
	})
	.build(async (interaction, dateString) => {
		const match = /(\d+)[\/.-](\d+)[\/.-](\d+)/.exec(dateString);
		if (match == null) {
			await interaction.reply({
				ephemeral: true,
				content: LANG.commands.date.subcommands.diff.invalidDate,
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
