
function FontTrueTypeGlyphContourFlags
(
	onCurve,
	xShortVector,
	yShortVector,
	timesToRepeat,
	xIsSame,
	yIsSame
)
{
	this.onCurve = onCurve;
	this.xShortVector = xShortVector;
	this.yShortVector = yShortVector;
	this.timesToRepeat = timesToRepeat;
	this.xIsSame = xIsSame;
	this.yIsSame = yIsSame;

	// flag bits
	// 0 - on curve
	// 1 - xShortVector - coord is 1 instead of 2 bytes
	// 2 - yShortVector - coord is 1 instead of 2 bytes
	// 3 - repeat - if set, next byte is number of times to repeat
	// 4 - if xShortVector is 1, indicates sign of value (1 = positive, 0 = negative)
	// 4 - if xShortVector is 0, and this flag is 1, x coord is same as previous
	// 4 - if xShortVector is 0, and this flag is 0, x coord is a delta vector
	// 5 - same as 4, but for y instead of x
	// 6 - reserved
	// 7 - reserved
}

{
	FontTrueTypeGlyphContourFlags.fromByte = function(flagsAsByte)
	{
		var returnValue = new FontTrueTypeGlyphContourFlags
		(
			((flagsAsByte & 1) > 0),
			((flagsAsByte >> 1 & 1) > 0),
			((flagsAsByte >> 2 & 1) > 0),
			((flagsAsByte >> 3 & 1) > 0),
			((flagsAsByte >> 4 & 1) > 0),
			((flagsAsByte >> 5 & 1) > 0)
		);

		return returnValue;
	};
}
