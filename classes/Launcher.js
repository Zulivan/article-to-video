const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const {
    google
} = require('googleapis');

module.exports = class Launcher {
    /**
     * Compiles the bot
     * @param {string} Directory Root directory
     * @param {object} Config Config params
     */

    constructor(Directory, config = {}, ProgressionMap) {
        this.Config = config;
        this.Config.Directory = Directory;

        this.Progression = ProgressionMap;

        this.Steps = [];

        if (config.oAuth) {
            if (!config.oAuth.Public) throw 'oAuth: Public key missing.';
            if (!config.oAuth.Private) throw 'oAuth: Private key missing.';
            if (!config.oAuth.LocalPort) throw 'oAuth: Local port missing.';

            this.oAuth = new google.auth.OAuth2(config.oAuth.Public, config.oAuth.Private, 'http://localhost:' + config.LocalPort + '/oauth2callback');
        } else {
            console.log('The oAuth credentials are not set up')
        }

        fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), (exists) => {
            if (exists) {
                try {
                    this.Progression = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), 'utf8'));
                } catch (e) {
                    console.log('The progression file is corrupt, reset done.')
                }
            } else {
                console.log('No progression file found, generating one.')
            }
        });
    }

    /**
     * Adds up a preset step to make the video
     * @param {function} func Function to add 
     * @param {number} index If set: sets an index to the specified value 
     */

    AddPresetStep(func, index) {

        if (index) {
            this.Steps[index] = {type: 0, func: func};
        }else{
            this.Steps.push({type: 0, func: func});
        }

    }

    /**
     * Adds up a step to make the video
     * @param {function} func Function to add 
     * @param {number} index If set: sets an index to the specified value 
     */

    AddStep(func, index) {

        if (index) {
            this.Steps[index] = {type: 1, func: func};
        }else{
            this.Steps.push({type: 1, func: func});
        }

    }

    /**
     * Saves current progression
     * @param {string} index If set: sets an index to the specified value 
     * @param {any} value 
     */

    SaveProgression(index, value = false) {
        if (index) {
            this.Progression[index] = value;
        };

        try {
            fs.writeFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), JSON.stringify(this.Progression, null, 2));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Run the Launcher once it is set up
     */

    Run() {
        
        const self = this;

        return new Promise((success, error) => {
            let promises = [];

            for (let i = 0; i < self.Steps.length; i++) {

                if(self.Steps[i]['type'] == 0){
                    promises.push(self.PresetFunction(self.Steps[i]['func']));
                }else{
                    promises.push(self.Steps[i]['func']());
                }

                promises.push(self[self.Steps[i]['type']](i, self.Steps[i]));
            };

            Promise.all(promises).then((values) => {
                values = values.filter(v => v != null);
                success(values)
            });
        });

    }

    PresetFunction(id){
        
    }

    /**
     * Produces a video with the following title and content
     * @param {string} title The title of the video
     * @param {string} content The text that will be read by the bot
     */

    produceVideo(title, content) {
        const TextEditor = require('../tools/TextEditor.js');

        let badChars = ['-', '<', '>', '@', '«', '»', '?', '#'];

        content = TextEditor.HTMLtoUTF8(content);
        content = TextEditor.clear(content);
        content = TextEditor.replaceByFilter(content, badChars, '');
        content = content.replace(/PHOTO/g, '').replace(/voici.fr/g, 'FRANCE INFOS 24/7').replace(/closer/g, 'france infos').replace(/la mort/g, 'la disparition').replace(/mort/g, 'disparu');
        content = this.Config.Intro.Text + content;

        const captions_path = path.join(this.Config.Folder, 'temp', 'captions.txt');
        fs.writeFile(captions_path, content, function (errwrite) {});

        badChars = ['<', '>', '«', '»'];

        title = TextEditor.HTMLtoUTF8(title)
        title = TextEditor.clear(title)
        title = TextEditor.replaceByFilter(title, badChars, '\'');
        title = title.replace(/PHOTO/g, '').replace(/voici.fr/g, 'FRANCE INFOS 24/7').replace(/closer/g, 'FRANCE INFOS').replace(/la mort/g, 'la disparition').replace(/mort/g, 'disparu');

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

        const ImageFinder = require('../tools/ImageFinder.js');
        const IF = new ImageFinder(this.Config, this.Config.Directory, this.Config.Folder);

        if (this.Progression.videodone) {
            const tagsvid = this.Progression.content.propertitle.concat(this.Progression.content.propertitle.split(' '));
            const thumbnail = this.Progression.downloaded_images[Math.floor(Math.random() * this.Progression.downloaded_images.length)];
            const file = path.join(this.Config.Folder, 'video.mp4');
            const title = this.Progression.content.title;

            console.log('Video is done:' + title)
            console.log(thumbnail)
            this.uploadVideo(file, title, captions_path, tagsvid, thumbnail);
        } else if (this.Progression.downloaded_images.length == 0) {
            IF.searchImages(propertitle).then((images, reset) => {
                if (images) {
                    images = images.filter(v => v != null);
                    this.SaveProgression('downloaded_images', images)
                    console.log('Downloaded all the required images');
                    this.audioRender(content, images);
                } else {
                    console.log('No images found, running reset..')
                    this.resetFiles().finally((output) => {
                        process.exit();
                    });
                };

            }).catch((err) => {
                console.log('No images found because ' + err + ', running reset..')
                this.resetFiles().finally((output) => {
                    process.exit();
                });
            });
        } else {
            console.log('All images were previously downloaded, generating audio..');
            this.audioRender(content, this.Progression.downloaded_images);
        }

    }

    /**
     * Makes a video by combining audio files and image files
     * @param {object} audio Audio files
     */

    makeBackgroundImages(audio, img_srcs) {
        const ImageMaker = require('../classes/ImageMaker.js');
        const IM = new ImageMaker(this.Config);

        console.log('Generating ' + audio.length + ' images!');
        console.log('=====================================================');

        let image_info = [];

        for (let i in audio) {
            image_info.push({
                type: 'news',
                id: audio[i].id,
                text: audio[i].text,
                duration: audio[i].duration,
                array: img_srcs
            });
        };

        IM.generateImages(image_info).then((images) => {
            console.log(images);
            this.makeVideo(audio, images);
        });

    }

    /**
     * Makes a video using audio files and image files
     * @param {object} audio Audio files
     * @param {object} images Image information
     */

    makeVideo(audio, images) {

        const VideoCompiler = require('../tools/VideoCompiler.js');
        const VC = new VideoCompiler(this.Config);
        const self = this;
        VC.generateVideo(path.join(self.Config.Folder, 'audio', 'compilation.mp3'), images).then((file, reset) => {
            if (file) {
                const captions = path.join(self.Config.Folder, 'temp', 'captions.txt');
                const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(' '));
                const thumbnail = this.Progression.downloaded_images[Math.floor(Math.random() * this.Progression.downloaded_images.length)];
                console.log(thumbnail)
                self.SaveProgression('videodone', file)
                console.log('Video has been made');
                self.uploadVideo(file, self.Progression.content.title, captions, tagsvid, thumbnail);
            } else {
                process.exit();
            }
        });
    }

    /**
     * Uploads a video on youtube
     * @param {file} file Video file
     * @param {string} title Video title
     * @param {string} subtitles_path The path of the video subtitles
     * @param {object} tags Video tags
     * @param {file} thumbnail Video thumbnail
     */

    uploadVideo(file, title, subtitles_path, tags, thumbnail) {
        const YoutubeUploader = require('../tools/YoutubeUploader.js');
        const YU = new YoutubeUploader(this.Config, this.oAuth);
        const subtitles = fs.createReadStream(subtitles_path);

        const self = this;
        YU.uploadVideo(file, title, subtitles, tags, thumbnail).then((id) => {
            console.log('Uploaded video on youtube with id:' + id);
            self.resetFiles().then((success) => {
                console.log('Reset done another video is going to be made in 5 minutes');
                setTimeout(function () {
                    process.exit();
                }, 5 * 60 * 1000)
            });
        }).catch((err) => {
            console.log('Video upload returned an error: "' + err + '", retrying in 5 minutes..')
            setTimeout(function () {
                process.exit();
            }, 5 * 60 * 1000);
        });
    }

    /**
     * Generates audio using Google's voice
     * @param {string} content Video content
     * @param {object} images Image files
     */

    audioRender(content, images) {

        const AudioManager = require('../tools/AudioManager.js');
        const AM = new AudioManager(this.Config, this.Config.Directory, this.Config.Folder);

        AM.generateAudio(content).then((audio) => {
            this.SaveProgression('renderedvoices', audio)
            console.log('Successfully recorded all audio files!')
            this.makeBackgroundImages(audio, images);
        });

    }

    /**
     * Resets the temporary files to run with another magazine
     * @param {boolean} NoDeletion Choose whether the generated files have to be deleted or not
     */

    resetFiles(NoDeletion = false) {
        const self = this;
        return new Promise((success, error) => {
            self.Progression = {
                downloaded_images: [],
                renderedvoices: [],
                magazineloaded: false,
                videodone: false,
                content: null
            };
            self.SaveProgression()
            console.log('Saved progress')
            if (NoDeletion) {
                process.exit();
            }
            rimraf.sync(path.join(self.Config.Folder, 'images'));
            rimraf.sync(path.join(self.Config.Folder, 'audio'));
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
                        success(true);
                    });
                });
            });
        });
    }
};