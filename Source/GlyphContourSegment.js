"use strict";
class GlyphContourSegment {
    constructor(startPoint, curveControlPoint) {
        this.startPoint = startPoint;
        this.curveControlPoint = curveControlPoint;
    }
    clone() {
        return new GlyphContourSegment(this.startPoint.clone(), this.curveControlPoint == null ? null : this.curveControlPoint.clone());
    }
    ;
}
