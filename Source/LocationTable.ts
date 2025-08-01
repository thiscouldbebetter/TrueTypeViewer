
class LocationTable
{
	offsets: number[];

	constructor(offsets: number[])
	{
		this.offsets = offsets;
	}

	static fromBytes(reader: ByteStreamBigEndian, length: number, numberOfGlyphs: number): LocationTable
	{
		// "Index to Location"

		var readerByteOffsetOriginal = reader.byteIndexCurrent;

		// "The version [short or long] is specified in the indexToLocFormat entry in the 'head' table."
		var isVersionShortRatherThanLong = false;

		var offsets = [];
		var valueRead = null;

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
	}
}
