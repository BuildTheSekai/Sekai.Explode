export const Day = Object.freeze({
	Sunday: 0,
	Monday: 1,
	Tuesday: 2,
	Wednesday: 3,
	Thursday: 4,
	Friday: 5,
	Saturday: 6,
});

export type Day = (typeof Day)[keyof typeof Day];

export class MonthCalendar {
	public readonly month: number;

	public readonly year: number;

	public readonly size: number;

	/** 0日 (1日の前日) の曜日 */
	private readonly baseDay: Day;

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
		this.baseDay = new Date(year, monthIndex, 0).getDay() as Day;
	}

	dayOf(date: number): Day {
		return ((this.baseDay + date) % 7) as Day;
	}
}
