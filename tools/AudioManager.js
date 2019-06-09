const fs = require('fs');
const audioconcat = require('audioconcat');
const mp3Duration = require('mp3-duration');
const txtomp3 = require('text-to-mp3');
const path = require('path');
const AP = require('../tools/AudioProcess.js');
const DEBUG = true;

module.exports = class AudioManager {
    /**
     * Initializes an AudioManager instance
     * @param {object} config Config array
     * @param {string} directory Directrory folder
     * @param {string} folder Root directory
     */

    constructor(config = {}) {

        this.Config = config;

        this.Config.WordsPerRecording = 15;
        this.Config.MaxChars = 60;
        this.MinusIndex = 0;
        this.vocalfiles = [];

        this.AudioProcess = new AP(path.join(self.Config.Root, self.Config.Folder, 'audio'))

    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    getVocalsAmount(content) {
        let amt = 1;
        content = content.split(" ").length;
        const maxwords = this.Config.WordsPerRecording;
        if (content / maxwords - Math.floor(content / maxwords) > 0) {
            amt = Math.floor(content / maxwords) + 1;
        } else {
            amt = Math.floor(content / maxwords);
        }
        return amt;
    }

    generateAudio(content) {
        const self = this;
        return new Promise((success, error) => {
            self.Content = content;
            const total = self.getVocalsAmount(content);

            console.log('Generating ~' + total + ' different vocals using googles voice!')
            console.log('=====================================================')

            let vocals = [];

            for (let i = 0; i < total; i++) {
                const WpR = self.Config.WordsPerRecording;
                const sentence_array = content.slice(index * WpR, index * WpR + WpR);
                let sentence = sentence_array.join(' ') + '.';
                if (sentence_array.length < 12) {
                    sentence = sentence + ' Merci d\'avoir regardé!';
                }
                vocals.push({
                    lang: self.Config.LCode,
                    text: sentence
                });
            };

            this.AudioProcess.createCompilation(vocals).then((res) => {
                console.log('success')
                success(res);
            });
        });
    }
}