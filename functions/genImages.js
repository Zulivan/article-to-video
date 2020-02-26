module.exports = function (audio, img_srcs) {
    const ImageMaker = require('../classes/ImageMaker.js');
    const IM = new ImageMaker(this.Config);
    const self = this;

    return new Promise((success, error) => {
        console.log('Generating ' + audio.length + ' images!');
        console.log('=====================================================');

        let image_info = [];

        for (let i in audio) {
            image_info.push({
                type: 'news',
                id: audio[i].id,
                text: audio[i].text,
                duration: audio[i].duration,
                array: img_srcs
            });
        };

        IM.generateImages(image_info).then((images) => {
            const output = {
                type: 'generated_images',
                values: images
            }
            
            success(output);
        });
    });

};