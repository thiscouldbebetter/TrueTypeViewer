
class GlyphContourPoint
{
	position: Coords;
	isOnContour: boolean;

	constructor(position: Coords, isOnContour: boolean)
	{
		this.position = position;
		this.isOnContour = isOnContour;
	}
}
