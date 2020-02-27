module.exports = function (args, extradata) {

    const file = args['file'];
    const title = args['title'];
    const subtitles_path = args['subtitles'];
    const subtitles = fs.createReadStream(subtitles_path);
    const tags = args['tags'];
    const thumbnail = args['thumbnail'];
    // const 

    const YoutubeUploader = require('../tools/YoutubeUploader.js');
    const YU = new YoutubeUploader(extradata.Config, extradata.oAuth);

    YU.uploadVideo(file, title, subtitles, tags, thumbnail).then((id) => {
        success(id)
    }).catch((err) => {
        error(err)
    });
};