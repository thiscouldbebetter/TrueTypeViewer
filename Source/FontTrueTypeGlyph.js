
function FontTrueTypeGlyph
(
	minAndMax,
	endPointsOfContours,
	instructionsAsBytes,
	flagSets,
	coordinates,
	offsetInBytes
)
{
	this.minAndMax = minAndMax;
	this.endPointsOfContours = endPointsOfContours;
	this.instructionsAsBytes = instructionsAsBytes;
	this.flagSets = flagSets;
	this.coordinates = coordinates;
	this.offsetInBytes = offsetInBytes;
}

{
	// constants

	FontTrueTypeGlyph.PointsPerInch = 72;
	FontTrueTypeGlyph.DimensionInFUnits = 2048;

	// methods

	FontTrueTypeGlyph.prototype.drawToDisplay = function(display, fontHeightInPixels, font, offsetForBaseLines, drawOffset)
	{
		var fUnitsPerPixel = FontTrueTypeGlyph.DimensionInFUnits / fontHeightInPixels;

		var contourPointSets = this.drawToDisplay_ContourPointSetsBuild
		(
			fUnitsPerPixel, offsetForBaseLines, fontHeightInPixels
		);

		var contours = this.drawToDisplay_ContoursBuild
		(
			contourPointSets
		);

		this.drawToDisplay_ContoursDraw(display, contours, drawOffset);
	};

	FontTrueTypeGlyph.prototype.drawToDisplay_ContourPointSetsBuild = function
	(
		fUnitsPerPixel, offsetForBaseLines, fontHeightInPixels
	)
	{
		// Convert the flags and coordinates
		// into sets of points on the contours of the glyph.

		var contourPointSets = [];

		var contourIndex = 0;
		var coordinateIndex = 0;
		var endPointOfContourCurrent = this.endPointsOfContours[contourIndex];

		var coordinateInFUnits = new Coords(0, 0);
		var coordinateInPixels = new Coords(0, 0);
		var coordinateInPixelsPrev = new Coords(0, 0);

		var numberOfContours = this.endPointsOfContours.length;
		var curveControlPoints = [];

		var contourPoints = [];

		for (var f = 0; f < this.flagSets.length; f++)
		{
			var flags = this.flagSets[f];
			for (var r = 0; r <= flags.timesToRepeat; r++)
			{
				var coordinateInFUnits = this.coordinates[coordinateIndex];

				coordinateInPixelsPrev.overwriteWith(coordinateInPixels);
				coordinateInPixels.overwriteWith
				(
					coordinateInFUnits
				).divideScalar
				(
					fUnitsPerPixel
				).add
				(
					offsetForBaseLines
				);

				coordinateInPixels.y =
					fontHeightInPixels - coordinateInPixels.y;

				var contourPoint = new FontTrueTypeGlyphContourPoint
				(
					coordinateInPixels.clone(),
					flags.isOnContour
				);

				contourPoints.push(contourPoint);

				if (coordinateIndex == endPointOfContourCurrent)
				{
					contourPointSets.push(contourPoints);
					contourPoints = [];
					contourIndex++;
					if (contourIndex < numberOfContours)
					{
						endPointOfContourCurrent =
							this.endPointsOfContours[contourIndex];
					}
				}

				coordinateIndex++;
			}
		}

		return contourPointSets;
	};

	FontTrueTypeGlyph.prototype.drawToDisplay_ContoursBuild = function(contourPointSets)
	{
		// Convert sets of points on the contours of the glyph
		// into sets of line segments and/or curves,
		// and build contours from those sets of segments and curves.

		var contours = [];

		for (var c = 0; c < contourPointSets.length; c++)
		{
			var contourPoints = contourPointSets[c];
			var contourSegments = [];

			for (var p = 0; p < contourPoints.length; p++)
			{
				var pNext = p + 1;
				if (pNext >= contourPoints.length)
				{
					pNext = 0;
				}

				var contourPoint = contourPoints[p];
				var contourPointNext = contourPoints[pNext];

				if (contourPoint.isOnContour)
				{
					if (contourPointNext.isOnContour)
					{
						var segment = new FontTrueTypeGlyphContourSegment
						(
							contourPoint.position, null
						);

						contourSegments.push(segment);
					}
					else
					{
						var segment = new FontTrueTypeGlyphContourSegment
						(
							contourPoint.position,
							contourPointNext.position
						);

						contourSegments.push(segment);
					}
				}
				else if (contourPointNext.isOnContour)
				{
					// do nothing
				}
				else
				{
					var midpointBetweenContourPointAndNext = contourPoint.position.clone().add
					(
						contourPointNext.position
					).divideScalar(2);

					var segment = new FontTrueTypeGlyphContourSegment
					(
						midpointBetweenContourPointAndNext,
						contourPointNext.position
					);

					contourSegments.push(segment);
				}
			}

			var contour = new FontTrueTypeGlyphContour(contourSegments);
			contours.push(contour);
		}

		return contours;
	};

	FontTrueTypeGlyph.prototype.drawToDisplay_ContoursDraw = function(display, contours, drawOffset)
	{
		// Render the contours of the glyph.

		for (var c = 0; c < contours.length; c++)
		{
			var contour = contours[c];
			var contourSegments = contour.segments;

			for (var s = 0; s < contourSegments.length; s++)
			{
				var sNext = s + 1;
				if (sNext >= contourSegments.length)
				{
					sNext = 0;
				}

				var segment = contourSegments[s];
				var segmentNext = contourSegments[sNext];

				var startPoint = segment.startPoint.clone().add(drawOffset);
				var curveControlPoint = segment.curveControlPoint;
				var endPoint = segmentNext.startPoint.clone().add(drawOffset);

				if (curveControlPoint == null)
				{
					display.drawLine
					(
						startPoint,
						endPoint
					);
				}
				else
				{
					display.drawCurve
					(
						startPoint,
						curveControlPoint.clone().add(drawOffset),
						endPoint
					);
				}
			}
		}
	};

	// file

	FontTrueTypeGlyph.prototype.fromByteStream = function(reader, numberOfContours, minAndMax, offsetInBytes)
	{
		var endPointsOfContours = [];
		for (var c = 0; c < numberOfContours; c++)
		{
			var endPointOfContour = reader.readShort();
			endPointsOfContours.push(endPointOfContour);
		}

		var totalLengthOfInstructionsInBytes = reader.readShort();
		var instructionsAsBytes = reader.readBytes
		(
			totalLengthOfInstructionsInBytes
		);

		var numberOfPoints =
			endPointsOfContours[endPointsOfContours.length - 1]
			+ 1;

		var flagSets = [];
		var numberOfPointsSoFar = 0;
		while (numberOfPointsSoFar < numberOfPoints)
		{
			var flagsAsByte = reader.readByte();

			var flags = FontTrueTypeGlyphContourFlags.fromByte(flagsAsByte);

			flags.timesToRepeat = (flags.timesToRepeat ? reader.readByte() : 0);

			numberOfPointsSoFar += (1 + flags.timesToRepeat);

			flagSets.push(flags);
		}

		var coordinates = [];

		var xPrev = 0;
		for (var f = 0; f < flagSets.length; f++)
		{
			var flags = flagSets[f];
			for (var r = 0; r <= flags.timesToRepeat; r++)
			{
				var x;
				if (flags.xIsShortVector)
				{
					x = reader.readByte();
					var sign = (flags.xIsSameOrSignIfShort ? 1 : -1);
					x *= sign;
					x += xPrev;
				}
				else if (flags.xIsSameOrSignIfShort)
				{
					x = xPrev;
				}
				else
				{
					x = reader.readShortSigned();
					x += xPrev;
				}

				var coordinate = new Coords(x, 0);
				coordinates.push(coordinate);
				xPrev = x;

			} // end for r

		} // end for f

		var yPrev = 0;
		var coordinateIndex = 0;
		for (var f = 0; f < flagSets.length; f++)
		{
			var flags = flagSets[f];
			for (var r = 0; r <= flags.timesToRepeat; r++)
			{
				var coordinate = coordinates[coordinateIndex];

				var y;
				if (flags.yIsShortVector)
				{
					y = reader.readByte();
					var sign = (flags.yIsSameOrSignIfShort ? 1 : -1);
					y *= sign;
					y += yPrev;
				}
				else if (flags.yIsSameOrSignIfShort)
				{
					y = yPrev;
				}
				else
				{
					y = reader.readShortSigned();
					y += yPrev;
				}

				coordinate.y = y;
				yPrev = y;

				coordinateIndex++;

			} // end for r

		} // end for f

		this.minAndMax = minAndMax;
		this.endPointsOfContours = endPointsOfContours;
		this.instructionsAsBytes = instructionsAsBytes;
		this.flagSets = flagSets;
		this.coordinates = coordinates;
		this.offsetInBytes = offsetInBytes;

		return this;
	};
}
