const fs = require('fs');
const path = require('path');
const request = require('request');
const download = require('image-downloader');
const jimp = require('jimp');

const DEBUG = true;

module.exports = class ImageFinder {
    /**
     * Initializes a MagazineBrowser instance (only used by Bot.js)
     * @param {string} directory Root directory
     * @param {string} folder Magazines folder
     * @param {string} config Config array
     * @param {string} magazines Magazines
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
        return new Promise((success, error) => {
            const link = array[index].media;
            if (link.indexOf('.jpg') > -1 || link.indexOf('.bmp') > -1 || link.indexOf('.png') > -1) {
                self.debug('Downloading image called ' + link + '..');
                const options = {
                    url: link,
                    dest: self.Path
                };
                download.image(options).then(({
                    filename,
                    image
                }) => {
                    self.debug('Downloaded image called ' + filename + '..');
                    const NewFileName = self.getRandomArbitrary(0, 999999) + '.jpg';
                    const NewImgDirectory = path.join(this.Path, NewFileName);
                    const OldImgDirectory = path.join(this.Path, filename.split('\\')[filename.split('\\').length - 1]);

                    if (filename.indexOf('.jpg') > -1 || filename.indexOf('.bmp') > -1 || filename.indexOf('.png') > -1) {
                        setTimeout(function () {
                            jimp.loadFont(jimp.FONT_SANS_64_BLACK).then(function (font) {
                                jimp.read(OldImgDirectory).then( function(imagebuffer) {
                                    imagebuffer.resize(1080, 720).blur(1).flip(true, false).print(font, 2, 2, self.Config.Name).write(NewImgDirectory);

                                    self.debug('Saved image ' + filename + ' through: ' + NewImgDirectory);
                                    success({
                                        path: NewImgDirectory,
                                        name: NewFileName
                                    });
                                }).catch((err) => {
                                    success(null);
                                });
                            });
                        }, 2000);
                    };
                }).catch((err) => {
                    success(null);
                });
            } else {
                success(null);
            };
        });
    }

    getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    searchImages(title) {
        const self = this;
        return new Promise((success, reset) => {
            self.debug('Trying queries to find results...');
            const searchterm = title.split(":");
            let ImgToProcess = [];
            self.queryImages(title).then((returnimg) => {
                self.debug('Query on title: ' + title);
                if (returnimg.length > 0) {
                    self.debug('Processing relevant results');
                    for (let i = 0; i < returnimg.length; i++) {
                        ImgToProcess.push(self.imageProcess(i, returnimg));
                    };
                    Promise.all(ImgToProcess).then((values) => {
                        console.log(values)
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
                                        ImgToProcess.push(self.imageProcess(i, returnimg3));
                                    }
                                    Promise.all(ImgToProcess).then((values) => {
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