import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { DayOfWeek, MonthCalendar } from '../util/calendar';

export default SimpleSlashCommandBuilder.create(
	'cal',
	'カレンダーを表示します',
).build(async (interaction) => {
	const calendar = new MonthCalendar();
	const dates = [];
	for (const day of calendar.days()) {
		dates.push(`${dayToString(day.day)} ${String(day.date).padStart(2)}`);
	}
	await interaction.reply('```' + dates.join('\n') + '```');
});

function dayToString(day: DayOfWeek) {
	switch (day) {
		case DayOfWeek.Sunday:
			return 'Su';
		case DayOfWeek.Monday:
			return 'Mo';
		case DayOfWeek.Tuesday:
			return 'Tu';
		case DayOfWeek.Wednesday:
			return 'We';
		case DayOfWeek.Thursday:
			return 'Th';
		case DayOfWeek.Friday:
			return 'Fr';
		case DayOfWeek.Saturday:
			return 'Sa';
	}
}
