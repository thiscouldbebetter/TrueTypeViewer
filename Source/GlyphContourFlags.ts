
class GlyphContourFlags
{
	isOnContour: boolean;
	xIsShortVector: boolean;
	yIsShortVector: boolean;
	repeats: boolean;
	xIsSameOrSignIfShort: boolean;
	yIsSameOrSignIfShort: boolean;
	contoursMayOverlap: boolean;

	timesToRepeat: number;

	constructor
	(
		isOnContour: boolean,
		xIsShortVector: boolean,
		yIsShortVector: boolean,
		repeats: boolean,
		xIsSameOrSignIfShort: boolean,
		yIsSameOrSignIfShort: boolean,
		contoursMayOverlap: boolean
	)
	{
		this.isOnContour = isOnContour;
		this.xIsShortVector = xIsShortVector;
		this.yIsShortVector = yIsShortVector;
		this.repeats = repeats;
		this.xIsSameOrSignIfShort = xIsSameOrSignIfShort;
		this.yIsSameOrSignIfShort = yIsSameOrSignIfShort;
		this.contoursMayOverlap = contoursMayOverlap;

		// flag bits
		// 0 - point is on contour (rather than a control point for a curve)
		// 1 - xIsShortVector - coord is 1 instead of 2 bytes (confusing because "short" usually means 16 bits)
		// 2 - yIsShortVector - coord is 1 instead of 2 bytes
		// 3 - repeat - if set, next byte is number of times to repeat
		// 4 - if xIsShortVector is 1, indicates sign of value (1 = positive, 0 = negative)
		// 4 - if xIsShortVector is 0, and this flag is 1, x coord is same as previous
		// 4 - if xIsShortVector is 0, and this flag is 0, x coord is a delta vector
		// 5 - same as 4, but for y instead of x
		// 6 - contoursMayOverlap
		// 7 - reserved
	}

	static fromByte(flagsAsByte: number): GlyphContourFlags
	{
		var returnValue = new GlyphContourFlags
		(
			((flagsAsByte & 1) > 0), // isOnContour
			((flagsAsByte >> 1 & 1) > 0), // xIsShortVector
			((flagsAsByte >> 2 & 1) > 0), // yIsShortVector
			((flagsAsByte >> 3 & 1) > 0), // repeat
			((flagsAsByte >> 4 & 1) > 0), // isXSameOrSignIfShort
			((flagsAsByte >> 5 & 1) > 0), // isYSameOrSignIfShort
			((flagsAsByte >> 6 & 1) > 0) // contoursMayOverlap
		);

		return returnValue;
	}
 
	toByte(): number 
	{ 
		var flagsAsByte = 
			(this.isOnContour ? 1 : 0) 
			| ( (this.isOnContour ? 1 : 0) << 1)
			| ( (this.isOnContour ? 1 : 0) << 2)
			| ( (this.isOnContour ? 1 : 0) << 3)
			| ( (this.isOnContour ? 1 : 0) << 4)
			| ( (this.isOnContour ? 1 : 0) << 5)
			| ( (this.contoursMayOverlap ? 1 : 0) << 6);

		return flagsAsByte;
	}
}
