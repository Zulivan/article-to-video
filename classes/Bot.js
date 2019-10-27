const fs = require('fs');
const path = require('path');
const {
    google
} = require('googleapis');

module.exports = class Bot {
    /**
     * Compiles the bot
     * @param {string} Directory Root directory
     * @param {object} Config Config params
     */

    constructor(Directory, Config = {}) {
        this.Config = Config;
        this.Config.WordsPerRecording = 15;
        this.Config.Directory = Directory;

        this.oAuth = new google.auth.OAuth2(this.Config.oAuth.Public, this.Config.oAuth.Private, 'http://localhost:' + this.Config.LocalPort + '/oauth2callback');

        this.Progression = {
            imagedownloaded: [],
            renderedvoices: [],
            magazineloaded: false,
            videodone: false,
            audiodone: false,
            content: null
        };

        fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), (exists) => {
            if (exists) {
                try {
                    this.Progression = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), 'utf8'));
                } catch(e) {
                    console.log('The progression file is corrupted, reset done.')
                }
            }else{
                console.log('No progression file found, generating one.')
            }

            this.start();
        });
    }

    /**
     * Saves current progress
     * @param {string} index If set: sets an index to the specified value 
     * @param {any} value 
     */

    SaveMagazineProgress(index, value = false) {
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

    /**
     * Start the bot
     */

    start() {
        const self = this;
        const MagazinesBrowser = require('../tools/MagazinesBrowser.js');
        const MB = new MagazinesBrowser(self.Config, self.Config.Directory, self.Config.Folder);

        if (self.Progression.magazineloaded) {
            console.log('Producing video: ' + self.Progression.content.title);
            self.produceVideo(self.Progression.content.title, self.Progression.content.content);
        } else {
            console.log('There is no loaded magazine, searching for it..');
            MB.getMagazine().then(Magazine => {
                console.log('Found a fresh magazine..');
                if (Magazine) {
                    if (Magazine.title && Magazine.content) {
                        self.Progression.magazineloaded = true;
                        self.SaveMagazineProgress('content', Magazine).then(saved => {
                            console.log(self.SaveMagazineProgress)
                            self.produceVideo(Magazine.title, Magazine.content);
                        });
                    } else {
                        console.log('A loaded magazine doesn\'t have the needed parameters to proceed with it');
                    }
                } else {
                    console.log('No magazine found');
                }
            });
        };
    }

    /**
     * Produces a video with the following title and content
     * @param {string} title The title of the video
     * @param {string} content The text that will be read by the bot
     */

    produceVideo(title, content) {
        const self = this;
        const TextEditor = require('../tools/TextEditor.js');
        const captions_path = path.join(this.Config.Folder, 'temp', 'captions.txt');

        let badChars = ['-', '<', '>', '@', '«', '»', '?', '#'];

        content = TextEditor.HTMLtoUTF8(content)
        content = TextEditor.clear(content)
        content = TextEditor.replaceByFilter(content, badChars, '');
        content = content.replace(/voici.fr/g, 'FRANCE INFOS 24/7').replace(/closer/g, 'clauzeure').replace(/la mort/g, 'la disparition').replace(/mort/g, 'disparu');
        content = this.Config.Intro.Text + content;

        fs.writeFile(captions_path, content, function (errwrite) {});

        badChars = ['<', '>', '«', '»'];

        title = TextEditor.HTMLtoUTF8(title)
        title = TextEditor.clear(title)
        title = TextEditor.replaceByFilter(title, badChars, '\'');

        const titleword = title.split(' ');
        let propertitle = [];

        const Alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

        for (let i = 0; i < titleword.length; i++) {
            let already_added = false;
            for (let j = 0; j < Alphabet.length; j++) {
                if (titleword[i].includes(Alphabet[j]) && !already_added) {
                    already_added = true;
                    propertitle.push(titleword[i]);
                }
            }
        }

        propertitle = propertitle.join(' ').split(':').join('');

        if (title.length > 92) title = title.slice(0, 90) + '...';

        this.Progression.content = {
            propertitle: propertitle,
            title: title,
            content: content
        };

        console.log('Title: ' + title);
        console.log('----------------');
        console.log('Research terms: ' + propertitle);
        console.log('--------------------------------');
        console.log('Content: ' + content);
        console.log('--------------------------------');

        const ImagesFinder = require('../tools/ImagesFinder.js');
        const IF = new ImagesFinder(this.Config, this.Config.Directory, this.Config.Folder);
        if (self.Progression.imagedownloaded.length == 0) {
            IF.searchImages(propertitle).then((images, reset) => {
                if (images) {
                    images = images.filter(v => v != null);
                    console.log(images);
                    self.SaveMagazineProgress('imagedownloaded', images).then((saved) => {
                        console.log('Downloaded all the required images');
                        self.audioRender(content);
                    });
                } else {
                    console.log('Reset engaged')
                    this.resetFiles().then((success) => {
                        process.exit();
                    });
                };
            });
        } else if (self.Progression.videodone) {
            const subtitles = fs.createReadStream(captions_path);
            const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(' '));
            const thumbnail = self.Progression.imagedownloaded[Math.floor(Math.random() * self.Progression.imagedownloaded.length)];
            const file = path.join(self.Config.Folder, 'video.mp4');

            self.uploadVideo(file, self.Progression.content.title, subtitles, tagsvid, thumbnail);
        } else if (self.Progression.imagedownloaded) {
            console.log('All images were previously downloaded, generating audio..');
            self.audioRender(content, self.Progression.imagedownloaded);
        }

    }

    /**
     * Makes a video by combining audio files and image files
     * @param {object} audio Audio files
     */

    makeVideo(audio, img_srcs) {
        const VideoCompiler = require('../tools/VideoCompiler.js');
        const VC = new VideoCompiler(this.Config);

        const ImageMaker = require('../tools/NEWS_ImageMaker.js');
        const IM = new ImageMaker(this.Config);
        const self = this;

        IM.generateImages(audio, img_srcs).then((images) => {
            VC.generateVideo(audio, images).then((file, reset) => {
                if (file) {
                    const subtitles = fs.createReadStream('./' + self.Config.Folder + '/temp/captions.txt');
                    const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(' '));
                    const thumbnail = images[Math.floor(Math.random() * images.length)];
    
                    self.SaveMagazineProgress('videodone', file).then((saved) => {
                        console.log('Video has been made');
                        self.uploadVideo(file, self.Progression.content.title, subtitles, tagsvid, thumbnail);
                    });
                } else {
                    process.exit();
                }
            });
        })

    }

    /**
     * Uploads a video on youtube
     * @param {file} file Video file
     * @param {string} title Video title
     * @param {string} subtitles The content of the video which will be used as subtitles
     * @param {object} tags Video tags
     * @param {file} thumbnail Video thumbnail
     */

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

    /**
     * Uploads a video on youtube
     * @param {string} content Video content
     * @param {object} images Image files
     */

    audioRender(content, images) {

        const AudioManager = require('../tools/AudioManager.js');
        const AM = new AudioManager(this.Config, this.Config.Directory, this.Config.Folder);

        AM.generateAudio(content).then((audio) => {
            console.log(audio)
            this.SaveMagazineProgress('renderedvoices', audio).then((saved) => {
                this.SaveMagazineProgress('audiodone', true).then((saved) => {
                    console.log('Successfully recorded all audio files!')
                    this.makeVideo(audio, images);
                });
            });
        });

    }

    /**
     * Resets the temporary files to start up a new working session on another magazine
     * @param {boolean} NoDeletion Choose wether the files generated to make a video have to be deleted or not
     */

    resetFiles(NoDeletion = false) {
        const self = this;
        return new Promise((success, error) => {
            self.Progression = {
                imagedownloaded: [],
                renderedvoices: [],
                magazineloaded: false,
                videodone: false,
                audiodone: false,
                content: null
            };
            self.SaveMagazineProgress().then((saved) => {
                console.log('Saved progress')
                if (NoDeletion) {
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
                                    if (files1[i].indexOf('.jpg') > -1 || files1[i].indexOf('.bmp') > -1 || files1[i].indexOf('.png') > -1) {
                                        fs.unlinkSync('./' + self.Config.Folder + '/images/' + files1[i]);
                                    } else if (files1[i].indexOf('.json') > -1) {
                                        fs.unlinkSync('./' + self.Config.Folder + '/images/' + files1[i]);
                                    }
                                };
                                fs.readdir('./' + self.Config.Folder + '/audio', function (err, files2) {
                                    for (let i in files2) {
                                        const file = files2[i].split('.')[0];
                                        if (files2[i].indexOf('.mp3') > -1) {
                                            fs.unlinkSync('./' + self.Config.Folder + '/audio/' + file + '.mp3');
                                        } else if (files2[i].indexOf('.json') > -1) {
                                            fs.unlinkSync('./' + self.Config.Folder + '/audio/' + files2[i]);
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