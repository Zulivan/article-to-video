const fs = require('fs');
const path = require('path');
const {
    google
} = require('googleapis');

module.exports = class Bot {
    /**
     * Compiles the bot
     * @param {string} Root Root directory
     * @param {object} Config Config params
     */

    constructor(Root, Config = {}) {
        this.Config = Config;
        this.Config.Directory = Root;
        this.oAuth = new google.auth.OAuth2(this.Config.oAuth.Public, this.Config.oAuth.Private, 'http://localhost:' + this.Config.LocalPort + '/oauth2callback');
        this.Progression = {};

        fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), (exists) => {
            if (exists) {
                this.Progression = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), 'utf8'));
                this.start();
            } else {
                this.resetFiles().then((success) => {
                    process.exit();
                });
            };
        });
    }

    SaveProgress(index, value = false) {
        const self = this;
        return new Promise((success, error) => {
            if (index) {
                self.Progression[index] = value;
            };
            fs.writeFile(path.join(self.Config.Directory, self.Config.Folder, 'temp', 'progression.json'), JSON.stringify(self.Progression), function (errfile) {
                if (errfile) {
                    return error(errfile);
                }
                success(self.Progression);
            });
        });
    }

    start() {
        console.log('Generating audio..');
        this.step1(this.Config.Word);
    }

    step1(word) {
        const AudioManager = require('../tools/AudioPronunciation.js');
        const AM = new AudioManager(this.Config);
        this.resetFiles().then((success) => {
            AM.generateAudio(word).then((audio) => {
                this.SaveProgress('renderedvoices', audio).then((saved) => {
                    this.SaveProgress('audiodone', true).then((saved) => {
                        console.log('Successfully recorded all audio files!');
                        this.step2(audio);
                    });
                });
            });
        });
    }

    step2(audio) {
        console.log('Generating images');
        const self = this;
        const ImageCreator = require('../tools/H2P_ImageMaker.js');
        const IM = new ImageCreator(this.Config);

        IM.generateImages(audio).then((images) => {
            self.step3(audio, images);
        })
    }

    step3(audio, images) {
        const VideoCompiler = require('../tools/VideoCompiler.js');
        const self = this;
        const VC = new VideoCompiler(this.Config, this.Config.Directory, this.Config.Folder);

        VC.generateVideo(audio, images).then((file, reset) => {
            if (file) {
                setTimeout(function () {
                    self.resetFiles().then((success) => {
                        console.log('Reset done another video is going to be made in 5 minutes');
                        setTimeout(function () {
                            process.exit();
                        }, 5 * 60 * 1000)
                    });
                }, 5 * 60 * 1000);
            } else {
                process.exit();
            }
        });
    }

    resetFiles(endup = false) {
        const self = this;
        return new Promise((success, error) => {
            self.Progression = {
                audiodone: false,
                videodone: false,
                images: [],
                renderedvoices: []
            }
            self.SaveProgress().then((saved) => {
                console.log('Saved progress')
                if (endup) {
                    process.exit();
                }
                fs.exists('./' + self.Config.Folder + '/thumbnail.png', (exists0) => {
                    if (exists0) {
                        fs.unlinkSync('./' + self.Config.Folder + '/thumbnail.png');
                    };
                    fs.exists('./' + self.Config.Folder + '/video.mp4', (exists1) => {
                        if (exists1) {
                            fs.unlinkSync('./' + self.Config.Folder + '/video.mp4');
                        };
                        fs.exists('./' + self.Config.Folder + '/temp/captions.txt', (exists2) => {
                            if (exists2) {
                                fs.unlinkSync('./' + self.Config.Folder + '/temp/captions.txt');
                            };
                            fs.readdir('./' + self.Config.Folder + '/images', function (err, files1) {
                                for (let i in files1) {
                                    fs.unlinkSync('./' + self.Config.Folder + '/images/' + files1[i]);
                                };
                                fs.readdir('./' + self.Config.Folder + '/audio', function (err, files2) {
                                    for (let i in files2) {
                                        fs.unlinkSync('./' + self.Config.Folder + '/audio/' + files2[i]);
                                    };
                                    success(true);
                                });
                            });
                        });
                    });
                });
            });
        });
    }
};