"use strict";
class HeaderTable {
    constructor(tableVersion, fontRevision, checkSumAdjustment, magicNumber, flags, unitsPerEm, timeCreated, timeModified, xMin, yMin, xMax, yMax, macStyle, lowestRecPPEM, fontDirectionHint, indexToLocFormat, glyphDataFormat) {
        this.tableVersion = tableVersion;
        this.fontRevision = fontRevision;
        this.checkSumAdjustment = checkSumAdjustment;
        this.magicNumber = magicNumber;
        this.flags = flags;
        this.unitsPerEm = unitsPerEm;
        this.timeCreated = timeCreated;
        this.timeModified = timeModified;
        this.xMin = xMin;
        this.yMin = yMin;
        this.xMax = xMax;
        this.yMax = yMax;
        this.macStyle = macStyle;
        this.lowestRecPPEM = lowestRecPPEM;
        this.fontDirectionHint = fontDirectionHint;
        this.indexToLocFormat = indexToLocFormat;
        this.glyphDataFormat = glyphDataFormat;
    }
    static fromBytes(reader, length) {
        var tableVersion = reader.readFixedPoint16_16();
        var fontRevision = reader.readFixedPoint16_16();
        var checkSumAdjustment = reader.readInt(); // "To compute:  set it to 0, sum the entire font as ULONG, then store 0xB1B0AFBA - sum."
        var magicNumber = reader.readInt(); // 0x5F0F3CF5
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
        var returnValue = new HeaderTable(tableVersion, fontRevision, checkSumAdjustment, magicNumber, flags, unitsPerEm, timeCreated, timeModified, xMin, yMin, xMax, yMax, macStyle, lowestRecPPEM, fontDirectionHint, indexToLocFormat, glyphDataFormat);
        return returnValue;
    }
}
