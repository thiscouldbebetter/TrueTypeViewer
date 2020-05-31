
function GlyphContourSegment(startPoint, curveControlPoint)
{
	this.startPoint = startPoint;
	this.curveControlPoint = curveControlPoint;
}
{
	GlyphContourSegment.prototype.clone = function()
	{
		return new GlyphContourSegment
		(
			this.startPoint.clone(),
			this.curveControlPoint == null ? null : this.curveControlPoint.clone()
		);
	};
}
