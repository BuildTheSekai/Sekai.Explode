import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { MonthCalendar } from '../util/calendar';

export default SimpleSlashCommandBuilder.create(
	'cal',
	'カレンダーを表示します',
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
	await interaction.reply('```Su Mo Tu We Th Fr Sa\n' + days + '```');
});
