export const DayOfWeek = Object.freeze({
	Sunday: 0,
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6,
});

export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export class Day {
	public readonly year: number;

	public readonly month: number;

	public readonly date: number;

	public readonly day: DayOfWeek;

	constructor(year: number, monthIndex: number, date: number) {
		const dateObj = new Date(year, monthIndex, date);
		this.year = dateObj.getFullYear();
		this.month = dateObj.getMonth();
		this.date = dateObj.getDate();
		this.day = dateObj.getDay() as DayOfWeek;
	}
}

export class MonthCalendar {
	public readonly month: number;

	public readonly year: number;

	public readonly size: number;

	/**
	 * 月のカレンダーを作成する。
	 * @param monthIndex 0始まりの月の番号 (0～11)
	 * @param year 西暦
	 */
	constructor(monthIndex?: number, year?: number) {
		if (year == null) {
			const date = new Date();
			year = date.getFullYear();
			if (monthIndex == null) {
				monthIndex = date.getMonth();
			}
		}
		this.month = monthIndex;
		this.year = year;
		this.size = new Date(year, monthIndex + 1, 0).getDate();
	}

	*days(): Iterable<Day> {
		const size = this.size;
		for (let date = 1; date <= size; date++) {
			yield new Day(this.year, this.month, date);
		}
	}
}
