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

export class CanvasTable {
	private cells: string[][];

	private boundingBox: BoundingBox;

	public color: string;

	constructor(cells: string[][], boundingBox: BoundingBox) {
		this.cells = cells;
		this.boundingBox = boundingBox;
	}

	renderTo(ctx: CanvasRenderingContext2D) {
		ctx.save();
		ctx.font = '48px monospace';
		ctx.fillStyle = this.color;
		ctx.textBaseline = 'top';
		ctx.fillText(
			formatTable(this.cells),
			this.boundingBox.x,
			this.boundingBox.y,
		);
		ctx.restore();
	}
}
