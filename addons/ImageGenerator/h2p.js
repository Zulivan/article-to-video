const path = require('path');
const fs = require('fs');
const jimp = require('jimp');

module.exports = function (id, image) {
    const text = image.text;
    const accent = image.accent;
    const duration = image.duration;

    const background_path = path.join(folder, 'preset', 'background.jpg');
    const output_path = path.join(folder, 'images', 'image' + id + '.jpg');
    const save_file = path.join(folder, 'images', 'image' + id + '.json');

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

                const output = {
                    vocal: id,
                    values: {
                        path: output_path,
                        loop: duration
                    }
                };

                fs.writeFile(save_file, JSON.stringify(output), function (errfile) {
                    console.log('Vocal #' + id + ' has its video part!');
                    success(output);
                });
            });
        });

    });
};