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
        if(!this.Config.Folder){
            this.Config.Folder = folder;
        };

        this.accents = {
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
        
        this.vocalfiles = [];

    }

    audioChunk(index){
        const self = this;
        return new Promise((success, error) => {
            fs.exists(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal'+index+'.json'), (exists) => {
                if(exists){
                    self.debug('File vocal'+index+'.mp3 already recorded, skipping..');
                    self.MinusIndex += 1;
                    const output = JSON.parse(fs.readFileSync(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal'+index+'.json'), 'utf8'));
                    success(output);
                }else{
                    setTimeout(function(){
                        const content = self.Content.split(' ');
                        const WpR = self.Config.WordsPerRecording;
                        const sentence_array = content.slice(index*WpR, index*WpR + WpR);
                        let sentence = sentence_array.join(' ')+".";
                        if(true){ // USELESS
                            if(sentence_array.length < 12){
                                sentence = sentence+' Merci d\'avoir regardé!';
                            }
                            console.log('Vocal #'+index+' is going to be made.');
                            self.debug('Saving mp3')
                            try {
                                txtomp3.saveMP3(self.Config.LCode, sentence, path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal'+index+'.mp3'), function(err1, absoluteFilePath){
                                    if(err1){
                                        console.log(err1)
                                        success(null);
                                    }else{
                                        self.debug('Calculating mp3 duration')
                                        setTimeout(function(){
                                            mp3Duration(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal'+index+'.mp3'), function (err2, duration) {
                                                if(err2 || duration == 0){
                                                    self.debug('duration: '+duration+', wrong file')
                                                    success(null);
                                                }else{
                                                    self.debug('File saved with a duration of '+duration+' seconds.')
                                                    const output = {vocalid: index, duration: duration, sentence: sentence};
                                                    fs.writeFile(path.join(self.Config.Root, self.Config.Folder, 'audio', 'vocal'+index+'.json'), JSON.stringify(output), function(errfile) {
                                                        success(output);
                                                    });
                                                };
                                            });
                                        }, 1000);
                                    };
                                });
                            }catch(error) {
                                console.log('Error while downloading, returning a null value');
                                success(null);
                            };
                        }
                    }, 5000 * (index - self.MinusIndex));
                }
            });
        });
    }

    generateAudio(word){
        const self = this;
        return new Promise((success, error) => {
            console.log('Generating '+this.accents.length+' pronounciations for the word "'+word+'"!')
            console.log('=====================================================')
        
            let vocals = [];

            for (let i in files1) {
                vocals.push(self.audioChunk(files1[i]), word);
            };

            Promise.all(vocals).then((values) => {
                values = values.filter(v => v != null);
            })
        })
    }

};