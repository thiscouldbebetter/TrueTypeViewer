
function FontTrueType(name)
{
	this.name = name;
}

{
	// drawable

	FontTrueType.prototype.drawToDisplay = function(display, fontHeightInPixels)
	{
		var glyphsPerRow = Math.floor(display.sizeInPixels.x / fontHeightInPixels);
		var numberOfGlyphs = this.glyphs.length;
		var glyphRows = Math.ceil(numberOfGlyphs / glyphsPerRow);

		var drawPos = new Coords(0, 0);

		for (var g = 0; g < this.glyphs.length; g++)
		{
			var glyph = this.glyphs[g];

			drawPos.x = g % glyphsPerRow;
			drawPos.y = Math.floor(g / glyphsPerRow);
			drawPos.multiplyScalar(fontHeightInPixels);

			glyph.drawToDisplay(display, fontHeightInPixels, drawPos);
		}
	};

	// file

	FontTrueType.prototype.fromBytes = function(bytesFromFile)
	{
		var reader = new ByteStreamBigEndian(bytesFromFile);
		this.fromBytes_ReadTables(reader);
		return this;
	};

	FontTrueType.prototype.fromBytes_ReadTables = function(reader)
	{
		// offset table

		var sfntVersionAsBytes = reader.readInt();
		var numberOfTables = reader.readShort();
		var searchRange = reader.readShort(); // (max power of 2 <= numTables) * 16
		var entrySelector = reader.readShort(); // log2(max power of 2 <= numTables)
		var rangeShift = reader.readShort(); // numberOfTables * 16 - searchRange

		// table record entries

		var tableDefns = [];

		for (var t = 0; t < numberOfTables; t++)
		{
			var tableTypeTag = reader.readString(4);
			var checkSum = reader.readInt();
			var offsetInBytes = reader.readInt();
			var length = reader.readInt();

			var tableDefn = new FontTrueTypeTableDefn
			(
				tableTypeTag,
				checkSum,
				offsetInBytes,
				length
			);

			tableDefns.push(tableDefn);
			tableDefns[tableTypeTag] = tableDefn;
		}

		// Tables appear in alphabetical order in the file,
		// but because some depend on others,
		// they cannot be processed in that order.

		var tableNamesOrderedLogically =
		[
			"head",
			"cmap",
			"maxp",
			"loca",
			"glyf"
		];

		for (var t = 0; t < tableNamesOrderedLogically.length; t++)
		{
			var tableName = tableNamesOrderedLogically[t];
			var tableDefn = tableDefns[tableName];
			reader.byteIndexCurrent = tableDefn.offsetInBytes;

			var tableTypeTag = tableDefn.tableTypeTag;
			if (tableTypeTag == "cmap")
			{
				this.encodingTables = this.fromBytes_ReadTables_Cmap
				(
					reader, tableDefn.length
				);
			}
			else if (tableTypeTag == "glyf")
			{
				this.glyphs = this.fromBytes_ReadTables_Glyf
				(
					reader, tableDefn.length
				);
			}
			else if (tableTypeTag == "head")
			{
				this.headerTable = this.fromBytes_ReadTables_Head
				(
					reader, tableDefn.length
				);
			}
			else if (tableTypeTag == "loca")
			{
				this.indexToLocationTable = this.fromBytes_ReadTables_Loca
				(
					reader, tableDefn.length
				);
			}
			else if (tableTypeTag == "maxp")
			{
				this.maximumProfile = this.fromBytes_ReadTables_Maxp
				(
					reader, tableDefn.length
				);
			}
			else
			{
				console.log("Skipping table: " + tableTypeTag);
			}
		}
	};

	FontTrueType.prototype.fromBytes_ReadTables_Cmap = function(reader, length)
	{
		var readerByteOffsetOriginal = reader.byteIndexCurrent;

		var version = reader.readShort();

		var numberOfEncodingTables = reader.readShort();
		var encodingTables = [];

		for (var e = 0; e < numberOfEncodingTables; e++)
		{
			var platformID = reader.readShort(); // 3 = Microsoft
			var encodingID = reader.readShort(); // 1 = Unicode
			var offsetInBytes = reader.readInt(); // 32 bits, TrueType "long"

			var encodingTable = new FontTrueTypeCmapEncodingTable
			(
				platformID,
				encodingID,
				offsetInBytes
			);

			encodingTables.push(encodingTable);
		}

		for (var e = 0; e < numberOfEncodingTables; e++)
		{
			var encodingTable = encodingTables[e];

			reader.byteIndexCurrent =
				readerByteOffsetOriginal
				+ encodingTable.offsetInBytes;

			var formatCode = reader.readShort();
			if (formatCode == 0)
			{
				// "Apple standard"
				var lengthInBytes = reader.readShort();
				var version = reader.readShort();
				var numberOfMappings = 256;
				encodingTable.charCodeToGlyphIndexLookup = reader.readBytes
				(
					numberOfMappings
				);
			}
			else if (formatCode == 2)
			{
				// "high-byte mapping through table"
				// "useful for... Japanese, Chinese, and Korean"
				// "mixed 8/16-bit encoding"
				throw "Unsupported cmap format code."
			}
			else if (formatCode == 4)
			{
				// "Microsoft standard"
				// Not yet fully implemented.

				console.log("Unsupported cmap format code.")
				continue;

				var tableLengthInBytes = reader.readShort();
				var version = reader.readShort();
				var segmentCountTimes2 = reader.readShort();
				var segmentCount = segmentCount / 2;
				var searchRange = reader.readShort(); // "2 x (2**floor(log2(segCount)))"
				var entrySelector = reader.readShort(); // "log2(searchRange/2)"
				var rangeShift = reader.readShort(); // 2 x segCount - searchRange
				for (var s = 0; s < segmentCount; s++)
				{
					var segmentEndCharCode = reader.readShort();
				}
				var reservedPad = reader.readShort();
				for (var s = 0; s < segmentCount; s++)
				{
					var segmentStartCharCode = reader.readShort();
				}
				for (var s = 0; s < segmentCount; s++)
				{
					var idDeltaForCharCodesInSegment = reader.readShort();
				}
				for (var s = 0; s < segmentCount; s++)
				{
					var idRangeOffsetForSegment = reader.readShort();
				}

				while (true)
				{
					var glyphID = reader.readShort();
					break; // todo
				}
			}
			else if (formatCode == 6)
			{
				// "Trimmed table mapping"
				throw "Unsupported cmap format code."
			}
			else
			{
				throw "Unrecognized cmap format code: " + formatCode
			}
		}

		reader.byteIndexCurrent = readerByteOffsetOriginal;

		return encodingTables;
	};

	FontTrueType.prototype.fromBytes_ReadTables_Glyf = function(reader, length)
	{
		var glyphs = [];

		var byteIndexOfTable = reader.byteIndexCurrent;
		var bytesForContoursMinMax = 10;
		var glyphOffsetBase = byteIndexOfTable + bytesForContoursMinMax;
		var byteIndexOfTableEnd = byteIndexOfTable + length;

		while (reader.byteIndexCurrent < byteIndexOfTableEnd)
		{
			// header
			var numberOfContours = reader.readShortSigned();
			var min = new Coords
			(
				reader.readShortSigned(),
				reader.readShortSigned()
			);
			var max = new Coords
			(
				reader.readShortSigned(),
				reader.readShortSigned()
			);
			var minAndMax = [min, max];

			var glyph;
			if (numberOfContours >= 0)
			{
				glyph = this.fromBytes_ReadTables_Glyf_Simple
				(
					reader,
					numberOfContours,
					minAndMax,
					glyphOffsetBase
				);
			}
			else
			{
				glyph = this.fromBytes_ReadTables_Glyf_Composite
				(
					reader,
					glyphOffsetBase
				);
			}

			reader.align16Bit();

			glyphs.push(glyph);
		}

		// hack
		// This is terrible, but then again,
		// so is indexing glyphs by their byte offsets.
		for (var i = 0; i < glyphs.length; i++)
		{
			var glyph = glyphs[i];
			var glyphOffset = glyph.offsetInBytes;
			var glyphOffsetAsKey = "_" + glyphOffset;
			glyphs[glyphOffsetAsKey] = glyph;
		}

		return glyphs;
	};

	FontTrueType.prototype.fromBytes_ReadTables_Glyf_Simple = function(reader, numberOfContours, minAndMax, byteIndexOfTable)
	{
		var offsetInBytes = reader.byteIndexCurrent - byteIndexOfTable;

		var endPointsOfContours = [];
		for (var c = 0; c < numberOfContours; c++)
		{
			var endPointOfContour = reader.readShort();
			endPointsOfContours.push(endPointOfContour);
		}

		var totalLengthOfInstructionsInBytes = reader.readShort();
		var instructionsAsBytes = reader.readBytes
		(
			totalLengthOfInstructionsInBytes
		);

		var numberOfPoints =
			endPointsOfContours[endPointsOfContours.length - 1]
			+ 1;

		var flagSets = [];
		var numberOfPointsSoFar = 0;
		while (numberOfPointsSoFar < numberOfPoints)
		{
			var flagsAsByte = reader.readByte();

			var flags = FontTrueTypeGlyphContourFlags.fromByte(flagsAsByte);

			flags.timesToRepeat  = (flags.timesToRepeat == true ? reader.readByte() : 0);

			numberOfPointsSoFar += (1 + flags.timesToRepeat);

			flagSets.push(flags);
		}

		var coordinates = [];

		var xPrev = 0;
		for (var f = 0; f < flagSets.length; f++)
		{
			var flags = flagSets[f];
			for (var r = 0; r <= flags.timesToRepeat; r++)
			{
				var x;
				if (flags.xShortVector == true)
				{
					x = reader.readByte();
					var sign = (flags.xIsSame ? 1 : -1);
					x *= sign;
					x += xPrev;
				}
				else
				{
					if (flags.xIsSame == true)
					{
						x = xPrev;
					}
					else
					{
						x = reader.readShortSigned();
						x += xPrev;
					}
				}

				var coordinate = new Coords(x, 0);
				coordinates.push(coordinate);
				xPrev = x;
			}
		}

		var yPrev = 0;
		var coordinateIndex = 0;
		for (var f = 0; f < flagSets.length; f++)
		{
			var flags = flagSets[f];
			for (var r = 0; r <= flags.timesToRepeat; r++)
			{
				var coordinate = coordinates[coordinateIndex];

				var y;
				if (flags.yShortVector == true)
				{
					y = reader.readByte();
					var sign = (flags.yIsSame ? 1 : -1);
					y *= sign;
					y += yPrev;
				}
				else
				{
					if (flags.yIsSame == true)
					{
						y = yPrev;
					}
					else
					{
						y = reader.readShortSigned();
						y += yPrev;
					}
				}

				coordinate.y = y;
				yPrev = y;

				coordinateIndex++;
			}
		}

		reader.align16Bit();

		var glyph = new FontTrueTypeGlyph
		(
			minAndMax,
			endPointsOfContours,
			instructionsAsBytes,
			flagSets,
			coordinates,
			offsetInBytes
		);

		return glyph;
	};

	FontTrueType.prototype.fromBytes_ReadTables_Glyf_Composite = function(reader, byteIndexOfTable)
	{
		var offsetInBytes = reader.byteIndexCurrent - byteIndexOfTable;

		// "composite" glyph

		var flagSets = [];
		var flags = null;
		var childGlyphIndices = [];

		while (true)
		{
			// See:
			// https://docs.microsoft.com/en-us/typography/opentype/spec/glyf

			var flagsAsShort = reader.readShort();
			flags = FontTrueTypeGlyphCompositeFlags.fromShort(flagsAsShort);
			flagSets.push(flags);

			var childGlyphIndex = reader.readShort();
			childGlyphIndices.push(childGlyphIndex);

			var argument1 = (flags.areArgs1And2Words? reader.readShort() : reader.readByte());
			var argument2 = (flags.areArgs1And2Words? reader.readShort() : reader.readByte());

			if (flags.isThereASimpleScale)
			{
				var scaleFactor = reader.readShort();
				var scale = new Coords(scaleFactor, scaleFactor);
			}
			else if (flags.areXAndYScalesDifferent)
			{
				var scale = new Coords
				(
					reader.readShort(),
					reader.readShort()
				);
			}
			else if (flags.use2By2Transform)
			{
				// ???
				var scaleX = reader.readShort();
				var scale01 = reader.readShort();
				var scale02 = reader.readShort();
				var scaleY = reader.readShort();
			}
			else
			{
				var scale = new Coords(1.0, 1.0);
			}

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

		var glyphComposite = new FontTrueTypeGlyphComposite
		(
			this, childGlyphIndices, offsetInBytes
		);

		return glyphComposite;
	};

	FontTrueType.prototype.fromBytes_ReadTables_Head = function(reader, length)
	{
		var tableVersion = reader.readFixedPoint16_16();
		var fontRevision = reader.readFixedPoint16_16();
		var checkSumAdjustment = reader.readInt(); // "To compute:  set it to 0, sum the entire font as ULONG, then store 0xB1B0AFBA - sum."
		var magicNumber	= reader.readInt(); // 0x5F0F3CF5

		var flags = reader.readShort();
		// "Bit 0 - baseline for font at y=0;"
		// "Bit 1 - left sidebearing at x=0;"
		// "Bit 2 - instructions may depend on point size;"
		// "Bit 3 - force ppem to integer values for all internal scaler math; may use fractional ppem sizes if this bit is clear;"
		// "Bit 4 - instructions may alter advance width (the advance widths might not scale linearly);"
		// "Note: All other bits must be zero."

		var unitsPerEm = reader.readShort(); // "Valid range is from 16 to 16384"
		var timeCreated = reader.readBytes(8);
		var timeModified = reader.readBytes(8);
		var xMin = reader.readShortSigned(); // "For all glyph bounding boxes."
		var yMin = reader.readShortSigned();
		var xMax = reader.readShortSigned();
		var yMax = reader.readShortSigned();

		var macStyle = reader.readShort();
		// Bit 0 bold (if set to 1); Bit 1 italic (if set to 1)
		// Bits 2-15 reserved (set to 0).

		var lowestRecPPEM = reader.readShortSigned(); // "Smallest readable size in pixels."

		var fontDirectionHint = reader.readShortSigned();
		// 0   Fully mixed directional glyphs;
		// 1   Only strongly left to right;
		// 2   Like 1 but also contains neutrals ;
		//-1   Only strongly right to left;
		//-2   Like -1 but also contains neutrals.

		var indexToLocFormat = reader.readShort(); // 0 for short offsets, 1 long
		var glyphDataFormat = reader.readShort(); // "0 for current format"

		var returnValue = new FontTrueTypeHeaderTable
		(
			tableVersion,
			fontRevision,
			checkSumAdjustment,
			magicNumber,
			flags,
			unitsPerEm,
			timeCreated,
			timeModified,
			xMin,
			yMin,
			xMax,
			yMax,
			macStyle,
			lowestRecPPEM,
			fontDirectionHint,
			indexToLocFormat,
			glyphDataFormat
		);

		return returnValue;
	};

	FontTrueType.prototype.fromBytes_ReadTables_Loca = function(reader, length)
	{
		// "Index to Location"

		var readerByteOffsetOriginal = reader.byteIndexCurrent;

		// "The version [short or long] is specified in the indexToLocFormat entry in the 'head' table."
		var isVersionShortRatherThanLong = false;

		var offsets = [];
		var valueRead = null;

		var numberOfGlyphs = this.maximumProfile.numberOfGlyphs;
		var numberOfGlyphsPlusOne = numberOfGlyphs + 1;

		if (isVersionShortRatherThanLong == true)
		{
			for (var i = 0; i < numberOfGlyphsPlusOne; i++)
			{
				valueRead = reader.readShort();
				var offset = valueRead * 2;
				offsets.push(offset);
			}
		}
		else
		{
			for (var i = 0; i < numberOfGlyphsPlusOne; i++)
			{
				valueRead = reader.readInt();
				var offset = valueRead;
				offsets.push(offset);
			}
		}

		reader.byteIndexCurrent = readerByteOffsetOriginal;

		var returnValue = new FontTrueTypeLocationTable(offsets);

		return returnValue;
	};

	FontTrueType.prototype.fromBytes_ReadTables_Maxp = function(reader, length)
	{
		// "Maximum Profile"

		var readerByteOffsetOriginal = reader.byteIndexCurrent;

		var version = reader.readInt();
		var numberOfGlyphs = reader.readShort();
		var maxPointsPerFontTrueTypeGlyphSimple = reader.readShort();
		var maxContoursPerGlyphSimple = reader.readShort();
		var maxPointsPerGlyphComposite = reader.readShort();
		var maxContoursPerGlyphComposite = reader.readShort();

		// todo - Many more fields.

		reader.byteIndexCurrent = readerByteOffsetOriginal;

		var returnValue = new FontTrueTypeMaximumProfile(numberOfGlyphs);

		return returnValue;
	};
}
