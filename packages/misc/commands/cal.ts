import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { Day, MonthCalendar } from '../util/calendar';

export default SimpleSlashCommandBuilder.create(
	'cal',
	'カレンダーを表示します',
).build(async (interaction) => {
	const calendar = new MonthCalendar();
	const dates = [];
	const size = calendar.size;
	for (let i = 1; i <= size; i++) {
		dates.push(`${dayToString(calendar.dayOf(i))} ${String(i).padStart(2)}`);
	}
	await interaction.reply('```' + dates.join('\n') + '```');
});

function dayToString(day: Day) {
	switch (day) {
		case Day.Sunday:
			return 'Su';
		case Day.Monday:
			return 'Mo';
		case Day.Tuesday:
			return 'Tu';
		case Day.Wednesday:
			return 'We';
		case Day.Thursday:
			return 'Th';
		case Day.Friday:
			return 'Fr';
		case Day.Saturday:
			return 'Sa';
	}
}
