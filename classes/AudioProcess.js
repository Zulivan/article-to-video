const fs = require('fs');
const audioconcat = require('audioconcat');
const mp3Duration = require('mp3-duration');
const tts = require('gtranslate-tts');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const DEBUG = true;

module.exports = class AudioProcess {
    constructor(Folder) {

        const audioFolder = path.join(Folder, 'audio');

        if (!fs.existsSync(audioFolder)) {
            fs.mkdirSync(audioFolder);
        }

        this.Directory = Folder;
        this.Folder = audioFolder;
        this.AudioFiles = [];

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
                    const output = JSON.parse(fs.readFileSync(path.join(self.Folder, 'vocal' + index + '.json'), 'utf8'));
                    success(output);
                } else {
                    const extra = data.extra || null;
                    
                    self.debug('Generating audio file #' + index + '...');
                    tts.saveMP3(data.text, path.join(self.Folder, 'vocal' + index + '.mp3'), data.lang).then((absoluteFilePath) => {
                        self.debug('Getting mp3 duration...')
                        setTimeout(function () {
                            mp3Duration(absoluteFilePath, function (err2, duration) {
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
                                        setTimeout(function () {
                                            success(output);
                                        }, 2000);
                                    });
                                };
                            });
                        }, 2000);
                    }).catch((error) => {
                        self.debug(error);
                        console.log('Error while downloading, returning a null value');
                        success(null);
                    });
                };
            });
        });
    }

    makeCompilationFile(files, backgroundMusicPath) {
        const self = this;
        return new Promise((success, error) => {
            audioconcat(files)
                .concat(path.join(self.Folder, 'compilation.mp3'))
                .on('start', function (command) {
                    self.debug('The vocals made by synthesized voice are going to be compiled..');
                }).on('error', function (err, stdout, stderr) {
                    error('Voice compilation Error: ' + err + ' ffmpeg stderr: ' + stderr);
                }).on('end', function (output) {
                    if (fs.existsSync(backgroundMusicPath)) {
                        self.addAudioBackground(backgroundMusicPath, path.join(self.Folder, 'compilation.mp3'), path.join(self.Folder, 'final.mp3')).then((output2) => {
                            success(output2);
                        })
                    } else {
                        success(path.join(self.Folder, 'compilation.mp3'));
                    };
                });
        });
    }

    /**
     * Adds another audio file over another and outputs a new file
     * @param {path} file1Path Contains audio file path
     * @param {path} file2Path Contains audio file path
     */

    addAudioBackground(file1Path, file2Path, final = 'final.mp3') {
        return new Promise((success, err) => {
            const proc = new ffmpeg();
            proc.addInput(file1Path)
                .addInput(file2Path)
                .on('start', function () {
                    console.log('Adding background audio file');
                })
                .on('end', function (output1) {
                    console.log('Succesfully generated')
                    success(final);
                })
                .on('error', function (error) {
                    err('Audio compilation Error: ' + error);
                })
                .addInputOption('-filter_complex amerge')
                .addInputOption('-y')
                .outputOptions(['-y', '-ac 2', '-vbr 4'])
                .output(final)
                .run();
        });
    };

    /**
     * Create a file that concatenates multiple sentences to speech
     * @param {object} audioToGenerate Contains audio informations to be generated
     */

    createCompilation(audioToGenerate = [], backgroundMusicPath) {
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
                            mp3Duration(path.join(this.Folder, 'compilation.mp3'), (err, duration) => {
                                if (err || duration == 0) {
                                    self.debug('The compilation happens to be corrupted (Determined length: ' + duration + ')');

                                    self.AudioFiles = [];

                                    for (let i = 0; i < values.length; i++) {
                                        self.AudioFiles.push(path.join(this.Folder, 'vocal' + i + '.mp3'));
                                    }

                                    self.makeCompilationFile(self.AudioFiles, backgroundMusicPath).then((file) => {
                                        success({values, file});
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

                            self.makeCompilationFile(self.AudioFiles, backgroundMusicPath).then((file) => {
                                success({values, file});
                            });
                        };
                    });
                };
            });
        });
    };
}