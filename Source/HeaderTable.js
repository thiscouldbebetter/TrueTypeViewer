
function HeaderTable
(
	tableVersion,
	fontRevision,
	checkSumAdjustment,
	magicNumber,
	flags,
	unitsPerEm,
	timeCreated,
	timeModified,
	xMin,
	yMin,
	xMax,
	yMax,
	macStyle,
	lowestRecPPEM,
	fontDirectionHint,
	indexToLocFormat,
	glyphDataFormat
)
{
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
