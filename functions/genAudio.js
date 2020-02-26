const AudioManager = require('../tools/AudioManager.js');
const AM = new AudioManager(this.Config, this.Config.Directory, this.Config.Folder);

module.exports = function (args) {

    return new Promise((success, error) => {
        const content = args;

        AM.generateAudio(content).then((audio) => {

            const output = {
                type: 'generated_audio',
                values: audio
            }

            success(output)
        }).catch((err) => {
            error(err)
        });
    });
};