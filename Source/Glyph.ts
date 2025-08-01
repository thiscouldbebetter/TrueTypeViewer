
interface Glyph
{
	drawToDisplay
	(
		display: Display,
		fontHeightInPixels: number,
		font: FontTrueType,
		offsetForBaseLines: Coords,
		drawOffset: Coords
	): void;

	fromByteStream
	(
		reader: ByteStreamBigEndian,
		offsetInBytes: number,
		numberOfContours: number,
		minAndMax: Coords[]
	): Glyph;

	offsetInBytes: number;

	toStringJson(): string;
}

class GlyphSimple implements Glyph
{
	minAndMax: Coords[];
	instructionsAsBytes: number[];
	offsetInBytes: number;
	contours: GlyphContour[];

	_startPoint: Coords;
	_curveControlPoint: Coords;
	_endPoint: Coords;

	constructor
	(
		minAndMax: Coords[],
		instructionsAsBytes: number[],
		offsetInBytes: number,
		contours: GlyphContour[]
	)
	{
		this.minAndMax = minAndMax;
		this.instructionsAsBytes = instructionsAsBytes;
		this.offsetInBytes = offsetInBytes;
		this.contours = contours;

		this._startPoint = new Coords(0, 0);
		this._curveControlPoint = new Coords(0, 0);
		this._endPoint = new Coords(0, 0);
	}

	// constants

	static PointsPerInch = 72;
	static DimensionInFUnits = 2048;

	// mstatic 

	static tableFromBytes(reader: ByteStreamBigEndian, length: number): Glyph[]
	{
		var glyphs: Glyph[] = [];

		var byteIndexOfTable = reader.byteIndexCurrent;
		var bytesForContoursMinMax = 10;
		var glyphOffsetBase = byteIndexOfTable + bytesForContoursMinMax;
		var byteIndexOfTableEnd = byteIndexOfTable + length;

		while (reader.byteIndexCurrent < byteIndexOfTableEnd)
		{
			// header
			var numberOfContours = reader.readShortSigned();
			if (numberOfContours == 0)
			{
				continue;
			}

			var min = new Coords
			(
				reader.readShortSigned(),
				reader.readShortSigned()
			);
			var max = new Coords
			(
				reader.readShortSigned(),
				reader.readShortSigned()
			);
			var minAndMax = [min, max];

			var glyph : Glyph;
			var offsetInBytes = reader.byteIndexCurrent - glyphOffsetBase;
			var isGlyphSimpleNotComposite = (numberOfContours >= 0);
			if (isGlyphSimpleNotComposite)
			{
				glyph = new GlyphSimple(null, null, null, null);
				glyph.fromByteStream
				(
					reader,
					offsetInBytes,
					numberOfContours,
					minAndMax
				);
			}
			else
			{
				glyph = new GlyphComposite(null, null);
				glyph.fromByteStream
				(
					reader,
					offsetInBytes,
					null, null
				);
			}

			// Should we align on 16 or 32 bits?
			// If 32, impact.ttf fails to parse correctly.
			// If 16, the intentionally-simple thiscouldbebetter 3x5 font fails.
			// With no alignment, neither works.
			reader.align16Bit();
			//reader.align32Bit();

			glyphs.push(glyph);
		}

		return glyphs;
	}

	drawToDisplay
	(
		display: Display,
		fontHeightInPixels: number,
		font: FontTrueType,
		offsetForBaseLines: Coords,
		drawOffset: Coords
	): void
	{
		var fUnitsPerPixel = GlyphSimple.DimensionInFUnits / fontHeightInPixels;

		var startPoint = this._startPoint;
		var curveControlPoint = this._curveControlPoint;
		var endPoint = this._endPoint;

		var colorFore = "Black";

		var contours = this.contours;
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

				startPoint.overwriteWith
				(
					segment.startPoint
				).divideScalar
				(
					fUnitsPerPixel
				).add
				(
					offsetForBaseLines
				);
				startPoint.y = fontHeightInPixels - startPoint.y;
				startPoint.add
				(
					drawOffset
				);

				endPoint.overwriteWith
				(
					segmentNext.startPoint
				).divideScalar
				(
					fUnitsPerPixel
				).add
				(
					offsetForBaseLines
				);
				endPoint.y = fontHeightInPixels - endPoint.y;
				endPoint.add
				(
					drawOffset
				);

				if (segment.curveControlPoint == null)
				{
					display.drawLine(startPoint, endPoint, colorFore);
				}
				else
				{
					curveControlPoint.overwriteWith
					(
						segment.curveControlPoint
					).divideScalar
					(
						fUnitsPerPixel
					).add
					(
						offsetForBaseLines
					);
					curveControlPoint.y = fontHeightInPixels - curveControlPoint.y;
					curveControlPoint.add
					(
						drawOffset
					);

					display.drawCurve
					(
						startPoint, curveControlPoint, endPoint, colorFore
					);
				}
			}
		}
	}

	// file

	fromByteStream
	(
		reader: ByteStreamBigEndian,
		offsetInBytes: number,
		numberOfContours: number,
		minAndMax: Coords[]
	): Glyph
	{
		var endPointsOfContours: number[] = [];
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

			var flags = GlyphContourFlags.fromByte(flagsAsByte);

			flags.timesToRepeat = (flags.repeats ? reader.readByte() : 0);

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
		this.instructionsAsBytes = instructionsAsBytes;
		this.offsetInBytes = offsetInBytes;
		this.contours = this.fromByteStream_ContoursBuild
		(
			endPointsOfContours, flagSets, coordinates
		);

		return this;
	}

	fromByteStream_ContoursBuild
	(
		endPointsOfContours: number[],
		flagSets: any[],
		coordinates: Coords[]
	): GlyphContour[]
	{
		// Convert sets of points on the contours of the glyph
		// into sets of line segments and/or curves,
		// and build contours from those sets of segments and curves.

		var contourPointSets = this.fromByteStream_ContoursBuild_PointSetsBuild
		(
			endPointsOfContours, flagSets, coordinates
		);

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
					var segment = new GlyphContourSegment
					(
						contourPoint.position,
						(contourPointNext.isOnContour ? null : contourPointNext.position)
					);

					contourSegments.push(segment);
				}
				else if (contourPointNext.isOnContour)
				{
					// Do nothing.
				}
				else
				{
					var midpointBetweenContourPointAndNext = contourPoint.position.clone().add
					(
						contourPointNext.position
					).divideScalar(2);

					var segment = new GlyphContourSegment
					(
						midpointBetweenContourPointAndNext,
						contourPointNext.position
					);

					contourSegments.push(segment);
				}
			}

			var contour = new GlyphContour(contourSegments);
			contours.push(contour);
		}

		return contours;
	}

	fromByteStream_ContoursBuild_PointSetsBuild
	(
		endPointsOfContours: number[],
		flagSets: any[],
		coordinates: Coords[]
	): GlyphContourPoint[][]
	{
		// Convert the flags and coordinates
		// into sets of points on the contours of the glyph.

		var contourPointSets = [];

		var contourIndex = 0;
		var coordinateIndex = 0;
		var endPointOfContourCurrent = endPointsOfContours[contourIndex];

		var coordinateInFUnits = new Coords(0, 0);
		var coordinateInPixels = new Coords(0, 0);
		var coordinateInPixelsPrev = new Coords(0, 0);

		var numberOfContours = endPointsOfContours.length;
		// var curveControlPoints: Coords[] = [];

		var contourPoints: GlyphContourPoint[] = [];

		for (var f = 0; f < flagSets.length; f++)
		{
			var flags = flagSets[f];
			for (var r = 0; r <= flags.timesToRepeat; r++)
			{
				var coordinateInFUnits = coordinates[coordinateIndex];

				coordinateInPixelsPrev.overwriteWith(coordinateInPixels);
				coordinateInPixels.overwriteWith
				(
					coordinateInFUnits
				);

				var contourPoint = new GlyphContourPoint
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
							endPointsOfContours[contourIndex];
					}
				}

				coordinateIndex++;
			}
		}

		return contourPointSets;
	}

	// file - write

	toBytes(): number[]
	{
		// todo

		var flagSets: GlyphContourFlags[] = []; // todo

		var writer = new ByteStreamBigEndian([]);

		for (var c = 0; c < this.contours.length; c++)
		{
			var contour = this.contours[c];
			var endPointOfContour = -1; // todo
			writer.writeShort(endPointOfContour);
		}

		var totalLengthOfInstructionsInBytes = this.instructionsAsBytes.length;
		writer.writeShort(totalLengthOfInstructionsInBytes);
		writer.writeBytes(this.instructionsAsBytes);

		for (var c = 0; c < this.contours.length; c++)
		{
			var contour = this.contours[c];
			var contourSegments = contour.segments;
			for (var s = 0; s < contourSegments.length; s++)
			{
				// var segment = contourSegments[s];
				// var point = segment.startPoint; // todo

				var flags = new GlyphContourFlags(null, null, null, null, null, null, null); // todo
				var flagsAsByte = flags.toByte();
				writer.writeByte(flagsAsByte);

				writer.writeByte(flags.timesToRepeat);
			}
		}

		var coordinates = [];

		var xPrev = 0;
		for (var f = 0; f < flagSets.length; f++)
		{
			var flags = flagSets[f];
			for (var r = 0; r <= flags.timesToRepeat; r++)
			{
				var x = 0;
				if (flags.xIsShortVector)
				{
					x = -1; // todo
					var sign = (flags.xIsSameOrSignIfShort ? 1 : -1);
					x *= sign;
					x -= xPrev;
					writer.writeByte(x);
				}
				else if (flags.xIsSameOrSignIfShort)
				{
					x = xPrev;
				}
				else
				{
					x -= xPrev;
					writer.writeShortSigned(x);
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
					var sign = (flags.yIsSameOrSignIfShort ? 1 : -1);
					y -= yPrev;
					y *= sign;
					writer.writeByte(y);
				}
				else if (flags.yIsSameOrSignIfShort)
				{
					y = yPrev;
				}
				else
				{
					y -= yPrev;
					writer.writeShortSigned(y);
				}

				coordinate.y = y;
				yPrev = y;

				coordinateIndex++;

			} // end for r

		} // end for f

		this.contours = this.toBytes_Contours
		(
			endPointOfContour, flagSets, coordinates
		);

		var returnValue = writer.bytes;

		return returnValue;
	}

	toBytes_Contours
	(
		endPointOfContour: number, flagSets: GlyphContourFlags[], coordinates: Coords[]
	): GlyphContour[]
	{
		throw new Error("Not yet implemented!");
	}

	// json

	toStringJson(): string
	{
		var instructionsAsBytes = this.instructionsAsBytes;
		delete this.instructionsAsBytes;
		var instructionsAsHexadecimalString =
			instructionsAsBytes.map
			(
				x => x.toString(16).padStart(2, "0")
			).join("");

		var thisAsObject =
		{
			"minAndMax": this.minAndMax,
			"instructionsAsBytes": instructionsAsHexadecimalString,
			"offsetInBytes": this.offsetInBytes,
			"contours": this.contours
		}

		var returnValue = JSON.stringify(thisAsObject, null, 4);

		this.instructionsAsBytes = instructionsAsBytes;
		return returnValue;
	}

}
