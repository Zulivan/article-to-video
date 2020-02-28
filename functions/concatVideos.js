module.exports = function (videosToConcat, extradata) {
    return new Promise((success, error) => {
        console.log('Concat videos!')
        const VideoCompiler = require('../classes/VideoCompiler.js');

        let loopVideo = false;
        const VC = new VideoCompiler(extradata.Config.Folder, loopVideo);
        
        VC.concatVideos(videosToConcat, null).then((file) => {
            if (file) {
                const output = {
                    type: 'video',
                    values: file
                };
                success(output);
            } else {
                error('No video generated');
            };
        }).catch((e) => {
            error(e);
        });
    });
};