const path = require('path');
const jimp = require('jimp');
const DEBUG = true;

module.exports = class ImageCreator {
    constructor(Folder) {

        this.Folder = Folder;

    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    generic(){
        image.write(file);
    }
}