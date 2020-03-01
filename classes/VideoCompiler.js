const videoshow = require('videoshow');
const mp3Duration = require('mp3-duration');
const path = require('path');
const ffmpeg = require('ffmpeg-concat');
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
        if (DEBUG) console.log('VideoCompiler.js: ' + text);
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

    concatVideos(clipsToConcat, name = 'final') {
        return new Promise((success, error) => {
            ffmpeg({
                output: path.join(this.Config.Folder, name + '.mp4'),
                videos: clipsToConcat,
                transition: {
                    name: 'fade',
                    duration: 300
                }
            }).then(() => {
                success(path.join(this.Config.Folder, 'null.mp4'))
            });
        });
    }

    makeVideo(audiofile, imgrendered, name) {
        const self = this;
        return new Promise((success, error) => {
            const resourcesfolder = self.Config.Folder;
            mp3Duration(audiofile, function (err, duration) {
                if(err) error(err);
                const videolength = Math.floor(duration + 10);
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
                                self.debug('The video is done, now looping it ' + self.Loop + ' times.');

                                let clipsToConcat = [];
                                for (let i = 0; i < self.Loop; i++) {
                                    clipsToConcat.push({
                                        'fileName': path.join(resourcesfolder, name + '.mp4')
                                    })
                                }

                                self.concatVideos(clipsToConcat, name).then((finalpath) => {
                                    success(finalpath);
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