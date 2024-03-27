import { createCanvas } from 'canvas';
import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { LANG } from '../../../util/languages';
import { DayOfWeek, MonthCalendar } from '../util/calendar';
import { BoundingBox, CanvasTable, InlineText } from '../util/canvasUtils';

function dayColor(day: DayOfWeek) {
	switch (day) {
		case DayOfWeek.Sunday:
			return 'red';
		case DayOfWeek.Saturday:
			return 'blue';
		default:
			return 'black';
	}
}

export default SimpleSlashCommandBuilder.create(
	LANG.commands.cal.name,
	LANG.commands.cal.description,
).build(async (interaction) => {
	const calendar = new MonthCalendar();
	const table = [
		LANG.commands.cal.dayLabels.map((e, i) => {
			const text = new InlineText(e);
			text.color = dayColor(i as DayOfWeek);
			return text;
		}),
		...Array.from(calendar.weeks()).map((week) =>
			week.map((day) => {
				const text = new InlineText(day.date.toString().padStart(2));
				text.color = dayColor(day.day);
				return text;
			}),
		),
	];
	const canvas = createCanvas(800, 400);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, 800, 400);
	const canvasTable = new CanvasTable(table, new BoundingBox(50, 50, 750, 350));
	canvasTable.color = 'black';
	canvasTable.renderTo(ctx);
	await interaction.reply({
		files: [
			{
				attachment: canvas.toBuffer(),
				name: 'calendar.png',
			},
		],
		embeds: [
			{
				title: 'カレンダー',
				image: {
					url: 'attachment://calendar.png',
				},
			},
		],
	});
});
