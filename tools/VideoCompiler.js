const fs = require('fs');
const videoshow = require('videoshow');
const mp3Duration = require('mp3-duration');
const path = require('path');
const jimp = require('jimp');

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
            console.log(imgrendered);
            mp3Duration('./' + resourcesfolder + '/audio/compilation.mp3', function (err, duration) {
                const videolength = Math.floor(duration + 8);
                if (duration < 1) {
                    console.log('This video length is ' + duration + ' seconds, it is set as suspected of being glitched, resetting...')
                    success(null);
                } else {
                    console.log('The vocals made by synthesized voice were compiled and its duration is ' + videolength + ' seconds!')
                }
                const options = {
                    fps: 20,
                    loop: (videolength / imgrendered.length),
                    transition: false,
                    transitionDuration: 0,
                    videoBitrate: 1024,
                    videoCodec: 'libx264',
                    pixelFormat: 'yuv420p',
                    size: '640x?',
                    audioBitrate: '128k',
                    audioChannels: 1,
                    format: 'mp4'
                };
                setTimeout(function () {
                    console.log('Videoshow is starting')
                    videoshow(imgrendered, options)
                        .audio('./' + resourcesfolder + '/audio/compilation.mp3')
                        .save('./' + resourcesfolder + '/video.mp4')
                        .on('start', function (command) {
                            console.log('The video is in preparation...')
                        }).on('error', function (err) {
                            console.log(err)
                            success(false);
                        }).on('end', function (output) {
                            console.log('The video is done.')
                            success('./' + resourcesfolder + '/video.mp4')
                        })
                }, 5000)
            });
        });
    }

}