const fs = require('fs');
const path = require('path');
const request = require('request');
const download = require('image-downloader');
const jimp = require('jimp');

const DEBUG = true;

module.exports = class ImageFinder {
    /**
     * Initializes an ImageFinder instance
     * @param {object} config Config array
     * @param {string} folder Folder
     */

    constructor(config, folder = 'nothing') {

        this.Config = config || {};

        if (!this.Config.Folder) {
            this.Config.Folder = folder;
        };

        this.Path = path.join(this.Config.Folder, 'images');

        if (!fs.existsSync(this.Path)) {
            fs.mkdirSync(this.Path);
        }
    }

    debug(text) {
        if (DEBUG) console.log('Image Finder: ' + text);
    }

    queryImages(query) {
        return new Promise((success, error) => {
            let requestOptions = {
                encoding: 'utf8',
                json: true,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                },
                uri: 'https://api.qwant.com/api/search/images?count=5&t=images&safesearch=1&locale=fr_FR&uiv=%204&q=' + encodeURI(query)
            };
            request(requestOptions, function (err, _, body) {
                if (err) {
                    console.error('ERROR: ' + err);
                    success(null);
                } else {
                    const items = body.data.result.items || null;
                    success(items);
                };
            })
        });
    }

    imageProcess(index, array) {
        const self = this;
        self.debug('Starting..')
        return new Promise((resolve, reject) => {
            const link = array[index].media;
            if (link.indexOf('.jpg') > -1 || link.indexOf('.bmp') > -1 || link.indexOf('.png') > -1) {
                self.debug('Downloading image called ' + link + '..');

                download.image({
                    url: link,
                    dest: self.Path
                }).then(({
                    filename,
                    img
                }) => {
                    self.debug('Downloaded image called ' + filename + '..');

                    const NewFileName = self.getRandomArbitrary(0, 999999) + '.jpg';
                    const NewImgDirectory = path.join(this.Path, NewFileName);
                    const OldImgDirectory = path.join(this.Path, filename.split('\\')[filename.split('\\').length - 1]);

                    if (filename.indexOf('.jpg') > -1 || filename.indexOf('.bmp') > -1 || filename.indexOf('.png') > -1) {
                        setTimeout(function () {
                            jimp.loadFont(jimp.FONT_SANS_64_BLACK).then(font => {
                                jimp.read(OldImgDirectory).then(imagebuffer => {
                                    imagebuffer.resize(1080, 720).blur(1).flip(true, false).print(font, 2, 2, self.Config.Name).write(NewImgDirectory);
                                    self.debug('Saved image ' + filename + ' through: ' + NewImgDirectory);
                                    resolve({
                                        path: NewImgDirectory,
                                        name: NewFileName
                                    });
                                }).catch((err) => {
                                    self.debug('Cannot read image buffer: ' + err)
                                    resolve(null);
                                });
                            });
                        }, 2000);
                    } else {
                        resolve(null);
                    };
                }).catch((err) => {
                    self.debug('Download failed: ' + err);
                    resolve(null);
                });
            } else {
                resolve(null);
            };
        });
    }

    getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    searchImage(text) {
        const self = this;
        return new Promise((success) => {
            self.queryImages(text).then((returnedImages) => {
                self.debug('Querying images with term: ' + text);

                if (returnedImages) {

                    self.debug('Processing ' + returnedImages.length + ' results...');

                    let ImgToProcess = [];

                    for (let i = 0; i < returnedImages.length; i++) {
                        ImgToProcess.push(self.imageProcess(i, returnedImages));
                    };

                    Promise.all(ImgToProcess).then((values) => {
                        success(values);
                    });
                };
            });
        });
    }

    ignore(promise) {
        return promise.catch(e => undefined);
    }

    searchImages(title) {
        const self = this;
        return new Promise((success) => {

            self.debug('Trying queries to find results...');

            const searchterm = title.split(' ');
            const TermsToSearchFor = [self.searchImage(title), self.searchImage(searchterm[0]), self.searchImage(searchterm[1])];

            Promise.all(TermsToSearchFor.map(p => self.ignore(p))).then((values) => {

                let result = [];

                for (let i = 0; i < values.length; i++) {
                    for (let j = 0; j < values[i].length; j++) {
                        result.push(values[i][j]);
                    };
                };

                result = result.filter(v => v != null);

                self.debug('Found '+result.length+' images ready to be used.');

                success(result);
            });

        });
    };

};