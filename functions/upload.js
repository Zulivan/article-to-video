module.exports = function (file, title, subtitles_path, tags, thumbnail) {
    const YoutubeUploader = require('../tools/YoutubeUploader.js');
    const YU = new YoutubeUploader(this.Config, this.oAuth);
    const subtitles = fs.createReadStream(subtitles_path);

    const self = this;
    YU.uploadVideo(file, title, subtitles, tags, thumbnail).then((id) => {
        success(id)
    }).catch((err) => {
        error(err)
    });
};