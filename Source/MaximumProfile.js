"use strict";
class MaximumProfile {
    constructor(numberOfGlyphs) {
        this.numberOfGlyphs = numberOfGlyphs;
    }
    static fromBytes(reader, length) {
        // "Maximum Profile"
        var readerByteOffsetOriginal = reader.byteIndexCurrent;
        var version = reader.readInt();
        console.log("todo - use version: " + version);
        var numberOfGlyphs = reader.readShort();
        // todo - Many more fields.
        /*
        var maxPointsPerGlyphSimple = reader.readShort();
        var maxContoursPerGlyphSimple = reader.readShort();
        var maxPointsPerGlyphComposite = reader.readShort();
        var maxContoursPerGlyphComposite = reader.readShort();
        */
        reader.byteIndexCurrent = readerByteOffsetOriginal;
        var returnValue = new MaximumProfile(numberOfGlyphs);
        return returnValue;
    }
}
