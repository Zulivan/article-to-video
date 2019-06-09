const fs = require('fs');
const audioconcat = require('audioconcat');
const mp3Duration = require('mp3-duration');
const txtomp3 = require('text-to-mp3');
const path = require('path');
const path = require('path');
const AP = require('../tools/AudioProcess.js');
const DEBUG = true;
module.exports = class AudioManager {
    /**
     * Initializes a MagazineBrowser instance (only used by Bot.js)
     * @param {object} config Config array
     * @param {string} directory Directrory folder
     * @param {string} folder Root directory
     */

    constructor(config = {}) {

        this.Config = config;

        this.Accents = {
            british: {
                langcode: 'en-BR',
                name: 'British English'
            },
            american: {
                langcode: 'en-US',
                name: 'American English'
            },
            australian: {
                langcode: 'en-AU',
                name: 'Australian English'
            },
            indian: {
                langcode: 'en-IN',
                name: 'Indian English'
            }
        };

        this.AudioProcess = new AP(path.join(self.Config.Root, self.Config.Folder, 'audio'))

    }

    generateAudio(word) {
        return new Promise((success, error) => {
            console.log('Generating ' + this.Accents.length + ' pronounciations for the word "' + word + '"!')
            console.log('=====================================================')

            let vocals = [];

            for (let i in this.Accents) {
                vocals.push({
                    lang: this.Accents[i].langcode,
                    text: word,
                    extra: this.Accents[i]
                });
            };

            this.AudioProcess.createCompilation(vocals).then((res) => {
                console.log('success')
                success(res);
            });

        })
    }

};