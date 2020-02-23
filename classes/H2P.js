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

        this.Progression = {};

        this.wordsfile = JSON.parse(fs.readFileSync(path.join(this.Config.Folder, 'temp', 'words.json'), 'utf8'));
        
        console.log('Loaded '+this.wordsfile.length+' words!')

        this.Config.Word = this.wordsfile.shift();

        fs.exists(path.join(this.Config.Folder, 'temp', 'progression.json'), (exists) => {
            if (exists) {
                this.Progression = JSON.parse(fs.readFileSync(path.join(this.Config.Folder, 'temp', 'progression.json'), 'utf8'));
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
            fs.writeFile(path.join(self.Config.Folder, 'temp', 'progression.json'), JSON.stringify(self.Progression), function (errfile) {
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
        const ImageMaker = require(path.join(this.Config.Directory, 'classes', 'ImageMaker.js'));
        const IM = new ImageMaker(this.Config);

        console.log('Generating ' + audio.length + ' backgrounds for the word "' + audio[0].text + '"!')
        console.log('=====================================================')

        let image_infos = [];

        for (let i in audio) {
            image_infos.push({
                type: 'h2p',
                text: audio[i].text,
                accent: audio[i].extra.name,
                duration: audio[i].duration
            });
        };

        IM.generateImages(image_infos).then((images) => {
            self.step3(audio, images);
        });
    }

    step3(audio, images) {
        const VideoCompiler = require('../tools/VideoCompiler.js');
        const self = this;
        const VC = new VideoCompiler(this.Config, this.Config.Directory, this.Config.Folder);

        VC.generateVideo(path.join(this.Config.Folder, 'audio', 'compilation.mp3'), images, this.Config.Word).then((file, reset) => {
            if (file) {
                self.resetFiles().then((success) => {
                    fs.writeFileSync(path.join(this.Config.Folder, 'temp', 'words.json'), JSON.stringify(self.wordsfile));
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