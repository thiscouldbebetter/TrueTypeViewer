"use strict";
class Coords {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    clone() {
        return new Coords(this.x, this.y);
    }
    divideScalar(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }
    multiply(other) {
        this.x *= other.x;
        this.y *= other.y;
        return this;
    }
    multiplyScalar(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }
    overwriteWith(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }
}
