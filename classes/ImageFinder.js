const fs = require('fs');
const path = require('path');
const request = require('request');
const download = require('image-downloader');
const jimp = require('jimp');

const DEBUG = true;

module.exports = class ImageFinder {
    /**
     * Initializes an ImageFinder instance
     * @param {string} folder Folder
     * @param {string} watermak Text to place over all images
     */

    constructor(folder = 'setup_a_folder', watermak) {

        this.Config = {
            Folder: folder,
            Name: watermak
        }

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
            const requestOptions = {
                encoding: 'utf8',
                json: true,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                },
                uri: 'https://api.qwant.com/api/search/images?count=15&t=images&safesearch=1&locale=fr_FR&uiv=%204&q=' + encodeURI(query)
            };
            request(requestOptions, function (err, _, body) {
                if (body['data'] && body.data['result'] && body.data.result['items']) {
                    const items = body.data.result.items || [];
                    success(items);
                } else {
                    let errOutput = 'none';
                    if (body) {
                        errOutput = body;
                    } else {
                        errOutput = err;
                    }
                    console.error('ERROR: ' + errOutput);
                    success(null);
                };
            });
        });
    }

    imageProcess(index, array) {
        const self = this;

        return new Promise((resolve, reject) => {
            const link = array[index].media;
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
        });
    }

    getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    searchImage(text) {
        const self = this;
        return new Promise((success) => {
            self.debug('Querying images with term: ' + text);
            self.queryImages(text).then((returnedImages) => {

                if (returnedImages) {
                    self.debug('Processing ' + returnedImages.length + ' results...');

                    let actualImages = [];

                    for (let index = 0; index < returnedImages.length; index++) {
                        const link = returnedImages[index].media;
                        if (link.indexOf('.jpg') > -1 || link.indexOf('.bmp') > -1 || link.indexOf('.png') > -1) {
                            actualImages.push(returnedImages[index]);
                        }
                    }
                    self.debug(actualImages.length + ' actual images have been found...');

                    let ImgToProcess = [];

                    if (actualImages.length < 2) {
                        self.debug('It turns out it is not enough...');
                        const searchterm = text.split(' ');
                        self.queryImages(searchterm[0]).then((NewreturnedImages) => {

                            for (let index = 0; index < NewreturnedImages.length; index++) {
                                const link = NewreturnedImages[index].media;
                                if (link.indexOf('.jpg') > -1 || link.indexOf('.bmp') > -1 || link.indexOf('.png') > -1) {
                                    actualImages.push(NewreturnedImages[index]);
                                }
                            };

                            self.debug(actualImages.length + ' actual images have been found...');

                            for (let i = 0; i < actualImages.length; i++) {
                                ImgToProcess.push(self.imageProcess(i, actualImages));
                            };
        
                            Promise.all(ImgToProcess).then((values) => {
                                success(values);
                            });
                        });
                    }else{

                        for (let i = 0; i < actualImages.length; i++) {
                            ImgToProcess.push(self.imageProcess(i, actualImages));
                        };
    
                        Promise.all(ImgToProcess).then((values) => {
                            success(values);
                        });
                    }
                };
            });
        });
    }

    ignore(promise) {
        return promise.catch(e => undefined);
    }

    /**
     * Search images using Qwant API
     * @param {array} queries Queries to run
     */

    searchImages(queries) {
        const self = this;

        return new Promise((success, error) => {

            self.debug('Trying queries to find results...');

            let TermsToSearchFor = [];

            if (Array.isArray(queries)) {
                for (let i = 0; i < queries.length; i++) {
                    TermsToSearchFor.push(self.searchImage(queries[i]))
                };
            } else {
                TermsToSearchFor.push(self.searchImage(queries))
            }

            Promise.all(TermsToSearchFor.map(p => self.ignore(p))).then((values) => {

                let result = [];

                for (let i = 0; i < values.length; i++) {
                    for (let j = 0; j < values[i].length; j++) {
                        result.push(values[i][j]);
                    };
                };

                result = result.filter(v => v != null);

                self.debug('Found ' + result.length + ' images ready to be used.');

                if (result.length > 0) {
                    success(result);
                } else {
                    error('no results were found');
                }
            });
        });
    };
};