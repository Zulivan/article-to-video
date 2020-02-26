const videoStitch = require('video-stitch');
const concat = videoStitch.concat;
const videoshow = require('videoshow');
const mp3Duration = require('mp3-duration');
const path = require('path');
const fs = require('fs');
const DEBUG = true;

module.exports = class VideoCompiler {
    /**
     * VideoCompiler, makes images according to their vocal id and produces the video
     * @param {object} config Config array
     */

    constructor(folder, loop = false) {

        this.Config = {
            Folder: folder
        }

        this.Loop = loop;
    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    generateVideo(audio, values, name = 'video') {
        const self = this;
        return new Promise((success, error) => {
            let imgrendered = [];
            for (let i = 0; i < values.length; i++) {
                imgrendered.push(values[i].values);
            };
            self.makeVideo(audio, imgrendered, name).then((file) => {
                success(file);
            });
        });
    }

    makeVideo(audiofile, imgrendered, name) {
        const self = this;

        const compilationName = name+'-c';

        return new Promise((success, error) => {
            const resourcesfolder = self.Config.Folder;
            // path.join(resourcesfolder, 'audio', 'compilation.mp3')
            mp3Duration(audiofile, function (err, duration) {
                const videolength = Math.floor(duration + 10);
                if (duration < 1) {
                    self.debug('This video length is ' + duration + ' seconds, it is set as suspected of being glitched, resetting...')
                    success(null);
                } else {
                    self.debug('The duration of the audio file is ' + videolength + ' seconds!')
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
                        .audio(audiofile)
                        .save(path.join(resourcesfolder, name + '.mp4'))
                        .on('start', function (command) {
                            self.debug('The video is in preparation...')
                        }).on('error', function (err) {
                            self.debug(err)
                            success(false);
                        }).on('end', function (output) {
                            if (self.Loop > 0) {
                                self.debug('The video is done, now looping it ' + self.Loop + ' times.')
                                let clipsToConcat = [];

                                for (let i = 0; i < self.Loop; i++) {
                                    clipsToConcat.push({
                                        'fileName': path.join(resourcesfolder, name + '.mp4')
                                    })
                                }

                                concat({
                                        silent: true,
                                        overwrite: true
                                    })
                                    .clips(clipsToConcat)
                                    .output(path.join(resourcesfolder, compilationName + '.mp4')) //optional absolute file name for output file
                                    .concat().then((outputFileName) => {
                                        self.debug('Merging finished !');
                                        self.debug('Video successfully generated at: ' + outputFileName);
                                        fs.unlinkSync(path.join(resourcesfolder, name + '.mp4'))
                                        success(path.join(resourcesfolder, compilationName + '.mp4'));
                                    });
                            } else {
                                self.debug('Video successfully generated at: ' + output);
                                success(path.join(resourcesfolder, name + '.mp4'));
                            };
                        })
                }, 5000)
            });
        });
    }

}