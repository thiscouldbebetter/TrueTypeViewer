
class GlyphContourSegment
{
	startPoint: Coords;
	curveControlPoint: Coords;

	constructor(startPoint: Coords, curveControlPoint: Coords)
	{
		this.startPoint = startPoint;
		this.curveControlPoint = curveControlPoint;
	}

	clone(): GlyphContourSegment
	{
		return new GlyphContourSegment
		(
			this.startPoint.clone(),
			this.curveControlPoint == null ? null : this.curveControlPoint.clone()
		);
	};
}
