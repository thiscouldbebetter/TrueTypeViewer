
class Display
{
	sizeInPixels: Coords;

	canvas: any;
	graphics: any;

	constructor(sizeInPixels: Coords)
	{
		this.sizeInPixels = sizeInPixels;
	}

	initialize(): void
	{
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.sizeInPixels.x;
		this.canvas.height = this.sizeInPixels.y;
		this.graphics = this.canvas.getContext("2d");
		this.graphics.strokeStyle = "Gray";
	}

	// drawing

	clear(): void
	{
		this.drawRectangle(new Coords(0, 0), this.sizeInPixels, "White");
	}

	drawCurve(fromPos: Coords, curveControlPos: Coords, toPos: Coords, color: string): void
	{
		if (color != null)
		{
			this.graphics.strokeStyle = color;
		}
		this.graphics.beginPath();
		this.graphics.moveTo(fromPos.x, fromPos.y);
		this.graphics.quadraticCurveTo
		(
			curveControlPos.x, curveControlPos.y, toPos.x, toPos.y
		);
		this.graphics.stroke();
	}

	drawLine(fromPos: Coords, toPos: Coords, color: string): void
	{
		if (color != null)
		{
			this.graphics.strokeStyle = color;
		}
		this.graphics.beginPath();
		this.graphics.moveTo(fromPos.x, fromPos.y);
		this.graphics.lineTo(toPos.x, toPos.y);
		this.graphics.stroke();
	}

	drawRectangle(pos: Coords, size: Coords, color: string): void
	{
		if (color != null)
		{
			this.graphics.fillStyle = color;
		}
		this.graphics.fillRect(pos.x, pos.y, size.x, size.y);
	}
}
