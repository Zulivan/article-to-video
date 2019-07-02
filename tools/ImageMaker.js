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
                promises.push(self[images[i]['type']](i, images[i].text, images[i].accent, images[i].duration));
            };

            Promise.all(promises).then((values) => {
                values = values.filter(v => v != null);
            });
        });
    }

    h2p(id, text, accent, duration) {
        const self = this;
        return new Promise((success, error) => {
            const resourcesfolder = path.join(self.Config.Folder, 'images');
            const directoryfinal = path.join(resourcesfolder, 'image' + id + '.jpg');
            const background_path = path.join(self.Config.Folder, 'preset', 'background.jpg');
            const jsonsave = path.join(resourcesfolder, 'image' + id + '.json');
            fs.exists(jsonsave, (exists) => {
                if (exists) {
                    self.debug('File with id ' + id + '.jpg is already done, adding its metadata to the image files to process..');
                    const output = JSON.parse(fs.readFileSync(jsonsave, 'utf8'));
                    success(output);
                } else {
                    jimp.loadFont(jimp.FONT_SANS_128_WHITE).then(function (font) {
                        jimp.read(background_path, function (err, imagebuffer) {
                            imagebuffer.quality(60);
                            imagebuffer.print(font, 0, 210, {
                                text: text,
                                alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
                            }, 1100, 720);
                            imagebuffer.print(font, 0, 500, {
                                text: accent,
                                alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
                            }, 1100, 720);

                            const output = {
                                vocal: id,
                                values: {
                                    path: directoryfinal,
                                    loop: duration
                                }
                            };

                            imagebuffer.write(directoryfinal);

                            fs.writeFile(jsonsave, JSON.stringify(output), function (errfile) {
                                console.log('Vocal #' + id + ' has its video part!');
                                success(output);
                            });
                        });
                    });
                }
            });
        });
    }
}