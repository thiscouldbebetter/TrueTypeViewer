
function FontTrueTypeGlyphCompositeFlags
(
	areArgs1And2Words,
	areArgsXYValues,
	roundXYToGrid,
	isThereASimpleScale,
	reserved,
	areThereMoreComponentGlyphs,
	areXAndYScalesDifferent,
	use2By2Transform,
	areThereInstructions,
	useMyMetrics,
	doComponentGlyphsOverlap,
	isComponentOffsetScaled,
	isComponentOffsetUnscaled
)
{
	this.areArgs1And2Words = areArgs1And2Words;
	this.areArgsXYValues = areArgsXYValues;
	this.roundXYToGrid = roundXYToGrid;
	this.isThereASimpleScale = isThereASimpleScale;
	this.reserved = reserved;
	this.areThereMoreComponentGlyphs = areThereMoreComponentGlyphs;
	this.areXAndYScalesDifferent = areXAndYScalesDifferent;
	this.use2By2Transform = use2By2Transform;
	this.areThereInstructions = areThereInstructions,
	this.useMyMetrics = useMyMetrics;
	this.doComponentGlyphsOverlap = doComponentGlyphsOverlap;
	this.isComponentOffsetScaled = isComponentOffsetScaled;
	this.isComponentOffsetUnscaled = isComponentOffsetUnscaled;
}

{
	FontTrueTypeGlyphCompositeFlags.fromShort = function(flagsAsShort)
	{
		var returnValue = new FontTrueTypeGlyphCompositeFlags
		(
			((flagsAsShort & 1) > 0),
			((flagsAsShort >> 1 & 1) > 0),
			((flagsAsShort >> 2 & 1) > 0),
			((flagsAsShort >> 3 & 1) > 0),
			((flagsAsShort >> 4 & 1) > 0),
			((flagsAsShort >> 5 & 1) > 0),
			((flagsAsShort >> 6 & 1) > 0),
			((flagsAsShort >> 7 & 1) > 0),
			((flagsAsShort >> 8 & 1) > 0),
			((flagsAsShort >> 9 & 1) > 0),
			((flagsAsShort >> 10 & 1) > 0),
			((flagsAsShort >> 11 & 1) > 0),
			((flagsAsShort >> 12 & 1) > 0),
		);

		return returnValue;
	};
}
