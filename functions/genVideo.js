const path = require('path');

module.exports = function (args, extradata) {

    let loopVideo = false;
    let audioFile = extradata.generated_audio.file;
    console.log(extradata.generated_audio);
    let name = 'video';

    if(args){
        if (args['audioFile']) {
            audioFile = args['audioFile'];
            audioFile = path.join(extradata.Config.Folder, 'preset', audioFile);
        }
        if (args['fileName']) {
            name = args['fileName'];
        }
        if (args['loop']) {
            loopVideo = args['loop'];
        }
    }

    const images = extradata.generated_images || [];

    const VideoCompiler = require('../classes/VideoCompiler.js');
    const VC = new VideoCompiler(extradata.Config.Folder, loopVideo);

    return new Promise((success, error) => {

        VC.generateVideo(audioFile, images, name).then((file) => {
            if (file) {
                const output = {
                    type: 'video',
                    values: file
                };
                success(output);
                // const captions = path.join(self.Config.Folder, 'temp', 'captions.txt');
                // const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(' '));
                // const thumbnail = this.Progression.downloaded_images[Math.floor(Math.random() * this.Progression.downloaded_images.length)];
                // console.log('Video has been made');
                // self.uploadVideo(file, self.Progression.content.title, captions, tagsvid, thumbnail);
            } else {
                error('No video generated');
            }
        }).catch((e) => {
            error('And error occurred while generating the video: '+e);
        });
    });
};