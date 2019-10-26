const videoStitch = require('video-stitch');
const concat = videoStitch.concat;
const videoshow = require('videoshow');
const mp3Duration = require('mp3-duration');

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
                const videolength = Math.floor(duration + 10);
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
                    size: '1280x720',
                    audioBitrate: '128k',
                    audioChannels: 1,
                    format: 'mp4'
                };
                imgrendered[imgrendered.length - 1].loop = imgrendered[imgrendered.length - 1].loop + 2
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
                            console.log('The video is done, now looping it 3 times.')
							concat({
								silent: false, // optional. if set to false, gives detailed output on console
								overwrite: true // optional. by default, if file already exists, ffmpeg will ask for overwriting in console and that pause the process. if set to true, it will force overwriting. if set to false it will prevent overwriting.
							  })
							  .clips([
								{
								  'fileName': './' + resourcesfolder + '/video.mp4'
								},
								{
								  'fileName': './' + resourcesfolder + '/video.mp4'
								},
								{
								  'fileName': './' + resourcesfolder + '/video.mp4'
								}
							  ])
							  .output('./' + resourcesfolder + '/compilation.mp4') //optional absolute file name for output file
							  .concat().then((outputFileName) => {
								console.log('Merging finished !');
								success('./' + resourcesfolder + '/compilation.mp4');
							  });

                        })
                }, 5000)
            });
        });
    }

}