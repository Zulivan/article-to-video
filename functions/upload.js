module.exports = function (args, extradata) {

    const file = args['file'];
    const title = args['title'] || 'No title';
    const subtitles = args['subtitles'];
    const tags = args['tags'];
    const thumbnail = args['thumbnail'];
    
    return new Promise((success, error) => {
        
        const YoutubeUploader = require('../classes/YoutubeUploader.js');
        const YU = new YoutubeUploader(extradata.Config.Folder, extradata.Config.oAuth);

        console.log(args);

        YU.uploadVideo(file, title, subtitles, tags, thumbnail).then((id) => {
            success(id)
        }).catch((err) => {
            error(err)
        });
    });
};