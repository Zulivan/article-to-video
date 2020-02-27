const Config = {
    WordsPerRecording: 15
}

const path = require('path');

function getChuncksAmount(content) {
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

function convertText2Chunks(content, lang) {

    return new Promise((success, error) => {

        const total = getChuncksAmount(content);

        console.log('Generating ~' + total + ' different vocals using Google\'s voice!')
        console.log('=====================================================')

        let vocals = [];

        for (let i = 0; i < total; i++) {
            const WpR = 15;

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

        AudioProcess.createCompilation(vocals).then((res) => {
            success(res);
        });
    });
}

function generateVoices(folder, chunks) {
    const AP = require('../classes/AudioProcess.js');
    const AudioProcess = new AP(path.join(folder));

    return new Promise((success, error) => {
        AudioProcess.createCompilation(chunks).then((audio) => {

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

    console.log('Called twice wtf')

    return new Promise((success, error) => {

        const content = args;
        const folder = extradata.Config.Folder;

        if (Array.isArray(content)) {

            generateVoices(folder, content).then((res) => {
                success(res);
            });

        } else {
            convertText2Chunks(content, extradata.Config.LCode).then((chunks) => {

                generateVoices(folder, chunks).then((res) => {
                    success(res);
                });

            });
        };
    });
};