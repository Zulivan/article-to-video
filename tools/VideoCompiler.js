const fs = require('fs');
const videoshow = require('videoshow');
const mp3Duration = require('mp3-duration');
const path = require('path');
const jimp = require('jimp');

const DEBUG = true;

module.exports = class VideoCompiler {
    /**
     * Initializes a MagazineBrowser instance (only used by Bot.js)
     * @param {object} config Config array
     * @param {string} directory Directrory folder
     * @param {string} folder Root directory
     */

    constructor(config = {}, directory, folder = 'none') {

        this.Config = config;
        this.Config.Directory = directory;
        if (!this.Config.Folder) {
            this.Config.Folder = folder;
        };
    }

    debug(text) {
        if (DEBUG) console.log(text);
    }


    generateVideo(audio, images) {
        const self = this;
        return new Promise((success, error) => {
            let vocals = [];

            for (let i = 0; i < audio.length; i++) {
                vocals.push(self.videoChunk(audio[i], images));
            };

            Promise.all(vocals).then((values) => {
                values.filter(v => v != null);

                if (audio.length > values) {
                    console.log(total + ' > ' + values + ': restarting');
                    return self.generateVideo(audio, images);
                } else {

                    let imgrendered = []

                    for (let i = 0; i < values.length; i++) {
                        imgrendered.push(values[i].values);
                    };

                    self.makeVideo(imgrendered).then((file) => {
                        success(file);
                    });
                }
            });
        });
    }

    makeVideo(imgrendered) {
        const self = this;
        return new Promise((success, error) => {
            const resourcesfolder = self.Config.Folder;
            mp3Duration('./' + resourcesfolder + '/audio/compilation.mp3', function (err, duration) {
                const videolength = Math.floor(duration + 8);
                if (duration < 1) {
                    console.log('This video length is ' + duration + ' seconds, it is set as suspected of being glitched, resetting...')
                    success(null);
                } else {
                    console.log('The vocals made by synthesized voice were compiled and its duration is ' + videolength + ' seconds!')
                }
                const options = {
                    fps: 4,
                    loop: (videolength / imgrendered.length), // seconds
                    transition: false,
                    transitionDuration: 0, // seconds
                    videoBitrate: 1024,
                    videoCodec: 'libx264',
                    pixelFormat: 'yuv420p',
                    size: '1280x720',
                    audioBitrate: '128k',
                    audioChannels: 2,
                    format: 'mp4'
                }
                setTimeout(function () {
                    videoshow(imgrendered, options)
                        .audio('./' + resourcesfolder + '/audio/compilation.mp3')
                        .save('./' + resourcesfolder + '/video.mp4')
                        .on('start', function (command) {
                            console.log('The video is in preparation...')
                        }).on('error', function (err) {
                            console.log(err)
                            success(false);
                        }).on('end', function (output) {
                            console.log('The video is done.')
                            success('./' + resourcesfolder + '/video.mp4')
                        })
                }, 5000)
            });
        });
    }

    videoChunk(audio, images) {
        const self = this;
        return new Promise((success, error) => {
            const resourcesfolder = self.Config.Folder;
            const sentence = audio.sentence;
            const duration = audio.duration;
            const index = audio.vocalid;
            fs.exists(path.join(self.Config.Root, self.Config.Folder, 'images', 'speech' + index + '.json'), (exists) => {
                if (exists) {
                    self.debug('Part for vocal #' + index + ' was already recorded, skipping..');
                    let output;
                    try {
                        output = JSON.parse(fs.readFileSync(path.join(self.Config.Root, self.Config.Folder, 'images', 'speech' + index + '.json'), 'utf8'));
                    } catch (e) {
                        self.debug('JSON file is corrupted, regenerating.');
                        fs.unlinkSync(path.join(self.Config.Root, self.Config.Folder, 'images', 'speech' + index + '.json'));
                        process.exit();
                    }

                    success(output);
                } else {
                    self.debug('Making part ' + audio.vocalid + ' with text');

                    const maxchars = 60;

                    let chars = sentence.split('');
                    let currchars = 0;
                    let loopsdone = 0;
                    let recoveryindex = 0;
                    let roundedmultiple = 1;
                    if (chars.length / maxchars - Math.floor(chars.length / maxchars) > 0) {
                        roundedmultiple = Math.floor(chars.length / maxchars) + 1;
                    } else {
                        roundedmultiple = Math.floor(chars.length / maxchars);
                    }
                    const blocktop = 720 - 25 * roundedmultiple - 10;
                    self.debug('Pushing it up chars length ' + chars.length + ' and ' + roundedmultiple + ' times');
                    const randomimage = images[Math.floor(Math.random() * images.length)];
                    let sentencet = '';
                    const directory = randomimage.path;
                    const directoryfinal = './' + resourcesfolder + '/images/speech' + index + '.jpg';
                    const directorybgfinal = './' + resourcesfolder + '/images/speech' + index + 'bg.jpg';

                    if (index == 0) {
                        jimp.read('./' + resourcesfolder + '/preset/intro.png', function (jimperr1, intro) {
                            const output = {
                                vocal: index,
                                values: {
                                    path: directoryfinal,
                                    loop: duration
                                }
                            };

                            intro.write(directoryfinal);

                            fs.writeFile('./' + resourcesfolder + '/images/speech' + index + '.json', JSON.stringify(output), function (errfile) {
                                console.log('Vocal #' + index + ' has its video part!');
                                fs.unlinkSync(path.join(self.Config.Root, self.Config.Folder, 'images', 'speech' + index + 'bg.jpg'));
                                success(output);
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
                                            }
                                        }

                                        if (chars.length >= (loopsdone * maxchars)) {
                                            imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, chars.slice(recoveryindex, chars.length - 1).join("") + ".")
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
                                            console.log('Vocal #' + index + ' has its video part!');
                                            success(output);
                                        });
                                    });
                                });
                            });
                        });
                    };
                };
            });
        });
    }

}