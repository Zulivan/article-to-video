module.exports = function (args, extradata) {

    const type = args[0];
    const images = extradata.downloaded_images;
    const audio = extradata.generated_audio;

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