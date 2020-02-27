const path = require('path');
const fs = require('fs');
const jimp = require('jimp');

module.exports = function (folder, id, image) {

    const text = image.text;
    const accent = image.extra.name;
    const background_path = image.background;

    const output_path = path.join(folder, 'images', 'image' + id + '.jpg');

    return new Promise((success, error) => {
        jimp.loadFont(jimp.FONT_SANS_128_WHITE).then(function (font) {
            jimp.read(background_path, function (err, imagebuffer) {
                imagebuffer.quality(60).print(font, 0, 210, {
                    text: text,
                    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
                }, 1100, 720).print(font, 0, 500, {
                    text: accent,
                    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
                }, 1100, 720).write(output_path);

                success(output_path);
            });
        });
    });
};