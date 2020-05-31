
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
				this.encodingTables = CmapEncodingTable.fromBytes
				(
					reader, tableDefn.length
				);
			}
			else if (tableTypeTag == "glyf")
			{
				this.glyphs = Glyph.tableFromBytes
				(
					reader, tableDefn.length
				);
			}
			else if (tableTypeTag == "head")
			{
				this.headerTable = HeaderTable.fromBytes
				(
					reader, tableDefn.length
				);
			}
			else if (tableTypeTag == "loca")
			{
				this.indexToLocationTable = LocationTable.fromBytes
				(
					reader, tableDefn.length, this.maximumProfile.numberOfGlyphs
				);
			}
			else if (tableTypeTag == "maxp")
			{
				this.maximumProfile = MaximumProfile.fromBytes
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

	// dom

	FontTrueType.prototype.toDomElement = function()
	{
		var d = document;

		// glyph selected

		var fontHeightInPixels = parseInt(d.getElementById("inputFontHeightInPixels").value);
		var displaySize = new Coords(1, 1).multiplyScalar(fontHeightInPixels);
		var displayGlyphSelected = new Display(displaySize);
		displayGlyphSelected.initialize();

		var labelGlyphAsJson = d.createElement("label");
		labelGlyphAsJson.innerHTML = "Glyph as JSON:";
		var textareaGlyphAsJson = d.createElement("textarea");
		textareaGlyphAsJson.cols = 80;
		textareaGlyphAsJson.rows = 25;

		// glyph indices

		var glyphs = this.glyphs;

		var labelGlyphIndex = d.createElement("label");
		labelGlyphIndex.innerHTML = "Glyph Indices:";

		var selectGlyphIndex = d.createElement("select");
		selectGlyphIndex.size = 4;
		var font = this;
		selectGlyphIndex.onchange = (event) => 
		{
			var glyphIndex = parseInt(selectGlyphIndex.value);
			var glyph = glyphs[glyphIndex];
			displayGlyphSelected.clear();
			glyph.drawToDisplay
			(
				// display, fontHeightInPixels, font, offsetForBaseLines, drawOffset
				displayGlyphSelected, fontHeightInPixels, font, new Coords(0, 0), new Coords(0, 0)
			);
			var glyphAsJson = glyph.toStringJson();
			textareaGlyphAsJson.value = glyphAsJson;
		}

		for (var i = 0; i < glyphs.length; i++)
		{
			var glyph = glyphs[i];
			var option = d.createElement("option");
			option.text = i;
			option.value = i;
			selectGlyphIndex.appendChild(option);
		}

		// cmap

		var charCodeToGlyphIndexLookup = this.encodingTables[0].charCodeToGlyphIndexLookup;

		var labelCharCode = d.createElement("label");
		labelCharCode.innerHTML = "Character Code to Glyph Index Mappings:";

		var selectCharCode = d.createElement("select");
		selectCharCode.size = 4;
		selectCharCode.onchange = (event) =>
		{
			var glyphIndex = selectCharCode.value;
			selectGlyphIndex.value = glyphIndex;
			selectGlyphIndex.onchange();
		};

		for (var charCode in charCodeToGlyphIndexLookup)
		{
			var glyphIndex = charCodeToGlyphIndexLookup[charCode];
			var option = d.createElement("option");
			var charFromCode = String.fromCharCode(charCode);
			option.text = charFromCode + ":" + glyphIndex;
			option.value = glyphIndex;
			selectCharCode.appendChild(option);
		}

		// glyph selected

		var labelGlyphSelected = d.createElement("label");
		labelGlyphSelected.innerHTML = "Glyph Selected:";

		// layout

		var returnValue = d.createElement("div");

		returnValue.appendChild(labelCharCode);
		returnValue.appendChild(d.createElement("br"));
		returnValue.appendChild(selectCharCode);
		returnValue.appendChild(d.createElement("br"));

		returnValue.appendChild(labelGlyphIndex);
		returnValue.appendChild(d.createElement("br"));
		returnValue.appendChild(selectGlyphIndex);
		returnValue.appendChild(d.createElement("br"));

		returnValue.appendChild(labelGlyphSelected);
		returnValue.appendChild(d.createElement("br"));
		returnValue.appendChild(displayGlyphSelected.canvas);
		returnValue.appendChild(d.createElement("br"));

		returnValue.appendChild(labelGlyphAsJson);
		returnValue.appendChild(d.createElement("br"));
		returnValue.appendChild(textareaGlyphAsJson);
		returnValue.appendChild(d.createElement("br"));

		return returnValue;
	};

}
