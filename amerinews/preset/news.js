const path = require('path');
const fs = require('fs');
const jimp = require('jimp');

module.exports = function (folder, _, image) {
    return new Promise((success, error) => {
        const maxchars = 60;
        const index = image.id;
        const sentence = image.text;
        const images = image.array;
    
        let chars = sentence.split('');
        let currchars = 0;
        let loopsdone = 0;
        let recoveryindex = 0;
        let roundedmultiple = 1;

        if (chars.length / maxchars - Math.floor(chars.length / maxchars) > 0) {
            roundedmultiple = Math.floor(chars.length / maxchars) + 1;
        } else {
            roundedmultiple = Math.floor(chars.length / maxchars);
        }

        console.log(chars.length + ' characters counted, they will be typed on ' + roundedmultiple + ' lines.');

        let sentencet = '';

        const randomimage = images[Math.floor(Math.random() * images.length)];
        const blocktop = 720 - 25 * roundedmultiple - 10;
        const randomImagePath = randomimage.path;

        const finalDirectory = path.join(folder, 'images', 'image' + index + '.jpg');

        jimp.loadFont(jimp.FONT_SANS_32_BLACK).then((font2) => {
            jimp.read(path.join(folder, 'preset', 'background.png')).then((prebackground) => {
                prebackground.resize(1080, 25 * roundedmultiple + 10).quality(60);

                jimp.read(randomImagePath).then((imagebuffer) => {

                    imagebuffer.composite(prebackground, 0, blocktop)
                    imagebuffer.quality(60);
                    for (let i = 0; i < chars.length; i++) {
                        currchars = currchars + 1;
                        sentencet += chars[i];
                        if (currchars >= maxchars) {
                            imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, sentencet)
                            currchars = 0;
                            loopsdone = loopsdone + 1;
                            sentencet = '';
                            recoveryindex = i;
                        };
                    };

                    if (chars.length >= (loopsdone * maxchars)) {
                        imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, chars.slice(recoveryindex, chars.length - 1).join("") + ".")
                    };

                    imagebuffer.write(finalDirectory);

                    success(finalDirectory);
                }).catch((err) => {
                    console.log('Cannot load background image ' + err);
                });
            }).catch((err) => {
                console.log('Cannot load the subtitle background ' + err);
            });
        }).catch((err) => {
            console.log('Cannot load jimps black font ' + err);
        });
    });
};