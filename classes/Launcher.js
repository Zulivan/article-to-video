const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const {
    google
} = require('googleapis');
const DEBUG = true;

module.exports = class Launcher {
    /**
     * Compiles the bot
     * @param {string} Directory Root directory
     * @param {object} Config Config params
     */

    constructor(Directory, config = {}) {
        this.Config = config;
        this.Config.Directory = Directory;

        this.Progression = {};
        this.ExtraData = {};

        this.Steps = [];

        if (config.oAuth) {
            if (!config.oAuth.Public) throw 'oAuth: Public key missing.';
            if (!config.oAuth.Private) throw 'oAuth: Private key missing.';
            if (!config.oAuth.LocalPort) throw 'oAuth: Local port missing.';

            this.oAuth = new google.auth.OAuth2(config.oAuth.Public, config.oAuth.Private, 'http://localhost:' + config.LocalPort + '/oauth2callback');
        } else {
            console.log('The oAuth credentials are not set up')
        }

        fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), (exists) => {
            if (exists) {
                try {
                    this.Progression = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), 'utf8'));
                } catch (e) {
                    console.log('The progression file is corrupt, reset done.')
                }
            } else {
                console.log('No progression file found, generating one.')
            }

            
            fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'extra.json'), (exists2) => {
                if (exists2) {
                    try {
                        this.ExtraData = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'extra.json'), 'utf8'));
                    } catch (e) {
                        console.log('The extra data file is corrupt, reset done.')
                    }
                } else {
                    console.log('No extra data file file found, generating one.')
                }
                this.ExtraData['Config'] = this.Config;

                this.Run();
            });
        });

    }

    debug(val){
        if(DEBUG) console.log(val);
    }

    /**
     * Adds up a preset step to make the video
     * @param {text} func Function id to add 
     * @param {object} argument arguments depending on the function
     * @param {number} index If set: sets an index to the specified value 
     */

    AddPresetStep(func, argument, index) {

        if (index) {
            this.Steps[index] = {
                type: 0,
                func: func,
                arg: argument
            };
        } else {
            this.Steps.push({
                type: 0,
                func: func,
                arg: argument
            });
        }

    }

    /**
     * Adds up a step to make the video
     * @param {function} func Function to add 
     * @param {number} index If set: sets an index to the specified value 
     */

    AddStep(func, index) {

        if (index) {
            this.Steps[index] = {
                type: 1,
                func: func
            };
        } else {
            this.Steps.push({
                type: 1,
                func: func
            });
        }

    }


    /**
     * Check progression data
     * @param {string} index If set: sets an index to the specified value 
     * @param {any} value 
     */

    CheckProgression(index, value) {

        if (this.Progression[index] && this.Progression[index].complete) {
            try {
                fs.writeFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), JSON.stringify(this.Progression, null, 2));
                return true;
            } catch (e) {
                return false;
            }
        }else if(!this.Progression[index]){
            this.Progression[index] = value;
            this.debug('First time we see the step #'+index+' with values: '+value);
            try {
                fs.writeFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), JSON.stringify(this.Progression, null, 2));
                return true;
            } catch (e) {
                return false;
            }
        }
    }

    /**
     * Saves current progression
     * @param {string} index If set: sets an index to the specified value 
     * @param {any} value 
     */

    SaveProgression(index, value = false) {
        if (index.toString()) {
            this.Progression[index].complete = (value !== false);
        };

        try {
            fs.writeFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), JSON.stringify(this.Progression, null, 2));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Saves extra data to communicate with other functions
     * @param {string} type If set: sets an index to the specified value 
     * @param {any} value 
     */

    SetExtraData(type, value) {
        
        if(!type) throw 'No type found';
        if(!value) throw 'No value found';

        if(this.ExtraData[type] && typeof this.ExtraData[type] === 'object'){
            this.ExtraData[type] = this.ExtraData[type].concat(value);
        }else{
            this.ExtraData[type] = value;
        }

        try {
            fs.writeFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'extra.json'), JSON.stringify(this.ExtraData, null, 2));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Run the Launcher once it is set up
     */

    Run() {

        const self = this;

        this.Steps.push({
            type: 2,
            func: 'resetFiles'
        });

        return new Promise((success, error) => {
            let promises = [];

            for (let i = 0; i < self.Steps.length; i++) {

                const stepData = {
                    output: self.Steps[i]['func'],
                    complete: false
                }

                self.CheckProgression(i, stepData);

                if (self.Progression[i].complete == false) {

                    if (self.Steps[i]['type'] == 0) {
                        promises.push(self.PresetFunction(i, self.Steps[i]['func'], self.Steps[i]['arg']));
                    } else if(self.Steps[i]['type'] == 2){
                        promises.push(self[self.Steps[i]['func']]());
                    };

                };
            };

            console.log(promises)

            Promise.all(promises).then((values) => {
                success(values);
                self.debug('I went through all steps!');
            });
        });

    }

    PresetFunction(id, funcId, args) {
        const self = this;
        return new Promise((success, error) => {

            const funcPath = path.join(self.Config.Directory, 'functions', funcId + '.js');
            const func = require(funcPath);

            let dataToPass = self.ExtraData;
            dataToPass.StepID = id;

            func(args, dataToPass).then((result) => {
                
                if(typeof result === 'object'){
                    self.SetExtraData(result.type, result.values);
                    self.SaveProgression(id, result.values);
                }else{
                    self.SaveProgression(id, result);
                }

                console.log('RESULT')


                success(true);
            }).catch((err) => {
                self.debug('Error while using the preset function "' + funcId + '" with arguments "' + args + '": ' + err);
                error(err);
            });

        });
    }

    /**
     * Resets the temporary file
     * @param {boolean} NoDeletion Choose whether the generated files have to be deleted or not
     */

    resetFiles(NoDeletion) {
        const self = this;
        return new Promise((success, error) => {

            console.log('Video done! Reset in 5 minutes!')

            setTimeout(function() {
                self.Progression = {};
                self.SaveProgression();
                
                if (NoDeletion) {
                    process.exit();
                }

                rimraf.sync(path.join(self.Config.Folder, 'images'));
                rimraf.sync(path.join(self.Config.Folder, 'audio'));

                //TODO: CLEARER WAY TO DELETE FILES

                fs.exists('./' + self.Config.Folder + '/thumbnail.png', (exists0) => {
                    if (exists0) {
                        fs.unlinkSync('./' + self.Config.Folder + '/thumbnail.png');
                    };
                    fs.exists('./' + self.Config.Folder + '/video.mp4', (exists1) => {
                        if (exists1) {
                            fs.unlinkSync('./' + self.Config.Folder + '/video.mp4');
                        };
                        fs.exists('./' + self.Config.Folder + '/temp/captions.txt', (exists2) => {
                            if (exists2) {
                                fs.unlinkSync('./' + self.Config.Folder + '/temp/captions.txt');
                            };
                            success(true);
                        });
                    });
                });
            }, 5 * 60 * 1000);
        });
    }
};