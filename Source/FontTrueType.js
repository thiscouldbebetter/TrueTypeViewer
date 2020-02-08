
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

			var tableDefn = new TableDefn
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
		// See:
		// https://docs.microsoft.com/en-us/typography/opentype/spec/cmap
		// https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6cmap.html

		var cmapTableOffsetInBytes = reader.byteIndexCurrent;

		var version = reader.readShort();

		var numberOfEncodingTables = reader.readShort();
		var encodingTables = [];

		for (var e = 0; e < numberOfEncodingTables; e++)
		{
			var platformID = reader.readShort(); // 0 = Unicode, 1 = Mac, 3 = Microsoft Windows, 4 = Custom
			var encodingID = reader.readShort(); // 1 = Unicode
			var offsetInBytes = reader.readInt(); // 32 bits, TrueType "long"

			var encodingTable = new CmapEncodingTable
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

			var encodingTableOffsetAbsolute =
				cmapTableOffsetInBytes
				+ encodingTable.offsetInBytes;

			reader.byteIndexCurrent = encodingTableOffsetAbsolute;

			var formatCode = reader.readShort();
			if (formatCode == 0)
			{
				// "Apple standard", "byte encoding table"
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
				// "segment mapping to delta values"

				var subtableLengthInBytes = reader.readShort();
				var language = reader.readShort(); // "Always 0 except for Mac."
				var segmentCountTimes2 = reader.readShort();
				var segmentCount = segmentCountTimes2 / 2;
				var searchRange = reader.readShort(); // "2 x (2**floor(log2(segCount)))"
				var entrySelector = reader.readShort(); // "log2(searchRange/2)"
				var rangeShift = reader.readShort(); // 2 x segCount - searchRange

				var segmentEndCharCodes = [];
				for (var s = 0; s < segmentCount; s++)
				{
					var segmentEndCharCode = reader.readShort();
					segmentEndCharCodes.push(segmentEndCharCode);
				}
				if (segmentEndCharCodes[segmentEndCharCodes.length - 1] != 0xFFFF)
				{
					throw "Final segment end char code did not have expected value!";
				}

				var reservedPad = reader.readShort(); // "Set to 0."

				var segmentStartCharCodes = [];
				for (var s = 0; s < segmentCount; s++)
				{
					var segmentStartCharCode = reader.readShort();
					segmentStartCharCodes.push(segmentStartCharCode);
				}
				if (segmentStartCharCodes[segmentStartCharCodes.length - 1] != 0xFFFF)
				{
					throw "Final segment start char code did not have expected value!";
				}

				var idDeltasForCharCodesInSegments = [];
				for (var s = 0; s < segmentCount; s++)
				{
					var idDeltaForCharCodesInSegment = reader.readShortSigned();
					idDeltasForCharCodesInSegments.push(idDeltaForCharCodesInSegment);
				}

				var addressesOfIdRangeOffsetsForSegment = [];
				var idRangeOffsetsInBytesForSegments = [];
				for (var s = 0; s < segmentCount; s++)
				{
					var addressOfIdRangeOffsetForSegment = reader.byteIndexCurrent; // This is not ideal.
					addressesOfIdRangeOffsetsForSegment.push(addressOfIdRangeOffsetForSegment);

					var idRangeOffsetInBytesForSegment = reader.readShort();
					idRangeOffsetsInBytesForSegments.push(idRangeOffsetInBytesForSegment);
				}

				var readerByteOffsetOfGlyphIndices = reader.byteIndexCurrent;
				var charCodeToGlyphIndexLookup = {};

				for (var s = 0; s < segmentCount; s++)
				{
					var segmentCharCodeStart = segmentStartCharCodes[s];
					var segmentCharCodeEnd = segmentEndCharCodes[s];
					var idDeltaForCharCodesInSegment = idDeltasForCharCodesInSegments[s];
					var idRangeOffsetInBytes = idRangeOffsetsInBytesForSegments[s];
					var addressOfIdRangeOffset = addressesOfIdRangeOffsetsForSegment[s];

					var idRangeOffsetInWords = idRangeOffsetInBytes / 2; // Each glyph index is 16 bits.

					var numberOfCharCodesInSegment = segmentCharCodeEnd - segmentCharCodeStart;
					for (var c = 0; c < numberOfCharCodesInSegment; c++)
					{
						var charCode = segmentCharCodeStart + c;

						var glyphIndex;
						if (idRangeOffsetInWords == 0)
						{
							glyphIndex = charCode + idDeltaForCharCodesInSegment;
						}
						else
						{
							var glyphIndexOffsetAbsolute =
								idRangeOffsetInWords + c + addressOfIdRangeOffset;
							reader.byteIndexCurrent = glyphIndexOffsetAbsolute;
							glyphIndex = reader.readShort();
						}

						charCodeToGlyphIndexLookup[charCode] = glyphIndex;
					}
				}

				encodingTable.charCodeToGlyphIndexLookup = charCodeToGlyphIndexLookup;

			}
			else if (formatCode == 6)
			{
				var formatName = "trimmed table mapping";
				throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
			}
			else if (formatCode == 8)
			{
				var formatName = "mixed 16-bit and 32-bit coverage";
				throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
			}
			else if (formatCode == 10)
			{
				var formatName = "trimmed array";
				throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
			}
			else if (formatCode == 12)
			{
				var formatName = "segmented coverage";
				throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
			}
			else if (formatCode == 13)
			{
				var formatName = "many-to-one range mappings";
				throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
			}
			else if (formatCode == 14)
			{
				var formatName = "unicode variation sequences";
				throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
			}
			else
			{
				throw "Unrecognized cmap format code: " + formatCode;
			}
		}

		reader.byteIndexCurrent = cmapTableOffsetInBytes;

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
			if (numberOfContours == 0)
			{
				continue;
			}

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
			var isGlyphSimpleNotComposite = (numberOfContours >= 0);
			if (isGlyphSimpleNotComposite)
			{
				glyph = new Glyph();
				glyph.fromByteStream
				(
					reader,
					numberOfContours,
					minAndMax,
					offsetInBytes
				);
			}
			else
			{
				glyph = GlyphComposite();
				glyph.fromByteStreamAndOffset
				(
					reader,
					offsetInBytes
				);
			}

			// Should we align on 16 or 32 bits?
			// If 32, impact.ttf fails to parse correctly.
			// If 16, the intentionally-simple thiscouldbebetter 3x5 font fails.
			// With no alignment, neither works.
			reader.align16Bit();
			//reader.align32Bit();

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

		var returnValue = new HeaderTable
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

		if (isVersionShortRatherThanLong)
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

		var returnValue = new LocationTable(offsets);

		return returnValue;
	};

	FontTrueType.prototype.fromBytes_ReadTables_Maxp = function(reader, length)
	{
		// "Maximum Profile"

		var readerByteOffsetOriginal = reader.byteIndexCurrent;

		var version = reader.readInt();
		var numberOfGlyphs = reader.readShort();
		var maxPointsPerGlyphSimple = reader.readShort();
		var maxContoursPerGlyphSimple = reader.readShort();
		var maxPointsPerGlyphComposite = reader.readShort();
		var maxContoursPerGlyphComposite = reader.readShort();

		// todo - Many more fields.

		reader.byteIndexCurrent = readerByteOffsetOriginal;

		var returnValue = new MaximumProfile(numberOfGlyphs);

		return returnValue;
	};
}
