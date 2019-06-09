const fs = require('fs');
const audioconcat = require('audioconcat');
const mp3Duration = require('mp3-duration');
const txtomp3 = require('text-to-mp3');
const path = require('path');
const DEBUG = true;

module.exports = class AudioProcess {
    constructor(Folder) {

        this.Folder = Folder;

        this.AudioFiles = [];
        this.MinusIndex = 0;

    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    audioChunk(data, index) {
        const self = this;
        return new Promise((success, error) => {
            fs.exists(path.join(this.Folder, 'vocal' + index + '.json'), (exists) => {
                if (exists) {
                    self.debug('File with id ' + index + '.mp3 is already recorded, adding its metadata to the audio files to process..');
                    self.MinusIndex += 1;
                    const output = JSON.parse(fs.readFileSync(path.join(self.Folder, 'vocal' + index + '.json'), 'utf8'));
                    success(output);
                } else {
                    const extra = data.extra || null;
                    setTimeout(function () {
                        self.debug('Generating audio file #' + index + '...');
                        try {
                            txtomp3.saveMP3(data.lang, data.text, path.join(self.Folder, 'vocal' + index + '.mp3'), function (err1, absoluteFilePath) {
                                if (err1) {
                                    self.debug(err1)
                                    success(null);
                                } else {
                                    self.debug('Calculating mp3 duration')
                                    setTimeout(function () {
                                        mp3Duration(path.join(self.Folder, 'vocal' + index + '.mp3'), function (err2, duration) {
                                            if (err2 || duration == 0) {
                                                self.debug('The file has a problem, error ' + err2 + ', duration: ' + duration);
                                                success(null);
                                            } else {
                                                self.debug('File saved with a duration of ' + duration + ' seconds.')
                                                const output = {
                                                    id: index,
                                                    duration: duration,
                                                    text: data.text,
                                                    extra: extra
                                                };
                                                fs.writeFile(path.join(self.Folder, 'vocal' + index + '.json'), JSON.stringify(output), function (errfile) {
                                                    success(output);
                                                });
                                            };
                                        });
                                    }, 1000);
                                };
                            });
                        } catch (error) {
                            console.log('Error while downloading, returning a null value');
                            success(null);
                        };
                    }, 5000 * (index - self.MinusIndex));
                };
            });
        });
    }

    generateCompilation(files) {
        const self = this;
        return new Promise((success, error) => {
            audioconcat(files).concat(path.join(self.Folder, 'compilation.mp3')).on('start', function (command) {
                self.debug('The vocals made by synthesized voice are going to be compiled..');
            }).on('error', function (err, stdout, stderr) {
                console.error('Voice compilation Error:', err)
                console.error('ffmpeg stderr:', stderr)
                throw err;
            }).on('end', function (output) {
                success(output);
            })
        });
    }

    /**
     * Create a file that concatenates multiple sentences to speech
     * @param {object} audioToGenerate Contains audio informations to be generated
     */

    createCompilation(audioToGenerate = []) {
        const self = this;
        return new Promise((success, error) => {
            let promises = [];

            for (let i = 0; i < audioToGenerate.length; i++) {
                promises.push(self.audioChunk(audioToGenerate[i], i));
            };

            Promise.all(promises).then((values) => {
                values = values.filter(v => v != null);

                if (audioToGenerate.length > values) {
                    self.debug(audioToGenerate.length + ' > ' + values + ': restarting');
                    return self.createCompilation(audioToGenerate);
                } else {
                    fs.exists(path.join(this.Folder, 'compilation.mp3'), (exists) => {
                        if (exists) {
                            mp3Duration(path.join(this.Folder, 'compilation.mp3'), function (err2, duration) {
                                if (duration == 0) {
                                    self.debug('The compilation happens to be corrupted (Determined length: ' + duration + ')');

                                    self.AudioFiles = [];

                                    for (let i = 0; i < values.length; i++) {
                                        self.AudioFiles.push(path.join(this.Folder, 'vocal' + i + '.mp3'));
                                    }

                                    self.generateCompilation(self.AudioFiles).then((res) => {
                                        success(values);
                                    })
                                } else {
                                    success(values);
                                };
                            });
                        } else {
                            self.AudioFiles = [];

                            for (let i = 0; i < values.length; i++) {
                                self.AudioFiles.push(path.join(this.Folder, 'vocal' + i + '.mp3'));
                            };

                            self.generateCompilation(self.AudioFiles).then((res) => {
                                success(values)
                            });
                        };
                    });
                };
            });
        });
    };
}