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
        this.step1(15);
    }

    step1(amount) {
        console.log('Generating ' + amount + ' images...');
        const self = this;
        const ImageMaker = require(path.join(this.Config.Directory, 'classes', 'ImageMaker.js'));
        const IM = new ImageMaker(this.Config);

        console.log('=====================================================')

        let image_infos = [];

        for (let i = -1; i < amount; i++) {
            image_infos.push({
                type: 'rndimage'
            });
        };

        IM.generateImages(image_infos).then((images) => {
            self.step2(images);
        });
    }

    step2(images) {
        const VideoCompiler = require('../tools/VideoCompiler.js');
        const self = this;
        const VC = new VideoCompiler(this.Config, this.Config.Directory, this.Config.Folder);

        function makeid(length) {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < length; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return result;
        }

        VC.generateVideo(path.join(self.Config.Folder, 'preset', 'tone.mp3'), images, makeid(7)).then((file, reset) => {
            if (file) {
                self.resetFiles().then((success) => {
                    console.log('Reset done another video is going to be made in 5 minutes');
                    process.exit();
                });
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
                images: []
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