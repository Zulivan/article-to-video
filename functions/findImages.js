module.exports = function (args) {
    const ImageFinder = require('../tools/ImageFinder.js');
    const IF = new ImageFinder(this.Config, this.Config.Folder);

    const query = args;
    return new Promise((success, error) => {
        IF.searchImages(query).then((images) => {
                console.log('Downloaded all the required images');

                const output = {
                    type: 'downloaded_images',
                    values: images
                }

                success(output);
        }).catch((err) => {
            error('An error occured because ' + err + ', running reset..');
        });
    });
};