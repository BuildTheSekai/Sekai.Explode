import { createCanvas } from 'canvas';
import {
	SimpleSlashCommandBuilder,
	LANG,
	strFormat,
	DayOfWeek,
	MonthCalendar,
} from 'core';
import {
	BoundingBox,
	CanvasTable,
	CanvasTextBox,
	FONT_FAMILY,
	InlineText,
} from '../util/canvasUtils';

const WORKDAY_COLOR = 'black';
const HOLIDAY_COLOR = 'red';
const SUNDAY_COLOR = 'red';
const SATURDAY_COLOR = 'blue';
const EXCLUDED_COLOR = 'gray';
const TODAY_COLOR = 'white';
const TODAY_BACKGROUND = 'black';

function dayColor(day: DayOfWeek) {
	switch (day) {
		case DayOfWeek.Sunday:
			return SUNDAY_COLOR;
		case DayOfWeek.Saturday:
			return SATURDAY_COLOR;
		default:
			return WORKDAY_COLOR;
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
			name: LANG.common.monthNames[value],
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
			name: LANG.common.dayNames[value],
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
		let todayIndex;
		const table = [
			days.map((i) => {
				const text = new InlineText(LANG.common.dayLabels[i]);
				text.color = dayColor(i as DayOfWeek);
				return text;
			}),
			...Array.from(calendar.weeks(weekStart)).map((week, i) =>
				week.map((day, j) => {
					const text = new InlineText(day.date.toString());
					text.color = dayColor(day.day);
					if (day.isHoliday()) {
						text.color = HOLIDAY_COLOR;
					}
					if (!calendar.includes(day)) {
						text.color = EXCLUDED_COLOR;
					}
					if (day.is(today)) {
						todayIndex = [i, j];
						text.color = TODAY_COLOR;
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
			month: LANG.common.monthNames[calendar.month],
			year: calendar.year,
		});
		const titleStyle = new InlineText(title);
		titleStyle.color = 'black';
		titleStyle.font = `48px ${FONT_FAMILY}`;
		new CanvasTextBox(titleStyle, new BoundingBox(50, 0, 700, 100)).renderTo(
			ctx,
		);
		const canvasTable = new CanvasTable(
			table,
			new BoundingBox(50, 100, 700, 300),
		);
		if (todayIndex) {
			const todayCell = canvasTable.cells[todayIndex[0] + 1][todayIndex[1]];
			todayCell.background = TODAY_BACKGROUND;
		}
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
					title: strFormat(title),
					image: {
						url: 'attachment://calendar.png',
					},
				},
			],
		});
	});
