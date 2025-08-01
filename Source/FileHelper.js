"use strict";
class FileHelper {
    static readBytesFromFile(file, callback) {
        var fileReader = new FileReader();
        fileReader.onloadend = (fileLoadedEvent) => {
            if (fileLoadedEvent.target.readyState == FileReader.DONE) {
                var bytesFromFile = fileLoadedEvent.target.result;
                callback(bytesFromFile);
            }
        };
        fileReader.readAsBinaryString(file);
    }
    ;
}
