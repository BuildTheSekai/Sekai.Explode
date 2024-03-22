import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { LANG } from '../../../util/languages';
import { MonthCalendar } from '../util/calendar';

export default SimpleSlashCommandBuilder.create(
	LANG.commands.cal.name,
	LANG.commands.cal.description,
).build(async (interaction) => {
	const calendar = new MonthCalendar();
	const days = Array.from(calendar.weeks())
		.map((week) =>
			week
				.map((day) =>
					calendar.includes(day) ? String(day.date).padStart(2) : '  ',
				)
				.join(' '),
		)
		.join('\n');
	await interaction.reply(
		'```' + LANG.commands.cal.dayLabels.join(' ') + '\n' + days + '```',
	);
});
