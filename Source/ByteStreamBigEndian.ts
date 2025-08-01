
class ByteStreamBigEndian
{
	bytes: number[];

	numberOfBytesTotal: number;
	byteIndexCurrent: number;

	constructor(bytes: number[])
	{
		this.bytes = bytes;

		this.numberOfBytesTotal = this.bytes.length;
		this.byteIndexCurrent = 0;
	}

	align16Bit(): ByteStreamBigEndian
	{
		while (this.byteIndexCurrent % 2 != 0)
		{
			this.readByte();
		}
		return this;
	}

	align32Bit(): ByteStreamBigEndian
	{
		while (this.byteIndexCurrent % 4 != 0)
		{
			this.readByte();
		}
		return this;
	}

	hasMoreBytes(): boolean
	{
		return (this.byteIndexCurrent < this.numberOfBytesTotal);
	}

	peekBytes(numberOfBytesToRead: number): number[]
	{
		var returnValue = [];

		for (var b = 0; b < numberOfBytesToRead; b++)
		{
			returnValue[b] = this.bytes[this.byteIndexCurrent + b];
		}

		return returnValue;
	}

	readBytes(numberOfBytesToRead: number): number[]
	{
		var returnValue = [];

		for (var b = 0; b < numberOfBytesToRead; b++)
		{
			returnValue[b] = this.readByte();
		}

		return returnValue;
	}

	readByte(): number
	{
		var returnValue = this.bytes[this.byteIndexCurrent];

		this.byteIndexCurrent++;

		return returnValue;
	}

	readByteSigned(): number
	{
		var returnValue = this.readByte();

		var maxValue = 128; // hack
		if (returnValue >= maxValue)
		{
			returnValue -= maxValue + maxValue;
		}

		return returnValue;
	}

	readFixedPoint16_16(): number
	{
		var valueIntegral = this.readShort();
		var valueFractional = this.readShort();

		var valueAsString = "" + valueIntegral + "." + valueFractional;

		var returnValue = parseFloat(valueAsString);

		return returnValue;
	}

	readInt(): number
	{
		var returnValue =
		(
			((this.readByte() & 0xFF) << 24)
			| ((this.readByte() & 0xFF) << 16 )
			| ((this.readByte() & 0xFF) << 8 )
			| ((this.readByte() & 0xFF) )
		);

		return returnValue;
	}

	readShort(): number
	{
		var returnValue =
		(
			((this.readByte() & 0xFF) << 8)
			| ((this.readByte() & 0xFF))
		);

		return returnValue;
	}

	readShortSigned(): number
	{
		var returnValue =
		(
			((this.readByte() & 0xFF) << 8)
			| ((this.readByte() & 0xFF))
		);

		var maxValue = Math.pow(2, 15); // hack
		if (returnValue >= maxValue)
		{
			returnValue -= maxValue + maxValue;
		}

		return returnValue;
	}

	readString(numberOfBytesToRead: number): string
	{
		var returnValue = "";

		for (var b = 0; b < numberOfBytesToRead; b++)
		{
			var charAsByte = this.readByte();
			returnValue += String.fromCharCode(charAsByte);
		}

		return returnValue;
	}

	writeByte(byteToWrite: number): ByteStreamBigEndian
	{
		this.bytes[this.byteIndexCurrent] = byteToWrite;
		this.byteIndexCurrent++;
		return this;
	}

	writeBytes(bytesToWrite: number[]): ByteStreamBigEndian
	{
		for (var b = 0; b < bytesToWrite.length; b++)
		{
			var byteToWrite = bytesToWrite[b];
			this.writeByte(byteToWrite);
		}
		return this;
	}

	writeInt(intToWrite: number): ByteStreamBigEndian
	{
		var bytesToWrite =
		[
			( (intToWrite >> 24) & 0xFF),
			( (intToWrite >> 16) & 0xFF),
			( (intToWrite >> 8) & 0xFF),
			( intToWrite & 0xFF )
		];

		this.writeBytes(bytesToWrite);

		return this;
	}

	writeShort(shortToWrite: number): ByteStreamBigEndian
	{
		var bytesToWrite =
		[
			( (shortToWrite >> 8) & 0xFF )
			| ((shortToWrite & 0xFF))
		];

		this.writeBytes(bytesToWrite);

		return this;
	}

	writeShortSigned(shortSignedToWrite: number): ByteStreamBigEndian
	{
		throw new Error("Not yet implemented!");
	}

	writeString(stringToWrite: string): ByteStreamBigEndian
	{
		for (var b = 0; b < stringToWrite.length; b++)
		{
			var charAsByte = stringToWrite.charCodeAt(b);
			this.writeByte(charAsByte);
		}

		return this;
	}

}
