module.exports = function (args, extradata) {
    return new Promise((success, error) => {
        const ImageFinder = require('../classes/ImageFinder.js');
        const IF = new ImageFinder(extradata.Config.Folder);
    
        let query = args['query'] || 'error alert';

        if (args['type'] == 'magazine') {
            if (extradata.magazine) {
                query = extradata.magazine.title;
            } else {
                error('No magazine found');
            }
        }

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