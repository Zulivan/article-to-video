const path = require('path');
const jimp = require('jimp');

module.exports = class ImageMaker {

    constructor(Config) {
        this.Config = Config;


        this.ImageMaker = require(path.join(this.Config.Directory, 'tools', 'ImageMaker.js'));
        this.IM = new this.ImageMaker(this.Config)
    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    /**
     * Generates the pronounciation for a certain amount of accents of a specific word depending on the bot's configuration.
     * @param {object} audio_content Audio content
     */

    generateImages(audio_content) {
        const self = this;
        return new Promise((success, error) => {
            console.log('Generating ' + audio_content.length + ' backgrounds for the word "' + audio_content[0].text + '"!')
            console.log('=====================================================')

            let images = [];

            for (let i in audio_content) {
                images.push({
                    type: 'h2p',
                    text: audio_content[i].text,
                    accent: audio_content[i].extra.name
                });
            };

            self.IM.generateImages(images).then((res) => {
                console.log('success')
                success(res);
            });

        })
    }

}