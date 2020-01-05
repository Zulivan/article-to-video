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
     * @param {string} directory Magazines folder
     * @param {string} folder Folder
     */

    constructor(config, directory, folder = 'nothing') {

        this.Config = config || {};
        this.Config.Directory = directory;

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
        const self = this;
        return new Promise((success, error) => {
            let requestOptions = {
                encoding: 'utf8',
                json: true,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                },
                uri: 'https://api.qwant.com/api/search/images?count=15&t=images&safesearch=1&locale=fr_FR&uiv=%204&q=' + encodeURI(query)
            };
            request(requestOptions, function (err, _, body) {
                if (err) {
                    console.error('ERROR; ' + err);
                    success([]);
                } else {
                    const items = body.data.result.items || [];
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
                    filename,img
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
                                    console.log('Cannot read image buffer: ' + err)
                                    resolve(null);
                                });
                            });
                        }, 2000);
                    } else {
                        resolve(null);
                    };
                }).catch((err) => {
                    console.log('Download failed: ' + err);
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

    searchImages(title) {
        const self = this;
        return new Promise((success) => {
            self.debug('Trying queries to find results...');
            const searchterm = title.split(":");
            let ImgToProcess = [];
            self.queryImages(title).then((returnimg) => {
                self.debug('Query on title: ' + title);
                if (returnimg.length > 0) {
                    self.debug('Processing ' + returnimg.length + ' results...');
                    for (let i = 0; i < returnimg.length; i++) {
                        ImgToProcess.push(self.imageProcess(i, returnimg));
                    };
                    Promise.all(ImgToProcess).then((values) => {
                        success(values);
                    });
                } else if (searchterm.length > 0) {
                    self.debug('No image found previously. Querying on ' + searchterm[0]);
                    self.queryImages(searchterm[0]).then((returnimg2) => {
                        if (returnimg2.length > 0) {
                            for (let i = 0; i < returnimg2.length; i++) {
                                ImgToProcess.push(self.imageProcess(i, returnimg2));
                            }
                            Promise.all(ImgToProcess).then((values) => {
                                success(values);
                            });
                        } else if (searchterm.length > 1) {
                            self.debug('No image found previously. Querying on ' + searchterm[1]);
                            self.queryImages(searchterm[1]).then((returnimg3) => {
                                if (returnimg3.length > 0) {
                                    for (let i = 0; i < returnimg3.length; i++) {
                                        ImgToProcess.push(self.then(i, returnimg3));
                                    }
                                    Promise.all(ImgToProcess).finally((values) => {
                                        success(values);
                                    });
                                } else {
                                    success(null);
                                }
                            })
                        } else {
                            success(null);
                        }
                    })
                } else {
                    success(null);
                }
            });
        });
    };

};