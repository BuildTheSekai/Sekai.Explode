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

	add(days: number) {
		return new Day(this.year, this.month, this.date + days);
	}
}

export type Week = { [K in DayOfWeek]: Day } & Array<Day>;

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

	firstDay() {
		return new Day(this.year, this.month, 1);
	}

	includes(day: Day) {
		if (day.year == this.year && day.month == this.month) {
			return true;
		}
	}

	*weeks(): Iterable<Week> {
		const monthFirst = this.firstDay();
		let weekFirst = monthFirst.add(-monthFirst.day);
		do {
			const week = [weekFirst];
			let day = weekFirst;
			for (let i = 1; i < 7; i++) {
				day = day.add(1);
				week[i] = day;
			}
			yield week as Week;
			weekFirst = weekFirst.add(7);
		} while (this.includes(weekFirst));
	}
}
