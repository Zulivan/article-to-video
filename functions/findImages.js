module.exports = function (args, extradata) {
    return new Promise((success, error) => {
        const ImageFinder = require('../classes/ImageFinder.js');
        const IF = new ImageFinder(extradata.Config.Folder, extradata.Config.Name);
    
        let query = args['query'] || 'error alert';

        IF.searchImages(query).then(images => {
            const output = {
                type: 'downloaded_images',
                values: images
            }
            success(output);
        }).catch((err) => {
            error('An error occured because ' + err);
        });
    });
};