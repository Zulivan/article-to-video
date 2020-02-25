const path = require('path');
const fs = require('fs');
const jimp = require('jimp');

module.exports = function (folder, id) {
    const text = 'Slide: ' + id;

    const rect_x = [180, 850];
    const rect_y = [100, 240];

    const background_path = path.join(folder, 'preset', 'background.png');

    const red_path = path.join(folder, 'preset', 'red.png');
    const green_path = path.join(folder, 'preset', 'green.png');
    const blue_path = path.join(folder, 'preset', 'blue.png');

    const output_path = path.join(folder, 'images', 'image' + id + '.jpg');

    return new Promise((success, error) => {
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
        }

        jimp.read(red_path, (err1, red_img) => {
            if (err1) throw err1;
            red_img
                .resize(getRandomInt(rect_x[0], rect_x[1]), getRandomInt(rect_y[0], rect_y[1])) // resize
                .quality(60) // set JPEG quality

            jimp.read(green_path, (err2, green_img) => {
                if (err2) throw err2;
                green_img
                    .resize(getRandomInt(rect_x[0], rect_x[1]), getRandomInt(rect_y[0], rect_y[1])) // resize
                    .quality(60) // set JPEG quality

                jimp.read(blue_path, (err3, blue_img) => {
                    if (err3) throw err3;
                    blue_img
                        .resize(getRandomInt(rect_x[0], rect_x[1]), getRandomInt(rect_y[0], rect_y[1])) // resize
                        .quality(60) // set JPEG quality

                    jimp.loadFont(jimp.FONT_SANS_128_BLACK).then((font) => {
                        jimp.read(background_path, (err, imagebuffer) => {
                            imagebuffer.composite(blue_img, getRandomInt(0, 500), getRandomInt(15, 340))
                                .composite(green_img, getRandomInt(0, 500), getRandomInt(15, 340))
                                .composite(red_img, getRandomInt(0, 500), getRandomInt(15, 340))
                                .quality(60).print(font, 10, 10, {
                                    text: text,
                                    alignmentX: jimp.HORIZONTAL_ALIGN_CENTER
                                }, 1100, 720).write(output_path);

                            success(output_path);
                        });
                    });
                });
            });
        });
    });
};