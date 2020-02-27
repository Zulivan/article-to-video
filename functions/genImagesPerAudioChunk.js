module.exports = function (args, extradata) {

    const type = args['type'];

    const img_srcs = extradata.downloaded_images || [];

    const audio = extradata.generated_audio;

    const ImageMaker = require('../classes/ImageMaker.js');
    const IM = new ImageMaker(extradata.Config.Directory, extradata.Config.Folder);

    return new Promise((success, error) => {
        console.log('Generating ' + audio.length + ' images!');
        console.log('=====================================================');

        let image_info = [];

        for (let i in audio) {
            image_info.push({
                type: type,
                extra: audio[i].extra,
                id: audio[i].id,
                text: audio[i].text,
                duration: audio[i].duration,
                array: img_srcs,
                background: args['background'] || null
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