
function FontTrueTypeCmapEncodingTable
(
	platformID,
	encodingID,
	offsetInBytes
)
{
	this.platformID = platformID;
	this.encodingID = encodingID; 
	this.offsetInBytes = offsetInBytes;

	// Unicode BMP for Windows : PlatformID = 3, EncodingID = 1 
}
