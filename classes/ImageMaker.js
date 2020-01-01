const path = require('path');
const fs = require('fs');
const jimp = require('jimp');
const DEBUG = true;

module.exports = class ImageMaker {
    constructor(Config) {
        this.Config = Config;
    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    generateImages(images) {
        const self = this;
        return new Promise((success, error) => {
            let promises = [];

            for (let i = 0; i < images.length; i++) {
                promises.push(self[images[i]['type']](i, images[i]));
            };

            Promise.all(promises).then((values) => {
                values = values.filter(v => v != null);
                success(values)
            });
        });
    }

    generateThumbnail(image_name) {
        const self = this;
        const thumbnail_final_dir = path.join(self.Config.Directory, self.Config.Folder, 'images', 'final_thumbnail.png');
        return new Promise((success, error) => {
            console.log(path.join(self.Config.Directory, self.Config.Folder, 'preset', 'thumbnail.png'));
            jimp.read(path.join(self.Config.Directory, self.Config.Folder, 'preset', 'thumbnail.png')).then(overlay => {
                jimp.read(path.join(self.Config.Directory, self.Config.Folder, 'images', image_name)).then(background => {
                        background.composite(overlay, 0, 0).resize(1280, 720).quality(60).write(thumbnail_final_dir);
                        success(thumbnail_final_dir);
                    })
                    .catch(err => {
                        error('Cannnot generate thumbnail: ' + err);
                    });
            }).catch(err => {
                error('Cannot load thumbnail overlay. ' + err);
            });
        });
    }

    news(_, image) {
        const maxchars = 60;
        const self = this;

        const resourcesfolder = self.Config.Folder;
        const index = image.id;
        const sentence = image.text;
        const duration = image.duration;
        const images = image.array;

        let chars = sentence.split('');
        let currchars = 0;
        let loopsdone = 0;
        let recoveryindex = 0;
        let roundedmultiple = 1;

        return new Promise((success, error) => {
            const jsonsave = path.join(self.Config.Directory, resourcesfolder, 'images', 'image' + index + '.json');
            fs.exists(jsonsave, (exists) => {
                if (exists) {
                    self.debug('File with id ' + index + '.jpg is already done, adding its metadata to the image files to process..');
                    let output = null;
                    try {
                        output = JSON.parse(fs.readFileSync(jsonsave, 'utf8'));
                    } catch (e) {
                        error(true)
                        self.debug('JSON is corrupted, aborting...')
                    }
                    success(output);
                } else {
                    if (chars.length / maxchars - Math.floor(chars.length / maxchars) > 0) {
                        roundedmultiple = Math.floor(chars.length / maxchars) + 1;
                    } else {
                        roundedmultiple = Math.floor(chars.length / maxchars);
                    }
                    self.debug(chars.length + ' characters counted, they will be typed on ' + roundedmultiple + ' lines.');
                    let sentencet = '';

                    const randomimage = images[Math.floor(Math.random() * images.length)];
                    const blocktop = 720 - 25 * roundedmultiple - 10;

                    const directory = randomimage.path;
                    const directoryfinal = './' + resourcesfolder + '/images/image' + index + '.jpg';
                    const directorybgfinal = './' + resourcesfolder + '/images/image' + index + 'bg.jpg';

                    fs.exists('./' + resourcesfolder + '/preset/intro.png', (intro_exists) => {
                        if (index == 0 && intro_exists) {
                            jimp.read('./' + resourcesfolder + '/preset/intro.png', function (jimperr1, intro) {
                                const output = {
                                    vocal: index,
                                    values: {
                                        path: directoryfinal,
                                        loop: duration
                                    }
                                };

                                intro.write(directoryfinal);

                                fs.writeFile('./' + resourcesfolder + '/images/image' + index + '.json', JSON.stringify(output), function (errfile) {
                                    console.log('Vocal #' + index + ' has its video part!');
                                    setTimeout(function () {
                                        success(output);
                                    }, 1000);
                                });
                            });
                        } else {
                            jimp.loadFont(jimp.FONT_SANS_32_BLACK).then(function (font2) {
                                jimp.read('./' + resourcesfolder + '/preset/background.png', function (jimperr1, prebackground) {
                                    prebackground.resize(1080, 25 * roundedmultiple + 10).quality(60).write(directorybgfinal);
                                    jimp.read(directorybgfinal, function (importerror, background) {
                                        jimp.read(directory, function (jimperr, imagebuffer) {
                                            imagebuffer.composite(background, 0, blocktop)
                                            imagebuffer.quality(60);
                                            for (let i = 0; i < chars.length; i++) {
                                                currchars = currchars + 1;
                                                sentencet += chars[i];
                                                if (currchars >= maxchars) {
                                                    imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, sentencet)
                                                    currchars = 0;
                                                    loopsdone = loopsdone + 1;
                                                    sentencet = "";
                                                    recoveryindex = i;
                                                };
                                            };

                                            if (chars.length >= (loopsdone * maxchars)) {
                                                imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, chars.slice(recoveryindex, chars.length - 1).join("") + ".")
                                            };

                                            const output = {
                                                vocal: index,
                                                values: {
                                                    path: directoryfinal,
                                                    loop: duration
                                                }
                                            };

                                            imagebuffer.write(directoryfinal);

                                            fs.writeFile('./' + resourcesfolder + '/images/image' + index + '.json', JSON.stringify(output), function (errfile) {
                                                fs.unlinkSync(directorybgfinal);
                                                console.log('Vocal #' + index + ' has its video part!');
                                                success(output);
                                            });
                                        });
                                    });
                                });
                            });
                        };
                    });
                };
            });
        });
    };

    h2p(id, image) {
        const self = this;

        const text = image.text;
        const accent = image.accent;
        const duration = image.duration;

        const background_path = path.join(self.Config.Folder, 'preset', 'background.jpg');
        const output_path = path.join(self.Config.Folder, 'images', 'image' + id + '.jpg');
        const save_file = path.join(self.Config.Folder, 'images', 'image' + id + '.json');

        return new Promise((success, error) => {
            fs.exists(save_file, (exists) => {
                if (exists) {
                    self.debug('File with id ' + id + '.jpg is already done, adding its metadata to the image files to process..');
                    success(JSON.parse(fs.readFileSync(save_file, 'utf8')));
                } else {
                    jimp.loadFont(jimp.FONT_SANS_128_WHITE).then(function (font) {
                        jimp.read(background_path, function (err, imagebuffer) {
                            imagebuffer.quality(60).print(font, 0, 210, {
                                text: text,
                                alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
                            }, 1100, 720).print(font, 0, 500, {
                                text: accent,
                                alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
                            }, 1100, 720).write(output_path);

                            const output = {
                                vocal: id,
                                values: {
                                    path: output_path,
                                    loop: duration
                                }
                            };

                            fs.writeFile(save_file, JSON.stringify(output), function (errfile) {
                                console.log('Vocal #' + id + ' has its video part!');
                                success(output);
                            });
                        });
                    });
                };
            });
        });
    };
}