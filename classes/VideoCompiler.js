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

        concatVideos(clipsToConcat, name = 'video') {
            return new Promise((success, error) => {
                    // console.log(clipsToConcat)
                    // vidconcat({
                    //     silent: true,
                    //     overwrite: true
                    // })
                    // .clips(clipsToConcat)
                    // .output(path.join(this.Config.Folder, name + '.mp4')) //optional absolute file name for output file
                    // .concat().then((outputFileName) => {
                    //     self.debug('Merging finished !');
                    //     self.debug('Video successfully generated at: ' + outputFileName);
                    //     success(path.join(this.Config.Folder, name + '.mp4'));
                    // }).catch(error);
                    console.log(clipsToConcat[0])
                    console.log(clipsToConcat[1])

                    ffmpeg({
                            output: path.join(this.Config.Folder, name + '.mp4'),
                                videos: clipsToConcat,
                                transition: {
                                    name: 'directionalWipe',
                                    duration: 500
                                }
                            })

                        success(path.join(this.Config.Folder, name + '.mp4'));
                    });
            }

            makeVideo(audiofile, imgrendered, name) {
                const self = this;

                const compilationName = name + '-c';

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

                        console.log(imgrendered)

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