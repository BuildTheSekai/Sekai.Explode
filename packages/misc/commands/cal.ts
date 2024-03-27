import { createCanvas } from 'canvas';
import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { LANG } from '../../../util/languages';
import { MonthCalendar } from '../util/calendar';
import { BoundingBox, CanvasTable } from '../util/canvasUtils';

export default SimpleSlashCommandBuilder.create(
	LANG.commands.cal.name,
	LANG.commands.cal.description,
).build(async (interaction) => {
	const calendar = new MonthCalendar();
	const days = Array.from(calendar.weeks()).map((week) =>
		week.map((day) => day.date.toString().padStart(2)),
	);
	const table = [LANG.commands.cal.dayLabels, ...days];
	const canvas = createCanvas(800, 400);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, 800, 400);
	const canvasTable = new CanvasTable(table, new BoundingBox(0, 0, 800, 400));
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
