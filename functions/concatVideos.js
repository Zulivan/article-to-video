module.exports = function (videosToConcat, extradata) {
    const VideoCompiler = require('../classes/VideoCompiler.js');

    let loopVideo = false;
    const VC = new VideoCompiler(extradata.Config.Folder, loopVideo);
    
    return new Promise((success, error) => {
        VC.concatVideos(videosToConcat, null).then((file) => {
            if (file) {
                success(file);
                // const captions = path.join(self.Config.Folder, 'temp', 'captions.txt');
                // const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(' '));
                // const thumbnail = this.Progression.downloaded_images[Math.floor(Math.random() * this.Progression.downloaded_images.length)];
                // console.log('Video has been made');
                // self.uploadVideo(file, self.Progression.content.title, captions, tagsvid, thumbnail);
            } else {
                error('No video generated');
            };
        }).catch((e) => {
            error(e);
        });
    });
};