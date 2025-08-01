"use strict";
class CmapEncodingTable {
    constructor(platformID, encodingID, offsetInBytes) {
        this.platformID = platformID;
        this.encodingID = encodingID;
        this.offsetInBytes = offsetInBytes;
        // Unicode BMP for Windows : PlatformID = 3, EncodingID = 1
    }
    static fromBytes(reader, length) {
        // See:
        // https://docs.microsoft.com/en-us/typography/opentype/spec/cmap
        // https://developer.apple.com/fonts/TrueType-Reference-Manual/RM06/Chap6cmap.html
        var cmapTableOffsetInBytes = reader.byteIndexCurrent;
        var version = reader.readShort();
        console.log("todo - use version: " + version);
        var numberOfEncodingTables = reader.readShort();
        var encodingTables = [];
        for (var e = 0; e < numberOfEncodingTables; e++) {
            var platformID = reader.readShort(); // 0 = Unicode, 1 = Mac, 3 = Microsoft Windows, 4 = Custom
            var encodingID = reader.readShort(); // 1 = Unicode
            var offsetInBytes = reader.readInt(); // 32 bits, TrueType "long"
            var encodingTable = new CmapEncodingTable(platformID, encodingID, offsetInBytes);
            encodingTables.push(encodingTable);
        }
        for (var e = 0; e < numberOfEncodingTables; e++) {
            var encodingTable = encodingTables[e];
            var encodingTableOffsetAbsolute = cmapTableOffsetInBytes
                + encodingTable.offsetInBytes;
            reader.byteIndexCurrent = encodingTableOffsetAbsolute;
            var formatCode = reader.readShort();
            if (formatCode == 0) {
                // "Apple standard", "byte encoding table"
                var lengthInBytes = reader.readShort();
                var version = reader.readShort();
                console.log("todo - use lengthInBytes and version:" + lengthInBytes + version);
                var numberOfMappings = 256;
                encodingTable.charCodeToGlyphIndexLookup = reader.readBytes(numberOfMappings);
            }
            else if (formatCode == 2) {
                // "high-byte mapping through table"
                // "useful for... Japanese, Chinese, and Korean"
                // "mixed 8/16-bit encoding"
                throw "Unsupported cmap format code: " + formatCode;
            }
            else if (formatCode == 4) {
                // "Microsoft standard"
                // "segment mapping to delta values"
                var subtableLengthInBytes = reader.readShort();
                var language = reader.readShort(); // "Always 0 except for Mac."
                var segmentCountTimes2 = reader.readShort();
                var segmentCount = segmentCountTimes2 / 2;
                var searchRange = reader.readShort(); // "2 x (2**floor(log2(segCount)))"
                var entrySelector = reader.readShort(); // "log2(searchRange/2)"
                var rangeShift = reader.readShort(); // 2 x segCount - searchRange
                console.log("todo - Use " + subtableLengthInBytes + language + segmentCount + searchRange + entrySelector + rangeShift);
                var segmentEndCharCodes = [];
                for (var s = 0; s < segmentCount; s++) {
                    var segmentEndCharCode = reader.readShort();
                    segmentEndCharCodes.push(segmentEndCharCode);
                }
                if (segmentEndCharCodes[segmentEndCharCodes.length - 1] != 0xFFFF) {
                    throw "Final segment end char code did not have expected value!";
                }
                var reservedPad = reader.readShort(); // "Set to 0."
                console.log("todo - Use reservedPad: " + reservedPad);
                var segmentStartCharCodes = [];
                for (var s = 0; s < segmentCount; s++) {
                    var segmentStartCharCode = reader.readShort();
                    segmentStartCharCodes.push(segmentStartCharCode);
                }
                if (segmentStartCharCodes[segmentStartCharCodes.length - 1] != 0xFFFF) {
                    throw "Final segment start char code did not have expected value!";
                }
                var idDeltasForCharCodesInSegments = [];
                for (var s = 0; s < segmentCount; s++) {
                    var idDeltaForCharCodesInSegment = reader.readShortSigned();
                    idDeltasForCharCodesInSegments.push(idDeltaForCharCodesInSegment);
                }
                var addressesOfIdRangeOffsetsForSegment = [];
                var idRangeOffsetsInBytesForSegments = [];
                for (var s = 0; s < segmentCount; s++) {
                    var addressOfIdRangeOffsetForSegment = reader.byteIndexCurrent; // This is not ideal.
                    addressesOfIdRangeOffsetsForSegment.push(addressOfIdRangeOffsetForSegment);
                    var idRangeOffsetInBytesForSegment = reader.readShort();
                    idRangeOffsetsInBytesForSegments.push(idRangeOffsetInBytesForSegment);
                }
                var charCodeToGlyphIndexLookup = [];
                for (var s = 0; s < segmentCount; s++) {
                    var segmentCharCodeStart = segmentStartCharCodes[s];
                    var segmentCharCodeEnd = segmentEndCharCodes[s];
                    var idDeltaForCharCodesInSegment = idDeltasForCharCodesInSegments[s];
                    var idRangeOffsetInBytes = idRangeOffsetsInBytesForSegments[s];
                    var addressOfIdRangeOffset = addressesOfIdRangeOffsetsForSegment[s];
                    var idRangeOffsetInWords = idRangeOffsetInBytes / 2; // Each glyph index is 16 bits.
                    var numberOfCharCodesInSegment = segmentCharCodeEnd - segmentCharCodeStart;
                    for (var c = 0; c < numberOfCharCodesInSegment; c++) {
                        var charCode = segmentCharCodeStart + c;
                        var glyphIndex;
                        if (idRangeOffsetInWords == 0) {
                            glyphIndex = charCode + idDeltaForCharCodesInSegment;
                        }
                        else {
                            var glyphIndexOffsetAbsolute = idRangeOffsetInWords + c + addressOfIdRangeOffset;
                            reader.byteIndexCurrent = glyphIndexOffsetAbsolute;
                            glyphIndex = reader.readShort();
                        }
                        charCodeToGlyphIndexLookup[charCode] = glyphIndex;
                    }
                }
                encodingTable.charCodeToGlyphIndexLookup = charCodeToGlyphIndexLookup;
            }
            else if (formatCode == 6) {
                var formatName = "trimmed table mapping";
                throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
            }
            else if (formatCode == 8) {
                var formatName = "mixed 16-bit and 32-bit coverage";
                throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
            }
            else if (formatCode == 10) {
                var formatName = "trimmed array";
                throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
            }
            else if (formatCode == 12) {
                var formatName = "segmented coverage";
                throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
            }
            else if (formatCode == 13) {
                var formatName = "many-to-one range mappings";
                throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
            }
            else if (formatCode == 14) {
                var formatName = "unicode variation sequences";
                throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
            }
            else {
                throw "Unrecognized cmap format code: " + formatCode;
            }
        }
        reader.byteIndexCurrent = cmapTableOffsetInBytes;
        return encodingTables;
    }
    toBytes() {
        var writer = new ByteStreamBigEndian([]);
        var cmapTableOffsetInBytes = -1; // todo
        writer.byteIndexCurrent = cmapTableOffsetInBytes;
        var version = -1; // todo
        writer.writeShort(version);
        var numberOfEncodingTables = -1; // todo
        writer.writeShort(numberOfEncodingTables);
        writer.writeShort(this.platformID); // 0 = Unicode, 1 = Mac, 3 = Microsoft Windows, 4 = Custom
        writer.writeShort(this.encodingID); // 1 = Unicode
        writer.writeInt(this.offsetInBytes); // 32 bits, TrueType "long"
        var encodingTableOffsetAbsolute = cmapTableOffsetInBytes + this.offsetInBytes;
        writer.byteIndexCurrent = encodingTableOffsetAbsolute;
        var formatCode = -1;
        writer.writeShort(formatCode);
        if (formatCode == 0) {
            // "Apple standard", "byte encoding table"
            var lengthInBytes = -1; // todo
            writer.writeShort(lengthInBytes);
            var version = -1; // todo
            writer.writeShort(version);
            var numberOfMappings = 256;
            var charCodeToGlyphIndexLookup = [];
            for (var i = 0; i < numberOfMappings; i++) {
                charCodeToGlyphIndexLookup.push(i); // todo
            }
            writer.writeBytes(charCodeToGlyphIndexLookup);
        }
        else if (formatCode == 2) {
            // "high-byte mapping through table"
            // "useful for... Japanese, Chinese, and Korean"
            // "mixed 8/16-bit encoding"
            throw "Unsupported cmap format code: " + formatCode;
        }
        else if (formatCode == 4) {
            // "Microsoft standard"
            // "segment mapping to delta values"
            var subtableLengthInBytes = -1; // todo
            writer.writeShort(subtableLengthInBytes);
            var language = 0; // todo
            writer.writeShort(language); // "Always 0 except for Mac."
            var segmentCount = 0; // todo
            var segmentCountTimes2 = segmentCount * 2;
            writer.writeShort(segmentCountTimes2);
            var searchRange = -1; // todo
            writer.writeShort(searchRange); // "2 x (2**floor(log2(segCount)))"
            var entrySelector = -1; // todo
            writer.writeShort(entrySelector); // "log2(searchRange/2)"
            var rangeShift = -1; // todo
            writer.writeShort(rangeShift); // 2 x segCount - searchRange
            var segmentEndCharCodes = [];
            for (var s = 0; s < segmentCount; s++) {
                var segmentEndCharCode = segmentEndCharCodes[s] || -1; // todo
                writer.writeShort(segmentEndCharCode);
            }
            if (segmentEndCharCodes[segmentEndCharCodes.length - 1] != 0xFFFF) {
                throw "Final segment end char code did not have expected value!";
            }
            var reservedPad = 0;
            writer.writeShort(reservedPad); // "Set to 0."
            var segmentStartCharCodes = [];
            for (var s = 0; s < segmentCount; s++) {
                var segmentStartCharCode = -1; // todo
                writer.writeShort(segmentStartCharCode);
                segmentStartCharCodes.push(segmentStartCharCode);
            }
            if (segmentStartCharCodes[segmentStartCharCodes.length - 1] != 0xFFFF) {
                throw "Final segment start char code did not have expected value!";
            }
            var idDeltasForCharCodesInSegments = [];
            for (var s = 0; s < segmentCount; s++) {
                var idDeltaForCharCodesInSegment = idDeltasForCharCodesInSegments[s];
                writer.writeShortSigned(idDeltaForCharCodesInSegment);
            }
            var addressesOfIdRangeOffsetsForSegment = [];
            var idRangeOffsetsInBytesForSegments = [];
            for (var s = 0; s < segmentCount; s++) {
                var addressOfIdRangeOffsetForSegment = addressesOfIdRangeOffsetsForSegment[s];
                writer.byteIndexCurrent = addressOfIdRangeOffsetForSegment; // This is not ideal.
                var idRangeOffsetInBytesForSegment = idRangeOffsetsInBytesForSegments[s];
                writer.writeShort(idRangeOffsetInBytesForSegment);
            }
            var readerByteOffsetOfGlyphIndices = -1; // todo
            writer.byteIndexCurrent = readerByteOffsetOfGlyphIndices;
            var charCodeToGlyphIndexLookup = [];
            for (var s = 0; s < segmentCount; s++) {
                var segmentCharCodeStart = segmentStartCharCodes[s];
                var segmentCharCodeEnd = segmentEndCharCodes[s];
                var idDeltaForCharCodesInSegment = idDeltasForCharCodesInSegments[s];
                var idRangeOffsetInBytes = idRangeOffsetsInBytesForSegments[s];
                var addressOfIdRangeOffset = addressesOfIdRangeOffsetsForSegment[s];
                var idRangeOffsetInWords = idRangeOffsetInBytes / 2; // Each glyph index is 16 bits.
                var numberOfCharCodesInSegment = segmentCharCodeEnd - segmentCharCodeStart;
                for (var c = 0; c < numberOfCharCodesInSegment; c++) {
                    var charCode = segmentCharCodeStart + c;
                    var glyphIndex;
                    if (idRangeOffsetInWords == 0) {
                        glyphIndex = charCode + idDeltaForCharCodesInSegment;
                    }
                    else {
                        var glyphIndexOffsetAbsolute = idRangeOffsetInWords + c + addressOfIdRangeOffset;
                        writer.byteIndexCurrent = glyphIndexOffsetAbsolute;
                        writer.writeShort(glyphIndex);
                    }
                    charCodeToGlyphIndexLookup[charCode] = glyphIndex;
                }
            }
            // encodingTable.charCodeToGlyphIndexLookup = charCodeToGlyphIndexLookup;
        }
        else if (formatCode == 6) {
            var formatName = "trimmed table mapping";
            throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
        }
        else if (formatCode == 8) {
            var formatName = "mixed 16-bit and 32-bit coverage";
            throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
        }
        else if (formatCode == 10) {
            var formatName = "trimmed array";
            throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
        }
        else if (formatCode == 12) {
            var formatName = "segmented coverage";
            throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
        }
        else if (formatCode == 13) {
            var formatName = "many-to-one range mappings";
            throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
        }
        else if (formatCode == 14) {
            var formatName = "unicode variation sequences";
            throw "Unsupported cmap format code: " + formatCode + "(" + formatName + ")";
        }
        else {
            throw "Unrecognized cmap format code: " + formatCode;
        }
        var returnValue = writer.bytes;
        return returnValue;
    }
    // dom
    toDomElement() {
        var d = document;
        var select = d.createElement("select");
        select.size = 4;
        for (var i = 0; i < this.charCodeToGlyphIndexLookup.length; i++) {
            var glyphIndex = this.charCodeToGlyphIndexLookup[i];
            var option = d.createElement("option");
            var charFromCode = String.fromCharCode(i);
            option.text = charFromCode + ":" + glyphIndex;
            option.value = "" + i;
            select.appendChild(option);
        }
        var label = d.createElement("label");
        label.innerHTML = "Character Code to Glyph Index Mappings:";
        var returnValue = d.createElement("div");
        returnValue.appendChild(label);
        returnValue.appendChild(d.createElement("br"));
        returnValue.appendChild(select);
        return returnValue;
    }
}
