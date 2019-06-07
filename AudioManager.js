const fs = require('fs');
const audioconcat = require('audioconcat');
const mp3Duration = require('mp3-duration');
const txtomp3 = require('text-to-mp3');
const path = require('path');
const DEBUG = true;

module.exports = class AudioManager {
    /**
     * Initializes a MagazineBrowser instance (only used by Bot.js)
     * @param {object} config Config array
     * @param {string} directory Directrory folder
     * @param {string} folder Root directory
     */

    constructor(config = {}, directory, folder = 'none') {

        this.Config = config;
        this.Config.Directory = directory;
        if (!this.Config.Folder) {
            this.Config.Folder = folder;
        };

        this.Config.WordsPerRecording = 15;
        this.Config.MaxChars = 60;
        this.MinusIndex = 0;
        this.vocalfiles = [];

    }

    debug(text) {
        if (DEBUG) console.log(text);
    }

    audioChunk(index) {
        const self = this;
        return new Promise((success, error) => {
            fs.exists(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal' + index + '.json'), (exists) => {
                if (exists) {
                    self.debug('File vocal' + index + '.mp3 already recorded, skipping..');
                    self.MinusIndex += 1;
                    const output = JSON.parse(fs.readFileSync(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal' + index + '.json'), 'utf8'));
                    success(output);
                } else {
                    setTimeout(function () {
                        const content = self.Content.split(' ');
                        const WpR = self.Config.WordsPerRecording;
                        const sentence_array = content.slice(index * WpR, index * WpR + WpR);
                        let sentence = sentence_array.join(' ') + ".";
                        if (sentence_array.length < 12) {
                            sentence = sentence + ' Merci d\'avoir regardé!';
                        }
                        console.log('Vocal #' + index + ' is going to be made.');
                        self.debug('Saving mp3')
                        try {
                            txtomp3.saveMP3(self.Config.LCode, sentence, path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal' + index + '.mp3'), function (err1, absoluteFilePath) {
                                if (err1) {
                                    console.log(err1)
                                    success(null);
                                } else {
                                    self.debug('Calculating mp3 duration')
                                    setTimeout(function () {
                                        mp3Duration(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal' + index + '.mp3'), function (err2, duration) {
                                            if (err2 || duration == 0) {
                                                self.debug('duration: ' + duration + ', wrong file')
                                                success(null);
                                            } else {
                                                self.debug('File saved with a duration of ' + duration + ' seconds.')
                                                const output = {
                                                    vocalid: index,
                                                    duration: duration,
                                                    sentence: sentence
                                                };
                                                fs.writeFile(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal' + index + '.json'), JSON.stringify(output), function (errfile) {
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
                }
            });
        });
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
                vocals.push(self.audioChunk(i));
            };

            Promise.all(vocals).then((values) => {
                values = values.filter(v => v != null);

                if (total > values) {
                    console.log(total + ' > ' + values + ': restarting');
                    return self.generateAudio(content);
                } else {
                    self.vocalfiles = [];
                    fs.exists(path.join(self.Config.Root, self.Config.Folder, 'audio', 'compilation.mp3'), (exists) => {
                        if (exists) {
                            mp3Duration(path.join(self.Config.Root, self.Config.Folder, 'audio', 'compilation.mp3'), function (err2, duration) {
                                if (duration < 1) {
                                    console.log('Compilation has a wrong duration ' + duration)
                                    fs.readdir('./' + self.Config.Folder + '/audio', function (err, files2) {
                                        files2.forEach(function (file) {
                                            if (file.indexOf('.mp3') > -1) {
                                                self.vocalfiles.push(path.join(self.Config.Root, self.Config.Folder, 'audio', file));
                                            };
                                        });

                                        audioconcat(self.vocalfiles).concat(path.join(self.Config.Root, self.Config.Folder, 'audio', 'compilation.mp3')).on('start', function (command) {
                                            console.log('The vocals made by synthesized voice are going to be compiled..');
                                        }).on('error', function (err, stdout, stderr) {
                                            console.error('Voice compilation Error:', err)
                                            console.error('ffmpeg stderr:', stderr)
                                            throw err;
                                        }).on('end', function (output) {
                                            success(values);
                                        })
                                    });
                                } else {
                                    success(values);
                                }
                            });
                        } else {

                            for (let i = 0; i < values.length; i++) {
                                self.vocalfiles.push(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal' + i + '.mp3'));
                            }

                            audioconcat(self.vocalfiles).concat(path.join(self.Config.Root, self.Config.Folder, 'audio', 'compilation.mp3')).on('start', function (command) {
                                console.log('The vocals made by synthesized voice are going to be compiled..');
                            }).on('error', function (err, stdout, stderr) {
                                console.error('Voice compilation Error:', err)
                                console.error('ffmpeg stderr:', stderr)
                                throw err;
                            }).on('end', function (output) {
                                success(values);
                            })
                        }
                    });
                }
            });
        });
    }
}