
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

		var offsetForBaseLines = new Coords(.2, .2).multiplyScalar(fontHeightInPixels);
		var drawPos = new Coords();

		for (var g = 0; g < this.glyphs.length; g++)
		{
			var glyph = this.glyphs[g];

			drawPos.x = g % glyphsPerRow;
			drawPos.y = Math.floor(g / glyphsPerRow);
			drawPos.multiplyScalar(fontHeightInPixels);

			this.drawToDisplay_GlyphBackground
			(
				display, fontHeightInPixels, offsetForBaseLines, drawPos
			);

			glyph.drawToDisplay(display, fontHeightInPixels, this, offsetForBaseLines, drawPos);
		}
	};

	FontTrueType.prototype.drawToDisplay_GlyphBackground = function
	(
		display, fontHeightInPixels, baseLineOffset, drawOffset
	)
	{
		display.drawRectangle
		(
			drawOffset,
			new Coords(1, 1).multiplyScalar(fontHeightInPixels)
		);

		display.drawLine
		(
			new Coords(baseLineOffset.x, 0).add(drawOffset),
			new Coords(baseLineOffset.x, fontHeightInPixels).add(drawOffset)
		);

		display.drawLine
		(
			new Coords(0, fontHeightInPixels - baseLineOffset.y).add(drawOffset),
			new Coords(fontHeightInPixels, fontHeightInPixels - baseLineOffset.y).add(drawOffset)
		)
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
				throw "Unsupported cmap format code: " + formatCode;
			}
			else if (formatCode == 4)
			{
				// "Microsoft standard"
				// Not yet fully implemented.

				console.log("Unsupported cmap format code: " + formatCode);
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
				throw "Unsupported cmap format code: " + formatCode;
			}
			else
			{
				throw "Unrecognized cmap format code: " + formatCode;
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
			var offsetInBytes = reader.byteIndexCurrent - glyphOffsetBase;
			if (numberOfContours >= 0)
			{
				glyph = new FontTrueTypeGlyph().fromByteStream
				(
					reader,
					numberOfContours,
					minAndMax,
					offsetInBytes
				);
			}
			else
			{
				glyph = new FontTrueTypeGlyphComposite().fromByteStreamAndOffset
				(
					reader,
					offsetInBytes
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
