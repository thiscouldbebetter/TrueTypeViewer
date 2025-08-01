"use strict";
class ByteStreamBigEndian {
    constructor(bytes) {
        this.bytes = bytes;
        this.numberOfBytesTotal = this.bytes.length;
        this.byteIndexCurrent = 0;
    }
    align16Bit() {
        while (this.byteIndexCurrent % 2 != 0) {
            this.readByte();
        }
        return this;
    }
    align32Bit() {
        while (this.byteIndexCurrent % 4 != 0) {
            this.readByte();
        }
        return this;
    }
    hasMoreBytes() {
        return (this.byteIndexCurrent < this.numberOfBytesTotal);
    }
    peekBytes(numberOfBytesToRead) {
        var returnValue = [];
        for (var b = 0; b < numberOfBytesToRead; b++) {
            returnValue[b] = this.bytes[this.byteIndexCurrent + b];
        }
        return returnValue;
    }
    readBytes(numberOfBytesToRead) {
        var returnValue = [];
        for (var b = 0; b < numberOfBytesToRead; b++) {
            returnValue[b] = this.readByte();
        }
        return returnValue;
    }
    readByte() {
        var returnValue = this.bytes[this.byteIndexCurrent];
        this.byteIndexCurrent++;
        return returnValue;
    }
    readByteSigned() {
        var returnValue = this.readByte();
        var maxValue = 128; // hack
        if (returnValue >= maxValue) {
            returnValue -= maxValue + maxValue;
        }
        return returnValue;
    }
    readFixedPoint16_16() {
        var valueIntegral = this.readShort();
        var valueFractional = this.readShort();
        var valueAsString = "" + valueIntegral + "." + valueFractional;
        var returnValue = parseFloat(valueAsString);
        return returnValue;
    }
    readInt() {
        var returnValue = (((this.readByte() & 0xFF) << 24)
            | ((this.readByte() & 0xFF) << 16)
            | ((this.readByte() & 0xFF) << 8)
            | ((this.readByte() & 0xFF)));
        return returnValue;
    }
    readShort() {
        var returnValue = (((this.readByte() & 0xFF) << 8)
            | ((this.readByte() & 0xFF)));
        return returnValue;
    }
    readShortSigned() {
        var returnValue = (((this.readByte() & 0xFF) << 8)
            | ((this.readByte() & 0xFF)));
        var maxValue = Math.pow(2, 15); // hack
        if (returnValue >= maxValue) {
            returnValue -= maxValue + maxValue;
        }
        return returnValue;
    }
    readString(numberOfBytesToRead) {
        var returnValue = "";
        for (var b = 0; b < numberOfBytesToRead; b++) {
            var charAsByte = this.readByte();
            returnValue += String.fromCharCode(charAsByte);
        }
        return returnValue;
    }
    writeByte(byteToWrite) {
        this.bytes[this.byteIndexCurrent] = byteToWrite;
        this.byteIndexCurrent++;
        return this;
    }
    writeBytes(bytesToWrite) {
        for (var b = 0; b < bytesToWrite.length; b++) {
            var byteToWrite = bytesToWrite[b];
            this.writeByte(byteToWrite);
        }
        return this;
    }
    writeInt(intToWrite) {
        var bytesToWrite = [
            ((intToWrite >> 24) & 0xFF),
            ((intToWrite >> 16) & 0xFF),
            ((intToWrite >> 8) & 0xFF),
            (intToWrite & 0xFF)
        ];
        this.writeBytes(bytesToWrite);
        return this;
    }
    writeShort(shortToWrite) {
        var bytesToWrite = [
            ((shortToWrite >> 8) & 0xFF)
                | ((shortToWrite & 0xFF))
        ];
        this.writeBytes(bytesToWrite);
        return this;
    }
    writeShortSigned(shortSignedToWrite) {
        throw new Error("Not yet implemented!");
    }
    writeString(stringToWrite) {
        for (var b = 0; b < stringToWrite.length; b++) {
            var charAsByte = stringToWrite.charCodeAt(b);
            this.writeByte(charAsByte);
        }
        return this;
    }
}
