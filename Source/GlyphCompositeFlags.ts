
class GlyphCompositeFlags
{
	areArgs1And2Words: boolean;
	areArgsXYValues: boolean;
	roundXYToGrid: boolean;
	isThereASimpleScale: boolean;
	reserved: boolean;
	areThereMoreComponentGlyphs: boolean;
	areXAndYScalesDifferent: boolean;
	use2By2Transform: boolean;
	areThereInstructions: boolean;
	useMyMetrics: boolean;
	doComponentGlyphsOverlap: boolean;
	isComponentOffsetScaled: boolean;
	isComponentOffsetUnscaled: boolean;

	constructor
	(
		areArgs1And2Words: boolean,
		areArgsXYValues: boolean,
		roundXYToGrid: boolean,
		isThereASimpleScale: boolean,
		reserved: boolean,
		areThereMoreComponentGlyphs: boolean,
		areXAndYScalesDifferent: boolean,
		use2By2Transform: boolean,
		areThereInstructions: boolean,
		useMyMetrics: boolean,
		doComponentGlyphsOverlap: boolean,
		isComponentOffsetScaled: boolean,
		isComponentOffsetUnscaled: boolean
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

	static fromShort(flagsAsShort: number): GlyphCompositeFlags
	{
		var returnValue = new GlyphCompositeFlags
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
