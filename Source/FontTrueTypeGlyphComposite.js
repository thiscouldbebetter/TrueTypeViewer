
function FontTrueTypeGlyphComposite(font, childGlyphIndices, offsetInBytes)
{
	// todo
	this.font = font;
	this.childGlyphIndices = childGlyphIndices;
	this.offsetInBytes = offsetInBytes;
}
{
	FontTrueTypeGlyphComposite.prototype.childGlyphs = function()
	{
		var returnValues = [];

		var indexToLocationTable = this.font.indexToLocationTable;
		var glyphs = this.font.glyphs;

		for (var i = 0; i < this.childGlyphIndices.length; i++)
		{
			var childGlyphIndexNominal = this.childGlyphIndices[i];
			var childGlyphOffset = indexToLocationTable.offsets[childGlyphIndexNominal];
			var childGlyph = glyphs["_" + childGlyphOffset];
			returnValues.push(childGlyph);
		}
		return returnValues;
	};

	FontTrueTypeGlyphComposite.prototype.drawToDisplay = function(display, fontHeightInPixels, drawOffset)
	{
		var childGlyphs = this.childGlyphs();
		for (var i = 0; i < childGlyphs.length; i++)
		{
			var child = childGlyphs[i];
			if (child != null) // hack
			{
				child.drawToDisplay(display, fontHeightInPixels, drawOffset);
			}
		}
	};
}
