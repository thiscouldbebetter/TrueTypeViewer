
function MaximumProfile(numberOfGlyphs)
{
	this.numberOfGlyphs = numberOfGlyphs;
}

{
	MaximumProfile.fromBytes = function(reader, length)
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
