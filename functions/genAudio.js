const AudioManager = require('../tools/AudioManager.js');
const AM = new AudioManager(this.Config, this.Config.Directory, this.Config.Folder);

module.exports = function (args) {

    return new Promise((success, error) => {
        const content = args;

        AM.generateAudio(content).then((audio) => {
            success(audio)
            // this.SaveProgression('renderedvoices', audio)
            // this.makeBackgroundImages(audio, images);
        }).catch((err) => {
            error(err)
        });
    });
};