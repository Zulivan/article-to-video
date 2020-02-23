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
        console.log(image_name);
        const self = this;
        const thumbnail_final_dir = path.join(self.Config.Folder, 'images', 'final_thumbnail.png');
        return new Promise((success, error) => {
            jimp.read(path.join(self.Config.Folder, 'preset', 'thumbnail.png')).then(overlay => {
                jimp.read(path.join(self.Config.Folder, 'images', image_name)).then(background => {
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
                        error(e);
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

                    const directoryimginfo = path.join(resourcesfolder, 'images', 'image' + index + '.json');
                    const directoryfinal = path.join(resourcesfolder, 'images', 'image' + index + '.jpg');

                    fs.exists(path.join(resourcesfolder, 'preset', 'intro.png'), (intro_exists) => {
                        if (index == 0 && intro_exists) {
                            jimp.read(path.join(resourcesfolder, 'preset', 'intro.png')).then((intro) => {
                                const output = {
                                    vocal: index,
                                    values: {
                                        path: directoryfinal,
                                        loop: duration
                                    }
                                };

                                intro.write(directoryfinal);

                                fs.writeFile(directoryimginfo, JSON.stringify(output), function (errfile) {
                                    console.log('Vocal #' + index + ' has its video part!');
                                    setTimeout(function () {
                                        success(output);
                                    }, 1000);
                                });
                            }).catch((err) => {
                                console.log('Cannot read image for index = 0: ' + err);
                            });
                        } else {
                            jimp.loadFont(jimp.FONT_SANS_32_BLACK).then((font2) => {

                                jimp.read(path.join(resourcesfolder, 'preset', 'background.png')).then((prebackground) => {

                                    prebackground.resize(1080, 25 * roundedmultiple + 10).quality(60);

                                    jimp.read(directory).then((imagebuffer) => {

                                        imagebuffer.composite(prebackground, 0, blocktop)
                                        imagebuffer.quality(60);
                                        for (let i = 0; i < chars.length; i++) {
                                            currchars = currchars + 1;
                                            sentencet += chars[i];
                                            if (currchars >= maxchars) {
                                                imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, sentencet)
                                                currchars = 0;
                                                loopsdone = loopsdone + 1;
                                                sentencet = '';
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

                                        fs.writeFile(directoryimginfo, JSON.stringify(output), function (errfile) {
                                            console.log('Vocal #' + index + ' has its video part!');
                                            success(output);
                                        });
                                    }).catch((err) => {
                                        console.log('Cannot load background image ' + err);
                                    });

                                }).catch((err) => {
                                    console.log('Cannot load the subtitle background ' + err);
                                });
                            }).catch((err) => {
                                console.log('Cannot load jimps black font ' + err);
                            });
                        };
                    });
                };
            });
        });
    };

    rndimage(id) {
        const self = this;

        const text = 'Slide: '+id;
        const duration = 1;

        const rect_x = [180, 850];
        const rect_y = [100, 240];

        const background_path = path.join(self.Config.Folder, 'preset', 'background.png');
        
        const red_path = path.join(self.Config.Folder, 'preset', 'red.png');
        const green_path = path.join(self.Config.Folder, 'preset', 'green.png');
        const blue_path = path.join(self.Config.Folder, 'preset', 'blue.png');

        const output_path = path.join(self.Config.Folder, 'images', 'image' + id + '.jpg');
        const save_file = path.join(self.Config.Folder, 'images', 'image' + id + '.json');

        return new Promise((success, error) => {
            fs.exists(save_file, (exists) => {
                if (exists) {
                    self.debug('File with id ' + id + '.jpg is already done, adding its metadata to the image files to process..');
                    success(JSON.parse(fs.readFileSync(save_file, 'utf8')));
                } else {
                    function getRandomInt(min, max) {
                        min = Math.ceil(min);
                        max = Math.floor(max);
                        return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
                    }               

                    jimp.read(red_path, (err1, red_img) => {
                        if (err1) throw err1;
                        red_img
                          .resize(getRandomInt(rect_x[0], rect_x[1]), getRandomInt(rect_y[0], rect_y[1])) // resize
                          .quality(60) // set JPEG quality

                          jimp.read(green_path, (err2, green_img) => {
                            if (err2) throw err2;
                            green_img
                              .resize(getRandomInt(rect_x[0], rect_x[1]), getRandomInt(rect_y[0], rect_y[1])) // resize
                              .quality(60) // set JPEG quality

                              jimp.read(blue_path, (err3, blue_img) => {
                                if (err3) throw err3;
                                blue_img
                                  .resize(getRandomInt(rect_x[0], rect_x[1]), getRandomInt(rect_y[0], rect_y[1])) // resize
                                  .quality(60) // set JPEG quality

                                  jimp.loadFont(jimp.FONT_SANS_128_BLACK).then((font) => {
                                    jimp.read(background_path, (err, imagebuffer) => {
                                        imagebuffer.composite(blue_img, getRandomInt(0, 1060), getRandomInt(15, 700))
                                        .composite(green_img, getRandomInt(0, 1060), getRandomInt(15, 700))
                                        .composite(red_img, getRandomInt(0, 1060), getRandomInt(15, 700))
                                        .quality(60).print(font, 10, 10, {
                                            text: text,
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
                                            console.log('Slide #' + id + ' has its video part!');
                                            success(output);
                                        });
                                    });
                                });
                            });
                        });
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