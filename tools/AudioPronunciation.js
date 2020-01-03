const path = require('path');
module.exports = class AudioPronunciation {
    /**
     * Initialize
     * @param {object} config Config array
     */

    constructor(config = {}) {

        this.Config = config;

        this.Accents = {
            australian: {
                langcode: 'en-AU',
                name: 'Australian English'
            },
            british: {
                langcode: 'en',
                name: 'British English'
            },
            indian: {
                langcode: 'en-IN',
                name: 'Indian English'
            },
            american: {
                langcode: 'en-US',
                name: 'American English'
            }
        };

        this.AP = require(path.join(this.Config.Directory, 'classes', 'AudioProcess.js'));
        this.AudioProcess = new this.AP(path.join(this.Config.Directory, this.Config.Folder, 'audio'))

    }

    /**
     * Generates the pronounciation for a certain amount of accents of a specific word depending on the bot's configuration.
     * @param {object} word Word to say
     */

    generateAudio(word) {
        const self = this;
        return new Promise((success, error) => {
            console.log('Generating ' + Object.keys(self.Accents).length + ' pronounciations for the word "' + word + '"!')
            console.log('=====================================================')

            let vocals = [];

            for (let i in self.Accents) {
                vocals.push({
                    lang: self.Accents[i].langcode,
                    text: word,
                    extra: self.Accents[i]
                });
            };

            self.AudioProcess.createCompilation(vocals).then((res) => {
                console.log('success')
                success(res);
            });

        })
    }

};