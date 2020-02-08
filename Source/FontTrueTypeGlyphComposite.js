
function FontTrueTypeGlyphComposite(childGlyphDatas, offsetInBytes)
{
	this.childGlyphDatas = childGlyphDatas;
	this.offsetInBytes = offsetInBytes;
}
{
	// drawable

	FontTrueTypeGlyphComposite.prototype.drawToDisplay = function(display, fontHeightInPixels, font, offsetForBaseLines, drawPos)
	{
		var childGlyphDatas = this.childGlyphDatas;
		for (var i = 0; i < childGlyphDatas.length; i++)
		{
			var childGlyphData = childGlyphDatas[i];
			childGlyphData.drawToDisplay(display, fontHeightInPixels, font, offsetForBaseLines, drawPos);
		}
	};

	// file

	FontTrueTypeGlyphComposite.prototype.fromByteStreamAndOffset = function(reader, offsetInBytes)
	{
		// "composite" glyph

		var flagSets = [];
		var flags = null;
		var childGlyphDatas = [];

		while (true)
		{
			// See:
			// https://docs.microsoft.com/en-us/typography/opentype/spec/glyf

			var flagsAsShort = reader.readShort();
			flags = FontTrueTypeGlyphCompositeFlags.fromShort(flagsAsShort);
			flagSets.push(flags);

			var childGlyphIndex = reader.readShort();

			var xOffsetOrPointIndexChild = (flags.areArgs1And2Words? reader.readShort() : reader.readByte());
			var yOffsetOrPointIndexComposite = (flags.areArgs1And2Words? reader.readShort() : reader.readByte());

			var childGlyphOffset;

			if (flags.areArgsXYValues)
			{
				// "signed xy values"
				// todo - Should be signed.
				childGlyphOffset = new Coords
				(
					xOffsetOrPointIndexChild,
					0 - yOffsetOrPointIndexComposite
				);
			}
			else
			{
				// "unsigned point numbers".
				// todo - Mapping of points from child simple glyph to composite glyph.
				childGlyphOffset = new Coords(0, 0); // hack
				console.log("Unsupported child glyph offset argument type.");
			}
			
			var childGlyphData = new FontTrueTypeGlyphCompositeChildGlyphData
			(
				childGlyphIndex,
				childGlyphOffset
			);
			childGlyphDatas.push(childGlyphData);

			var scale;
			// hack
			var scaleDivisor = FontTrueTypeGlyph.DimensionInFUnits * 8; 
			if (flags.isThereASimpleScale)
			{
				var scaleFactor = reader.readShort();
				scale = new Coords(scaleFactor, scaleFactor);
				scale.divideScalar(scaleDivisor);
			}
			else if (flags.areXAndYScalesDifferent)
			{
				scale = new Coords
				(
					reader.readShort(),
					reader.readShort()
				);
				scale.divideScalar(scaleDivisor);
			}
			else if (flags.use2By2Transform)
			{
				// ???
				var scaleX = reader.readShort();
				var scale01 = reader.readShort();
				var scale02 = reader.readShort();
				var scaleY = reader.readShort();

				console.log("Use 2x2 transform not implemented.");
				scale = new Coords(1.0, 1.0);
			}
			else
			{
				scale = new Coords(1.0, 1.0);
			}

			childGlyphOffset.multiply(scale);

			if (flags.areThereMoreComponentGlyphs == false)
			{
				break;
			}
		}

		if (flags.areThereInstructions == true)
		{
			var numberOfInstructions = reader.readShort();
			var instructions = reader.readBytes(numberOfInstructions);
		}

		this.childGlyphDatas = childGlyphDatas;
		this.offsetInBytes = offsetInBytes;

		return this;
	};
}

function FontTrueTypeGlyphCompositeChildGlyphData(glyphIndex, offset)
{
	this.glyphIndex = glyphIndex;
	this.offset = offset;
}
{
	FontTrueTypeGlyphCompositeChildGlyphData.prototype.glyphFromFont = function(font)
	{
		var returnValues = [];

		var childGlyphIndexNominal = this.glyphIndex;
		var childGlyphOffset = 
			font.indexToLocationTable.offsets[childGlyphIndexNominal];
		var childGlyph = font.glyphs["_" + childGlyphOffset];

		return childGlyph;
	};

	// drawable

	FontTrueTypeGlyphCompositeChildGlyphData.prototype.drawToDisplay = function(display, fontHeightInPixels, font, offsetForBaseLines, drawPos)
	{
		var childGlyph = this.glyphFromFont(font);

		if (childGlyph == null)
		{
			console.log("Could not find glyph!");
		}
		else
		{
			// hack - Should calculate this elsewhere.
			var fUnitsPerPixel = FontTrueTypeGlyph.DimensionInFUnits / fontHeightInPixels;
			var drawPosAdjusted = drawPos.clone().add(this.offset.clone().divideScalar(fUnitsPerPixel));

			childGlyph.drawToDisplay(display, fontHeightInPixels, font, offsetForBaseLines, drawPosAdjusted);
		}
	};
}