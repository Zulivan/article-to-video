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

    h2p(word, accent){
        const self = this;
        return new Promise((success, error) => {
            const background_path = path.join(this.Folder, 'preset', 'background.jpg');
            jimp.loadFont(jimp.FONT_SANS_32_BLACK).then(function (font) {
                jimp.read(background_path, function (jimperr1, prebackground) {
                    prebackground.resize(1080, 25 * roundedmultiple + 10).quality(60).write(directorybgfinal);
                    jimp.read(directorybgfinal, function (importerror, background) {
                        jimp.read(directory, function (jimperr, imagebuffer) {
                            imagebuffer.composite(background, 0, blocktop)
                            imagebuffer.quality(60);
                            for (let i = 0; i < chars.length; i++) {
                                currchars = currchars + 1;
                                sentencet += chars[i];
                                if (currchars >= maxchars) {
                                    imagebuffer.print(font, 12, blocktop + 25 * loopsdone, sentencet)
                                    currchars = 0;
                                    loopsdone = loopsdone + 1;
                                    sentencet = '';
                                    recoveryindex = i;
                                }
                            }

                            if (chars.length >= (loopsdone * maxchars)) {
                                imagebuffer.print(font, 12, blocktop + 25 * loopsdone, chars.slice(recoveryindex, chars.length - 1).join("") + ".")
                            }

                            const output = {
                                vocal: index,
                                values: {
                                    path: directoryfinal,
                                    loop: duration
                                }
                            };

                            imagebuffer.write(directoryfinal);

                            fs.writeFile('./' + resourcesfolder + '/images/speech' + index + '.json', JSON.stringify(output), function (errfile) {
                                fs.unlinkSync(path.join(self.Config.Root, self.Config.Folder, 'images', 'speech' + index + 'bg.jpg'));
                                console.log('Vocal #' + index + ' has its video part!');
                                success(output);
                            });
                        });
                    });
                });
            });
        });
    });
}