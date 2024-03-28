import { createCanvas } from 'canvas';
import { SimpleSlashCommandBuilder } from '../../../common/SimpleCommand';
import { LANG, strFormat } from '../../../util/languages';
import { DayOfWeek, MonthCalendar } from '../util/calendar';
import {
	BoundingBox,
	CanvasTable,
	CanvasTextBox,
	FONT_FAMILY,
	InlineText,
} from '../util/canvasUtils';

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
)
	.addIntegerOption({
		name: LANG.commands.cal.options.month.name,
		description: LANG.commands.cal.options.month.description,
		choices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((value) => ({
			name: LANG.commands.cal.monthNames[value],
			value,
		})),
		required: false,
	})
	.addIntegerOption({
		name: LANG.commands.cal.options.year.name,
		description: LANG.commands.cal.options.year.description,
		required: false,
	})
	.addIntegerOption({
		name: LANG.commands.cal.options.weekStart.name,
		description: LANG.commands.cal.options.weekStart.description,
		choices: Object.values(DayOfWeek).map((value) => ({
			name: LANG.commands.cal.dayNames[value],
			value,
		})),
		required: false,
	})
	.build(async (interaction, month, year, weekStart = DayOfWeek.Sunday) => {
		const today = new Date();
		const calendar = new MonthCalendar(
			month ?? today.getMonth(),
			year ?? today.getFullYear(),
		);
		const days = [];
		for (let i = 0; i < 7; i++) {
			days.push((weekStart + i) % 7);
		}
		const table = [
			days.map((i) => {
				const text = new InlineText(LANG.commands.cal.dayLabels[i]);
				text.color = dayColor(i as DayOfWeek);
				return text;
			}),
			...Array.from(calendar.weeks(weekStart)).map((week) =>
				week.map((day) => {
					const text = new InlineText(day.date.toString());
					text.color = dayColor(day.day);
					if (!calendar.includes(day)) {
						text.color = 'gray';
					}
					if (day.is(today)) {
						text.font = `bold 24px ${FONT_FAMILY}`;
					}
					return text;
				}),
			),
		];
		const canvas = createCanvas(800, 400);
		const ctx = canvas.getContext('2d');
		new BoundingBox(0, 0, 800, 400).fill(ctx, 'white');
		const title = strFormat(LANG.commands.cal.monthYear, {
			month: LANG.commands.cal.monthNames[calendar.month],
			year: calendar.year,
		});
		const titleStyle = new InlineText(title);
		titleStyle.color = 'black';
		titleStyle.font = `48px ${FONT_FAMILY}`;
		new CanvasTextBox(titleStyle, new BoundingBox(50, 0, 700, 100)).renderTo(
			ctx,
		);
		new CanvasTable(table, new BoundingBox(50, 100, 700, 300)).renderTo(ctx);
		await interaction.reply({
			files: [
				{
					attachment: canvas.toBuffer(),
					name: 'calendar.png',
				},
			],
			embeds: [
				{
					title: strFormat(title),
					image: {
						url: 'attachment://calendar.png',
					},
				},
			],
		});
	});
