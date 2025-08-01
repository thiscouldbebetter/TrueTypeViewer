"use strict";
class FontTrueType {
    constructor(name, glyphs) {
        this.name = name;
        this.glyphs = glyphs;
    }
    glyphByOffset(offset) {
        return this.glyphs[offset];
    }
    // drawable
    drawToDisplay(display, fontHeightInPixels) {
        var glyphsPerRow = Math.floor(display.sizeInPixels.x / fontHeightInPixels);
        var offsetForBaseLines = new Coords(.2, .2).multiplyScalar(fontHeightInPixels);
        var drawPos = new Coords(0, 0);
        for (var g = 0; g < this.glyphs.length; g++) {
            var glyph = this.glyphs[g];
            drawPos.x = g % glyphsPerRow;
            drawPos.y = Math.floor(g / glyphsPerRow);
            drawPos.multiplyScalar(fontHeightInPixels);
            this.drawToDisplay_GlyphBackground(display, fontHeightInPixels, offsetForBaseLines, drawPos);
            glyph.drawToDisplay(display, fontHeightInPixels, this, offsetForBaseLines, drawPos);
        }
    }
    drawToDisplay_GlyphBackground(display, fontHeightInPixels, baseLineOffset, drawOffset) {
        var colorBack = "White";
        var colorFore = "Black";
        display.drawRectangle(drawOffset, new Coords(1, 1).multiplyScalar(fontHeightInPixels), colorBack);
        display.drawLine(new Coords(baseLineOffset.x, 0).add(drawOffset), new Coords(baseLineOffset.x, fontHeightInPixels).add(drawOffset), colorFore);
        display.drawLine(new Coords(0, fontHeightInPixels - baseLineOffset.y).add(drawOffset), new Coords(fontHeightInPixels, fontHeightInPixels - baseLineOffset.y).add(drawOffset), colorFore);
    }
    // file
    fromBytes(bytesFromFileAsBinaryString) {
        var bytesFromFile = bytesFromFileAsBinaryString.split("").map(x => x.charCodeAt(0));
        var reader = new ByteStreamBigEndian(bytesFromFile);
        this.fromBytes_ReadTables(reader);
        return this;
    }
    fromBytes_ReadTables(reader) {
        // offset table
        var sfntVersionAsBytes = reader.readInt();
        console.log("Use: " + sfntVersionAsBytes); // todo
        var numberOfTables = reader.readShort();
        var searchRange = reader.readShort(); // (max power of 2 <= numTables) * 16
        console.log("Use: " + searchRange);
        var entrySelector = reader.readShort(); // log2(max power of 2 <= numTables)
        console.log("Use: " + entrySelector);
        var rangeShift = reader.readShort(); // numberOfTables * 16 - searchRange
        console.log("Use: " + rangeShift);
        // table record entries
        var tableDefns = [];
        for (var t = 0; t < numberOfTables; t++) {
            var tableTypeTag = reader.readString(4);
            var checkSum = reader.readInt();
            var offsetInBytes = reader.readInt();
            var length = reader.readInt();
            var tableDefn = new TableDefn(tableTypeTag, checkSum, offsetInBytes, length);
            tableDefns.push(tableDefn);
        }
        // Tables appear in alphabetical order in the file,
        // but because some depend on others,
        // they cannot be processed in that order.
        var tableNamesOrderedLogically = [
            "head",
            "cmap",
            "maxp",
            "loca",
            "glyf"
        ];
        for (var t = 0; t < tableNamesOrderedLogically.length; t++) {
            var tableName = tableNamesOrderedLogically[t];
            var tableDefn = tableDefns.find(x => x.tableTypeTag == tableName);
            reader.byteIndexCurrent = tableDefn.offsetInBytes;
            var tableTypeTag = tableDefn.tableTypeTag;
            if (tableTypeTag == "cmap") {
                this.encodingTables = CmapEncodingTable.fromBytes(reader, tableDefn.length);
            }
            else if (tableTypeTag == "glyf") {
                this.glyphs = GlyphSimple.tableFromBytes(reader, tableDefn.length);
                this.glyphsByOffsetInBytes =
                    new Map();
                for (var g = 0; g < this.glyphs.length; g++) {
                    var glyph = this.glyphs[g];
                    this.glyphsByOffsetInBytes.set(glyph.offsetInBytes, glyph);
                }
            }
            else if (tableTypeTag == "head") {
                this.headerTable = HeaderTable.fromBytes(reader, tableDefn.length);
            }
            else if (tableTypeTag == "loca") {
                this.indexToLocationTable = LocationTable.fromBytes(reader, tableDefn.length, this.maximumProfile.numberOfGlyphs);
            }
            else if (tableTypeTag == "maxp") {
                this.maximumProfile = MaximumProfile.fromBytes(reader, tableDefn.length);
            }
            else {
                console.log("Skipping table: " + tableTypeTag);
            }
        }
    }
    // file - write
    toBytes() {
        var writer = new ByteStreamBigEndian([]);
        this.toBytes_WriteTables(writer);
        var returnValue = writer.bytes;
        return returnValue;
    }
    toBytes_WriteTables(writer) {
        // offset table
        var sfntVersionAsBytes = -1; // todo
        writer.writeInt(sfntVersionAsBytes);
        var numberOfTables = -1; // todo
        writer.writeShort(numberOfTables);
        var searchRange = -1; // todo
        writer.writeShort(searchRange); // (max power of 2 <= numTables) * 16
        var entrySelector = -1; // todo
        writer.writeShort(entrySelector); // log2(max power of 2 <= numTables)
        var rangeShift = -1; // todo
        writer.writeShort(rangeShift); // numberOfTables * 16 - searchRange
        // table record entries
        for (var t = 0; t < numberOfTables; t++) {
            var tableTypeTag = "todo";
            writer.writeString(tableTypeTag); // 4 chars
            var checksum = -1; // todo
            writer.writeInt(checksum);
            var offsetInBytes = -1; // todo;
            writer.writeInt(offsetInBytes);
            var length = -1; // todo
            writer.writeInt(length);
        }
        var tableNamesOrderedAlphabetically = [
            "cmap",
            "glyf",
            "loca",
            "head",
            "maxp"
        ];
        // var tableDefns = []; // todo
        for (var t = 0; t < tableNamesOrderedAlphabetically.length; t++) {
            var tableName = tableNamesOrderedAlphabetically[t];
            // var tableDefn = "todo";
            if (tableName == "cmap") {
                /*
                var encodingTableIndex = 0; // todo
                var tableEncoding = this.encodingTables[encodingTableIndex];
                writer.byteIndexCurrent = tableEncoding.offsetInBytes;
                var tableAsBytes = tableEncoding.toBytes();
                writer.writeBytes(tableAsBytes);
                */
            }
            else if (tableTypeTag == "glyf") {
                /*
                var tableGlyphs = this.glyphs;
                writer.byteIndexCurrent = tableGlyphs.offsetInBytes;
                var tableAsBytes = tableGlyphs.toBytes();
                writer.writeBytes(tableAsBytes);
                */
            }
            else if (tableTypeTag == "head") {
                /*
                var tableHeader = this.headerTable;
                writer.byteIndexCurrent = tableHeader.offsetInBytes;
                var tableAsBytes = tableHeader.toBytes();
                writer.writeBytes(tableAsBytes);
                */
            }
            else if (tableTypeTag == "loca") {
                /*
                var tableIndexToLoc = this.indexToLocationTable;
                writer.byteIndexCurrent = tableIndexToLoc.offsetInBytes;
                var tableAsBytes = tableIndexToLoc.toBytes();
                writer.writeBytes(tableAsBytes);
                */
            }
            else if (tableTypeTag == "maxp") {
                /*
                var tableMaxProfile = this.maximumProfile;
                writer.byteIndexCurrent = tableMaxProfile.offsetInBytes;
                var tableAsBytes = tableMaxProfile.toBytes();
                writer.writeBytes(tableAsBytes);
                */
            }
            else {
                console.log("Unexpected table type: " + tableName);
            }
        }
    }
    // dom
    toDomElement() {
        var d = document;
        // glyph selected
        var inputFontHeightInPixels = d.getElementById("inputFontHeightInPixels");
        var fontHeightInPixels = parseInt(inputFontHeightInPixels.value);
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
        selectGlyphIndex.onchange = (event) => {
            var glyphIndex = parseInt(selectGlyphIndex.value);
            var glyph = glyphs[glyphIndex];
            displayGlyphSelected.clear();
            glyph.drawToDisplay(
            // display, fontHeightInPixels, font, offsetForBaseLines, drawOffset
            displayGlyphSelected, fontHeightInPixels, font, new Coords(0, 0), new Coords(0, 0));
            var glyphAsJson = glyph.toStringJson();
            textareaGlyphAsJson.value = glyphAsJson;
        };
        for (var i = 0; i < glyphs.length; i++) {
            //var glyph = glyphs[i];
            var option = d.createElement("option");
            option.text = "" + i;
            option.value = "" + i;
            selectGlyphIndex.appendChild(option);
        }
        // cmap
        var charCodeToGlyphIndexLookup = this.encodingTables[0].charCodeToGlyphIndexLookup;
        var labelCharCode = d.createElement("label");
        labelCharCode.innerHTML = "Character Code to Glyph Index Mappings:";
        var selectCharCode = d.createElement("select");
        selectCharCode.size = 4;
        selectCharCode.onchange = (event) => {
            var glyphIndex = selectCharCode.value;
            selectGlyphIndex.value = glyphIndex;
            selectGlyphIndex.onchange(null);
        };
        for (var i = 0; i < charCodeToGlyphIndexLookup.length; i++) {
            var glyphIndex = charCodeToGlyphIndexLookup[i];
            if (glyphIndex != null) {
                var option = d.createElement("option");
                var charFromCode = String.fromCharCode(i);
                option.text = charFromCode + ":" + glyphIndex;
                option.value = "" + glyphIndex;
                selectCharCode.appendChild(option);
            }
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
    }
}
