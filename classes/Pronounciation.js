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

    constructor(Root, Config) {
        this.Config = Config || {};
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
            fs.writeFile(path.join(self.Config.Directory, self.config.Folder, 'temp', 'progression.json'), JSON.stringify(self.Progression), function (errfile) {
                if (errfile) {
                    return error(errfile);
                }
                success(self.Progression);
            });
        });
    }

    start() {
        const self = this;
        if (self.Progression.audiodone) {
            console.log('Producing video: ' + this.Progression.content.title);
            this.produceVideo(this.Progression.content.title, this.Progression.content.content);
        } else {
            console.log('Generating audio..');
            audioRender();
        };
    }

    produceVideo(title, content) {
        const ImageCreator = require('../tools/ImageCreator.js');

        if (self.Progression.images.length == 0) {
            IF.searchImages(propertitle).then((images, reset) => {
                if (images == null) {
                    console.log('Reset engaged')
                    this.resetFiles().then((success) => {
                        process.exit();
                    });
                } else if (images) {
                    images = images.filter(v => v != null);
                    console.log(images);
                    self.SaveProgress('images', images).then((saved) => {
                        console.log('Downloaded all the required images');
                        self.audioRender(content);
                    });
                };
            });
        } else if (self.Progression.videodone) {
            const subtitles = fs.createReadStream('./' + self.config.Folder + '/temp/captions.txt');
            const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(" "));
            const file = './' + self.config.Folder + '/video.mp4';

            self.uploadVideo(file, self.Progression.content.title, subtitles, tagsvid, thumbnail);
        } else if (self.Progression.images) {
            console.log('All images were previously downloaded, generating audio..');
            self.audioRender(content, self.Progression.images);
        }

    }

    makeVideo(audio, images) {
        const VideoCompiler = require('../tools/VideoCompiler.js');
        const VC = new VideoCompiler(this.Config, this.Config.Directory, this.Config.Folder);
        const self = this;

        VC.generateVideo(audio, images).then((file, reset) => {
            if (file) {
                const subtitles = fs.createReadStream('./' + self.config.Folder + '/temp/captions.txt');
                const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(" "));
                const thumbnail = images[Math.floor(Math.random() * images.length)];

                self.SaveProgress('videodone', file).then((saved) => {
                    console.log('Video has been made');
                    self.uploadVideo(file, self.Progression.content.title, subtitles, tagsvid, thumbnail);
                });
            } else {
                process.exit();
            }
        });
    }

    uploadVideo(file, title, subtitles, tags, thumbnail) {
        const YoutubeUploader = require('../tools/YoutubeUploader.js');
        const YU = new YoutubeUploader(this.Config, this.oAuth);
        const self = this;
        YU.uploadVideo(file, title, subtitles, tags, thumbnail).then((id, reset) => {
            if (id) {
                console.log('Uploaded video on youtube with id:' + id);
                self.resetFiles().then((success) => {
                    console.log('Reset done another video is going to be made in 5 minutes');
                    setTimeout(function () {
                        process.exit();
                    }, 5 * 60 * 1000)
                });
            } else {
                console.log('Video upload returned an error, retrying in 5 minutes..')
                setTimeout(function () {
                    process.exit();
                }, 5 * 60 * 1000);
            };
        });
    }

    audioRender(word) {

        const AudioManager = require('../tools/AudioPronounciations.js');
        const AM = new AudioManager(this.Config);

        AM.generateAudio(word).then((audio) => {
            this.SaveProgress('renderedvoices', audio).then((saved) => {
                this.SaveProgress('audiodone', true).then((saved) => {
                    console.log('Successfully recorded all audio files!')
                    // this.makeVideo(audio, images);
                });
            });
        });
    }

    resetFiles(endup = false) {
        const self = this;
        return new Promise((success, error) => {
            self.Progression = {
                audiodone = false,
                videodone = false,
                images: [],
                renderedvoices = []
            }
            self.SaveProgress().then((saved) => {
                console.log('Saved progress')
                if (endup) {
                    process.exit();
                }
                fs.exists('./' + self.config.Folder + '/thumbnail.png', (exists0) => {
                    if (exists0) {
                        fs.unlinkSync('./' + self.config.Folder + '/thumbnail.png');
                    };
                    fs.exists('./' + self.config.Folder + '/video.mp4', (exists1) => {
                        if (exists1) {
                            fs.unlinkSync('./' + self.config.Folder + '/video.mp4');
                        };
                        fs.exists('./' + self.config.Folder + '/temp/captions.txt', (exists2) => {
                            if (exists2) {
                                fs.unlinkSync('./' + self.config.Folder + '/temp/captions.txt');
                            };
                            fs.readdir('./' + self.config.Folder + '/images', function (err, files1) {
                                for (let i in files1) {
                                    if (files1[i].indexOf('.jpg') > -1 || files1[i].indexOf('.bmp') > -1 || files1[i].indexOf('.png') > -1) {
                                        fs.unlinkSync('./' + self.config.Folder + '/images/' + files1[i]);
                                    } else if (files1[i].indexOf('.json') > -1) {
                                        fs.unlinkSync('./' + self.config.Folder + '/images/' + files1[i]);
                                    }
                                };
                                fs.readdir('./' + self.config.Folder + '/audio', function (err, files2) {
                                    for (let i in files2) {
                                        const file = files2[i].split('.')[0];
                                        if (files2[i].indexOf('.mp3') > -1) {
                                            fs.unlinkSync('./' + self.config.Folder + '/audio/' + file + '.mp3');
                                        } else if (files2[i].indexOf('.json') > -1) {
                                            fs.unlinkSync('./' + self.config.Folder + '/images/' + files2[i]);
                                        }
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