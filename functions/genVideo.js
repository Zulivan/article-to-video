const path = require('path');

module.exports = function (args, extradata) {
    const VideoCompiler = require('../classes/VideoCompiler.js');

    const loopVideo = extradata.Config.Video.CompilationLoop || false;

    const VC = new VideoCompiler(extradata.Config.Folder, loopVideo);

    const images = extradata.generated_images || [];

    let audioFile = extradata.generated_audio || null;
    if (args['audioFile']) {
        audioFile = args['audioFile'];
        audioFile = path.join(extradata.Config.Folder, 'preset', audioFile);
    }

    console.log('Called gnVideo')

    return new Promise((success, error) => {
        VC.generateVideo(audioFile, images).then((file) => {
            if (file) {
                success(file);
                // const captions = path.join(self.Config.Folder, 'temp', 'captions.txt');
                // const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(' '));
                // const thumbnail = this.Progression.downloaded_images[Math.floor(Math.random() * this.Progression.downloaded_images.length)];
                // console.log('Video has been made');
                // self.uploadVideo(file, self.Progression.content.title, captions, tagsvid, thumbnail);
            } else {
                error('No video generated');
            }
        }).catch((e) => {
            error(e);
        });
    });
};