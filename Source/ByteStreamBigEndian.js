
// classes

function ByteStreamBigEndian(bytes)
{
	this.bytes = bytes;

	this.numberOfBytesTotal = this.bytes.length;
	this.byteIndexCurrent = 0;
}

{
	ByteStreamBigEndian.prototype.align16Bit = function()
	{
		while (this.byteIndexCurrent % 2 != 0)
		{
			this.readByte();
		}
	};

	ByteStreamBigEndian.prototype.align32Bit = function()
	{
		while (this.byteIndexCurrent % 4 != 0)
		{
			this.readByte();
		}
	};

	ByteStreamBigEndian.prototype.hasMoreBytes = function()
	{
		return (this.byteIndexCurrent < this.numberOfBytesTotal);
	};

	ByteStreamBigEndian.prototype.peekBytes = function(numberOfBytesToRead)
	{
		var returnValue = [];

		for (var b = 0; b < numberOfBytesToRead; b++)
		{
			returnValue[b] = this.bytes.charCodeAt(this.byteIndexCurrent + b);
		}

		return returnValue;
	};

	ByteStreamBigEndian.prototype.readBytes = function(numberOfBytesToRead)
	{
		var returnValue = [];

		for (var b = 0; b < numberOfBytesToRead; b++)
		{
			returnValue[b] = this.readByte();
		}

		return returnValue;
	};

	ByteStreamBigEndian.prototype.readByte = function()
	{
		var returnValue = this.bytes.charCodeAt(this.byteIndexCurrent);

		this.byteIndexCurrent++;

		return returnValue;
	};

	ByteStreamBigEndian.prototype.readByteSigned = function()
	{
		var returnValue = this.readByte();

		var maxValue = 128; // hack
		if (returnValue >= maxValue)
		{
			returnValue -= maxValue + maxValue;
		}

		return returnValue;
	};

	ByteStreamBigEndian.prototype.readFixedPoint16_16 = function()
	{
		var valueIntegral = this.readShort();
		var valueFractional = this.readShort();

		var valueAsString = "" + valueIntegral + "." + valueFractional;

		var returnValue = parseFloat(valueAsString);

		return returnValue;
	};

	ByteStreamBigEndian.prototype.readInt = function()
	{
		var returnValue =
		(
			((this.readByte() & 0xFF) << 24)
			| ((this.readByte() & 0xFF) << 16 )
			| ((this.readByte() & 0xFF) << 8 )
			| ((this.readByte() & 0xFF) )
		);

		return returnValue;
	};

	ByteStreamBigEndian.prototype.readShort = function()
	{
		var returnValue =
		(
			((this.readByte() & 0xFF) << 8)
			| ((this.readByte() & 0xFF))
		);

		return returnValue;
	};

	ByteStreamBigEndian.prototype.readShortSigned = function()
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
	};

	ByteStreamBigEndian.prototype.readString = function(numberOfBytesToRead)
	{
		var returnValue = "";

		for (var b = 0; b < numberOfBytesToRead; b++)
		{
			var charAsByte = this.readByte();
			returnValue += String.fromCharCode(charAsByte);
		}

		return returnValue;
	};
}
