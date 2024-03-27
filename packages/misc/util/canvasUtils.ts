import { CanvasRenderingContext2D } from 'canvas';
import { formatTable } from '../../../util/strings';

function requireNonnegative(x: number, name: string): number {
	if (x < 0) {
		throw new RangeError(`${name} must not be less than ${x}`);
	}
	return x;
}

export class BoundingBox {
	readonly x: number;

	readonly y: number;

	readonly width: number;

	readonly height: number;

	constructor(x: number, y: number, width: number, height: number) {
		this.x = requireNonnegative(x, 'x');
		this.y = requireNonnegative(y, 'y');
		this.width = requireNonnegative(width, 'width');
		this.height = requireNonnegative(height, 'height');
	}
}

export class CanvasTextBox {
	public text: string;

	public boundingBox: BoundingBox;

	public color: string;

	constructor(text: string, boundingBox: BoundingBox) {
		this.text = text;
		this.boundingBox = boundingBox;
	}

	renderTo(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.font = '24px serif';
		ctx.fillStyle = this.color;
		ctx.textBaseline = 'top';
		ctx.fillText(this.text, this.boundingBox.x, this.boundingBox.y);
		ctx.restore();
	}
}

export class CanvasTable {
	private cells: CanvasTextBox[][];

	private boundingBox: BoundingBox;

	public color: string;

	constructor(cells: string[][], boundingBox: BoundingBox) {
		const rowCount = cells.length;
		const columnCount = cells[0].length;
		const cellWidth = boundingBox.width / columnCount;
		const cellHeight = boundingBox.height / rowCount;
		this.cells = cells.map((row, i) =>
			row.map(
				(cell, j) =>
					new CanvasTextBox(
						cell,
						new BoundingBox(
							boundingBox.x + cellWidth * j,
							boundingBox.y + cellHeight * i,
							boundingBox.width,
							boundingBox.height,
						),
					),
			),
		);
		this.boundingBox = boundingBox;
	}

	renderTo(ctx: CanvasRenderingContext2D) {
		for (const row of this.cells) {
			for (const cell of row) {
				cell.color = this.color;
				cell.renderTo(ctx);
			}
		}
	}
}
