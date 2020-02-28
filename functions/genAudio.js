const Config = {
    WordsPerRecording: 15
}

const path = require('path');

function getChunksAmount(content) {
    let amt = 0;
    content = content.split(' ').length;
    const maxwords = Config.WordsPerRecording;
    if (content / maxwords - Math.floor(content / maxwords) > 0) {
        amt = Math.floor(content / maxwords) + 1;
    } else {
        amt = Math.floor(content / maxwords);
    }
    return amt;
};

function convertText2Chunks(content, options) {

    return new Promise((success, error) => {

        let vocals = [];

        const WpR = options['wpr'] || 15;
        const lang = options['lang'] || 'En';

        for (let i = 0; i < getChunksAmount(content); i++) {

            const sentence_array = content.split(' ').slice(i * WpR, i * WpR + WpR);
            let sentence = sentence_array.join(' ') + ',';

            if (sentence_array.length < 12) {
                sentence = sentence + ' Merci d\'avoir regardé!';
            }

            vocals.push({
                lang: lang,
                text: sentence
            });
        };

        success(vocals);
    });
}

function generateVoices(folder, chunks) {
    const AP = require('../classes/AudioProcess.js');
    const AudioProcess = new AP(folder);

    console.log('Generating ~' + chunks.length + ' different vocals using Google\'s voice!')
    console.log('=====================================================')

    const bgpath = path.join(folder, 'preset', 'music.mp3');
    return new Promise((success, error) => {
        AudioProcess.createCompilation(chunks, bgpath).then((audio) => {
            const output = {
                type: 'generated_audio',
                values: audio
            };

            success(output);
        }).catch((err) => {
            error(err);
        });
    });
}

module.exports = function (args, extradata) {
    return new Promise((success, error) => {

        let content = args;
        const folder = extradata.Config.Folder;

        if (Array.isArray(content)) {

            generateVoices(folder, content).then((res) => {
                success(res);
            }).catch(error);

        } else {
            content = args['text'] || 'What do you want me to say?';

            convertText2Chunks(content, args).then((chunks) => {
                generateVoices(folder, chunks).then((res) => {
                    success(res);
                }).catch(error);
            }).catch(error);
        };
    });
};