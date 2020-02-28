module.exports = function (args, extradata) {
    const ImageMaker = require('../classes/ImageMaker.js');
    const IM = new ImageMaker(extradata.Config.Directory, extradata.Config.Folder);

    return new Promise((success, error) => {

        const overlay = args['overlay'];
        const background = args['background'];

        IM.generateThumbnail(overlay, background).then((thumbnail) => {
            const output = {
                type: 'thumbnail',
                values: thumbnail
            }
            success(output);
        }).catch(error);
    });

};