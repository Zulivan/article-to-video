module.exports = function (images) { 
    const VideoCompiler = require('../tools/VideoCompiler.js');
    const VC = new VideoCompiler(this.Config);
    const self = this;
    return new Promise((success, error) => {
        VC.generateVideo(path.join(self.Config.Folder, 'audio', 'compilation.mp3'), images).then((file, reset) => {
            if (file) {
                const captions = path.join(self.Config.Folder, 'temp', 'captions.txt');
                const tagsvid = self.Progression.content.propertitle.concat(self.Progression.content.propertitle.split(' '));
                const thumbnail = this.Progression.downloaded_images[Math.floor(Math.random() * this.Progression.downloaded_images.length)];
                // console.log('Video has been made');
                // self.uploadVideo(file, self.Progression.content.title, captions, tagsvid, thumbnail);
            } else {
                process.exit();
            }
        });
    });
};