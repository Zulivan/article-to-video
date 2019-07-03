const path = require('path');

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

    generateImages(audio_content, image_srcs) {
        const self = this;
        return new Promise((success, error) => {
            console.log('Generating ' + audio_content.length + ' images!')
            console.log('=====================================================')

            let images = [];

            for (let i in audio_content) {
                images.push({
                    type: 'news',
                    id: audio_content[i].id,
                    text: audio_content[i].text,
                    duration: audio_content[i].duration,
                    array: image_srcs
                });
            };

            self.IM.generateImages(images).then((res) => {
                success(res);
            });

        })
    }

}