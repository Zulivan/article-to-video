module.exports = function (image_info, extradata) {
    const ImageMaker = require('../classes/ImageMaker.js');
    const IM = new ImageMaker(extradata.Config.Directory, extradata.Config.Folder);

    return new Promise((success, error) => {

        console.log('Generating ' + image_info.length + ' images!');
        console.log('=====================================================');

        IM.generateImages(image_info).then((images) => {
            const output = {
                type: 'generated_images',
                values: images
            }
            success(output);
        }).catch((err) => {
            error(err);
        });
    });

};