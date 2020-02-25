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

                const imgFuncPath = path.join(self.Config.Directory, 'addons', 'ImageGenerator', images[i]['type'] + '.js');
                if (fs.existsSync(imgFuncPath)) {
                    promises.push(self.runImageGeneration(i, images[i]));
                } else {
                    error('The type: "' + images[i]['type'] + '" is not a valid preset type');
                }
            };

            Promise.all(promises).then((values) => {
                values = values.filter(v => v != null);
                success(values)
            }).catch((err) => {
                console.log(err)
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

    runImageGeneration(index, data) {
        const self = this;

        const jsonContentPath = path.join(self.Config.Directory, self.Config.Folder, 'images', 'image' + index + '.json');
        const imgFuncPath = path.join(self.Config.Directory, 'addons', 'ImageGenerator', data['type'] + '.js');
        const imgCustomFunc = require(imgFuncPath);

        return new Promise((success, error) => {

            function recordGeneration(result) {

                const duration = data.duration || 1;
                const output = {
                    vocal: index,
                    values: {
                        path: result,
                        loop: duration
                    }
                };

                console.log(output);

                fs.writeFile(jsonContentPath, JSON.stringify(output, null, 2), (errfile) => {
                    if (errfile) {
                        error(errfile);
                    } else {
                        console.log('Image #' + index + ' has its image part!');
                        success(output);
                    }
                });
            };

            fs.exists(jsonContentPath, (exists) => {
                if (exists) {
                    self.debug('File with id ' + index + '.jpg is already done, adding its metadata to the image files to process..');
                    try {
                        success(JSON.parse(fs.readFileSync(jsonContentPath, 'utf8')));
                    } catch (e) {
                        self.debug('The JSON content of the image ' + index + ' is corrupt, remaking...');
                        imgCustomFunc(self.Config.Folder, index, data).then((r) => {
                            recordGeneration(r)
                        }).catch((err) => {
                            error(err);
                        });
                    }
                } else {
                    imgCustomFunc(self.Config.Folder, index, data).then((r) => {
                        recordGeneration(r)
                    }).catch((err) => {
                        error(err);
                    });
                }
            });
        });
    }
}