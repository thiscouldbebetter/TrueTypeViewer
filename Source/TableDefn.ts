
class TableDefn
{
	tableTypeTag: string;
	checkSum: number;
	offsetInBytes: number;
	length: number;

	constructor
	(
		tableTypeTag: string,
		checkSum: number,
		offsetInBytes: number,
		length: number
	)
	{
		this.tableTypeTag = tableTypeTag;
		this.checkSum = checkSum;
		this.offsetInBytes = offsetInBytes;
		this.length = length;
	}
}
