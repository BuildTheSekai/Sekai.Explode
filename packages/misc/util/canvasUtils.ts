import { CanvasRenderingContext2D, registerFont } from 'canvas';
import { Config } from 'core';

const FONT_FILE = Config.fontFile ?? 'font.ttf';
export const FONT_FAMILY = Config.fontFamily ?? 'serif';

function requireNonnegative(x: number, name: string): number {
	if (x < 0) {
		throw new RangeError(`${name} must not be less than ${x}`);
	}
	return x;
}

export function registerConfiguredFont() {
	try {
		registerFont(FONT_FILE, { family: FONT_FAMILY });
	} catch (e) {
		console.error(e);
	}
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

	stroke(ctx: CanvasRenderingContext2D, color: string) {
		ctx.save();
		ctx.strokeStyle = color;
		ctx.strokeRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	}

	fill(ctx: CanvasRenderingContext2D, color: string) {
		ctx.save();
		ctx.fillStyle = color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
		ctx.restore();
	}
}

export class InlineText {
	public text: string;

	public color: string = 'black';

	public font: string = `24px ${FONT_FAMILY}`;

	constructor(text: string) {
		this.text = text;
	}

	renderTo(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		maxWidth?: number,
	) {
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.font = this.font;
		ctx.fillText(this.text, x, y, maxWidth);
		ctx.restore();
	}
}

export class CanvasTextBox {
	public text: InlineText;

	public boundingBox: BoundingBox;

	public align: 'center' = 'center';

	public verticalAlign: 'middle' = 'middle';

	public background?: string;

	constructor(text: InlineText, boundingBox: BoundingBox) {
		this.text = text;
		this.boundingBox = boundingBox;
	}

	renderTo(ctx: CanvasRenderingContext2D) {
		if (this.background != null) {
			this.boundingBox.fill(ctx, this.background);
		}
		ctx.save();
		ctx.textBaseline = 'top';
		ctx.textAlign = this.align;
		ctx.textBaseline = this.verticalAlign;
		this.text.renderTo(ctx, this.getX(), this.getY());
		ctx.restore();
	}

	private getX() {
		const boundingBox = this.boundingBox;
		switch (this.align) {
			case 'center':
				return boundingBox.x + boundingBox.width / 2;
		}
	}

	private getY() {
		const boundingBox = this.boundingBox;
		switch (this.verticalAlign) {
			case 'middle':
				return boundingBox.y + boundingBox.height / 2;
		}
	}
}

export class CanvasTable {
	public cells: CanvasTextBox[][];

	public color?: string;

	constructor(cells: InlineText[][], boundingBox: BoundingBox) {
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
							cellWidth,
							cellHeight,
						),
					),
			),
		);
	}

	renderTo(ctx: CanvasRenderingContext2D) {
		for (const row of this.cells) {
			for (const cell of row) {
				cell.renderTo(ctx);
			}
		}
	}
}
