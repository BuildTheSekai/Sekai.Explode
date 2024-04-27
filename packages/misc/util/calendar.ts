import axios from 'axios';

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

const HOLIDAYS_CSV = 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv';

let holidays = new Map<string, string>();

async function getHolidays() {
	const res = await axios.get<ArrayBuffer>(HOLIDAYS_CSV, {
		responseType: 'arraybuffer',
	});
	const text = new TextDecoder('shift_jis').decode(res.data);
	const data = text
		.split('\n')
		.map((row) => row.trim()) // '\r' を削除
		.filter((row) => row != '') // 空行を削除
		.slice(1) // 見出し行を削除
		.map((row) => row.split(',') as [string, string]);
	holidays = new Map(data);
}
getHolidays();

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

	is(date: Date): boolean {
		return (
			this.year == date.getFullYear() &&
			this.month == date.getMonth() &&
			this.date == date.getDate()
		);
	}

	toString() {
		return `${this.year}/${this.month + 1}/${this.date}`;
	}

	isHoliday() {
		return holidays.has(this.toString());
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
		}
		if (monthIndex == null) {
			const date = new Date();
			monthIndex = date.getMonth();
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

	*weeks(weekStart: DayOfWeek = DayOfWeek.Sunday): Iterable<Week> {
		const monthFirst = this.firstDay();
		let firstDateOffset = weekStart - monthFirst.day + 7; // カレンダーの左上の日付が月の1日の何日後か (0以下)
		while (firstDateOffset > 0) {
			firstDateOffset -= 7;
		}
		let weekFirst = monthFirst.add(firstDateOffset);
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
