import axios from 'axios';
import { LANG, strFormat } from '../../../util/languages';

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

export class CalendarDate {
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
		return new CalendarDate(this.year, this.month, this.date + days);
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

	toHumanReadable() {
		const holiday = this.holiday();
		return strFormat(LANG.common.dateFormat, {
			year: this.year,
			month: LANG.common.monthNames[this.month],
			date: this.date,
			day: LANG.common.dayNames[this.day],
			holiday:
				holiday != null
					? strFormat(LANG.common.holiday.yes, [holiday])
					: LANG.common.holiday.no,
		});
	}

	isHoliday() {
		return holidays.has(this.toString());
	}

	holiday(): string | null {
		return holidays.get(this.toString()) ?? null;
	}

	compare(other: CalendarDate): -1 | 0 | 1 {
		if (this.year < other.year) {
			return -1;
		} else if (this.year > other.year) {
			return 1;
		}
		// assert this.year == other.year

		if (this.month < other.month) {
			return -1;
		} else if (this.month > other.month) {
			return 1;
		}
		// assert this.month == other.month

		if (this.date < other.date) {
			return -1;
		} else if (this.date > other.date) {
			return 1;
		}
		// assert this.date == other.date

		return 0;
	}

	asDate(): Date {
		return new Date(this.year, this.month, this.date);
	}

	/**
	 * 一年の初めからの日数を計算する。
	 */
	getDayOfYear(): number {
		const start = new Date(this.year, 0, 0); // 前年の大晦日
		return dayDiff(this.asDate(), start);
	}

	/**
	 * 一年が終わるまでの日数を計算する。
	 */
	getRestDayOfYear(): number {
		const end = new Date(this.year + 1, 0, 0); // 大晦日
		return dayDiff(end, this.asDate());
	}

	diff(other: CalendarDate): { years: number; days: number } {
		let date1: CalendarDate = this;
		let date2: CalendarDate = other;
		if (date1.compare(date2) < 0) {
			const temp = date1;
			date1 = date2;
			date2 = temp;
		}
		const years = date1.year - date2.year;
		const dayOfYear = date1.getDayOfYear();
		const days = dayOfYear - date2.getDayOfYear();
		if (days >= 0) {
			return { years, days };
		} else {
			return {
				years: years - 1,
				days: dayOfYear + date2.getRestDayOfYear(),
			};
		}
	}

	static today(): CalendarDate {
		const date = new Date();
		return new CalendarDate(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);
	}
}

function dayDiff(date1: Date, date2: Date): number {
	return Math.floor(
		(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24),
	);
}

export type Week = { [K in DayOfWeek]: CalendarDate } & Array<CalendarDate>;

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
		return new CalendarDate(this.year, this.month, 1);
	}

	includes(day: CalendarDate) {
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
