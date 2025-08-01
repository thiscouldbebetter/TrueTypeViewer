"use strict";
class TableDefn {
    constructor(tableTypeTag, checkSum, offsetInBytes, length) {
        this.tableTypeTag = tableTypeTag;
        this.checkSum = checkSum;
        this.offsetInBytes = offsetInBytes;
        this.length = length;
    }
}
