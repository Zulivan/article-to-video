const path = require('path');
const fs = require('fs');
const jimp = require('jimp');
const DEBUG = true;

module.exports = class ImageMaker {
    constructor(directory, folder) {
        this.Config = {
            Directory: directory,
            Folder: folder
        };
    }

    debug(text) {
        if (DEBUG) console.log('ImageMaker.js : '+text);
    }

    generateImages(images) {
        const self = this;
        return new Promise((success, error) => {
            let promises = [];

            for (let i = 0; i < images.length; i++) {
                const imgFuncPath = path.join(self.Config.Folder, 'preset', images[i]['type'] + '.js');
                if (fs.existsSync(imgFuncPath)) {
                    promises.push(self.runImageGeneration(i, images[i]));
                } else {
                    error('The type: "' + images[i]['type'] + '" is not a valid preset type');
                };
            };
            
            Promise.all(promises).then((values) => {
                self.debug('All promises are done!')
                values = values.filter(v => v != null);
                success(values)
            }).catch((err) => {
                self.debug(err);
            });
        });
    }

    generateThumbnail(overlayPath, imagePath) {
        const self = this;
        return new Promise((success, error) => {
            const thumbnail_final_dir = path.join(self.Config.Folder, 'images', 'final_thumbnail.png');
            jimp.read(overlayPath).then(overlay => {
                jimp.read(imagePath).then(background => {
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

        return new Promise((success, error) => {
            const jsonContentPath = path.join(self.Config.Directory, self.Config.Folder, 'images', 'image' + index + '.json');
            const imgFuncPath = path.join(self.Config.Directory, self.Config.Folder, 'preset', data['type'] + '.js');
            const imgCustomFunc = require(imgFuncPath);
    
            function recordGeneration(result) {

                const duration = data.duration || 1;
                const output = {
                    vocal: index,
                    values: {
                        path: result,
                        loop: duration
                    }
                };

                fs.writeFile(jsonContentPath, JSON.stringify(output, null, 2), (errfile) => {
                    if (errfile) {
                        error(errfile);
                    } else {
                        self.debug('Image #' + index + ' is fully made!');
                        success(output);
                    };
                });
            };

            fs.exists(jsonContentPath, (exists) => {
                if (exists) {
                    self.debug('File with id ' + index + '.jpg is already done! Checking contents..');
                    try {
                        const output = JSON.parse(fs.readFileSync(jsonContentPath, 'utf8'));
                        success(output);
                    } catch (e) {
                        self.debug('The JSON content of the image ' + index + ' is corrupt, remaking...');
                        imgCustomFunc(self.Config.Folder, index, data).then((r) => {
                            recordGeneration(r);
                        }).catch((err) => {
                            error(err);
                        });
                    }
                } else {
                    imgCustomFunc(self.Config.Folder, index, data).then((r) => {
                        recordGeneration(r);
                    }).catch((err) => {
                        error(err);
                    });
                };
            });
        });
    }
}