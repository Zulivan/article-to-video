const videoStitch = require('video-stitch');
const concat = videoStitch.concat;
const videoshow = require('videoshow');
const mp3Duration = require('mp3-duration');
const path = require('path');

const DEBUG = true;

module.exports = class VideoCompiler {
    /**
     * VideoCompiler, makes images according to their vocal id and produces the video
     * @param {object} config Config array
     */

    constructor(config = {}) {

        this.Config = config;

    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    generateVideo(audio, values) {
        const self = this;
        return new Promise((success, error) => {
            let imgrendered = [];
            for (let i = 0; i < values.length; i++) {
                imgrendered.push(values[i].values);
            };
            self.makeVideo(imgrendered).then((file) => {
                success(file);
            });
        });
    }

    makeVideo(imgrendered) {
        const self = this;
        return new Promise((success, error) => {
            const resourcesfolder = self.Config.Folder;
            mp3Duration(path.join(resourcesfolder, 'audio', 'compilation.mp3'), function (err, duration) {
                const videolength = Math.floor(duration + 10);
                if (duration < 1) {
                    self.debug('This video length is ' + duration + ' seconds, it is set as suspected of being glitched, resetting...')
                    success(null);
                } else {
                    self.debug('The vocals made by synthesized voice were compiled and its duration is ' + videolength + ' seconds!')
                }
                const options = {
                    fps: 30,
                    loop: (videolength / imgrendered.length),
                    transition: false,
                    transitionDuration: 0,
                    videoBitrate: 1024,
                    videoCodec: 'libx264',
                    pixelFormat: 'yuv420p',
                    size: '1280x720',
                    audioBitrate: '128k',
                    audioChannels: 1,
                    format: 'mp4'
                };
                imgrendered[imgrendered.length - 1].loop = imgrendered[imgrendered.length - 1].loop + 2
                setTimeout(function () {
                    self.debug('Videoshow is starting...')
                    videoshow(imgrendered, options)
                        .audio(path.join(resourcesfolder, 'audio', 'compilation.mp3'))
                        .save(path.join(resourcesfolder, 'video.mp4'))
                        .on('start', function (command) {
                            self.debug('The video is in preparation...')
                        }).on('error', function (err) {
                            self.debug(err)
                            success(false);
                        }).on('end', function (output) {
                            if (self.Config.CompliationLoop) {

                                let clipsToConcat = [];

                                for (i = 0; i < self.Config.CompliationLoop; i++) {
                                    clipsToConcat.push({
                                        'fileName': path.join(resourcesfolder, 'video.mp4')
                                    })
                                }
                                self.debug('The video is done, now looping it ' + self.Config.CompliationLoop + ' times.')
                                concat({
                                        silent: true, // optional. if set to false, gives detailed output on console
                                        overwrite: true // optional. by default, if file already exists, ffmpeg will ask for overwriting in console and that pause the process. if set to true, it will force overwriting. if set to false it will prevent overwriting.
                                    })
                                    .clips(clipsToConcat)
                                    .output(path.join(resourcesfolder, 'compilation.mp4')) //optional absolute file name for output file
                                    .concat().then((outputFileName) => {
                                        self.debug('Merging finished !');
                                        success(path.join(resourcesfolder, 'compilation.mp4'));
                                    });
                            } else {
                                self.debug('Video successfully generated at: ' + output)
                            };
                        })
                }, 5000)
            });
        });
    }

}