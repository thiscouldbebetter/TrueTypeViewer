
function Display(sizeInPixels)
{
	this.sizeInPixels = sizeInPixels;
}

{
	Display.prototype.initialize = function()
	{
		var canvas = document.createElement("canvas");
		canvas.width = this.sizeInPixels.x;
		canvas.height = this.sizeInPixels.y;
		this.graphics = canvas.getContext("2d");
		this.graphics.strokeStyle = "Gray";
		var divOutput = document.getElementById("divOutput");
		divOutput.innerHTML = "";
		divOutput.appendChild(canvas);
	};

	// drawing

	Display.prototype.drawCurve = function(fromPos, curveControlPos, toPos, color)
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
	};

	Display.prototype.drawLine = function(fromPos, toPos, color)
	{
		if (color != null)
		{
			this.graphics.strokeStyle = color;
		}
		this.graphics.beginPath();
		this.graphics.moveTo(fromPos.x, fromPos.y);
		this.graphics.lineTo(toPos.x, toPos.y);
		this.graphics.stroke();
	};

	Display.prototype.drawRectangle = function(pos, size, color)
	{
		if (color != null)
		{
			this.graphics.strokeStyle = color;
		}
		this.graphics.strokeRect(pos.x, pos.y, size.x, size.y);
	};
}
