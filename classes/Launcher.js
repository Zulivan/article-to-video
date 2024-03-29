const fs = require('fs');
// const rimraf = require('rimraf');
const path = require('path');
const waterfall = require('promises-waterfall-compact');
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
        } else {
            console.log('The oAuth credentials are not set up')
        }
    }

    debug(val) {
        if (DEBUG) console.log(val);
    }

    Load() {
        return new Promise((success, error) => {
            fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp'), (exists) => {
                if (!exists) {
                    fs.mkdirSync(path.join(this.Config.Directory, this.Config.Folder, 'temp'))
                }
                fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), (exists1) => {
                    if (exists1) {
                        try {
                            this.Progression = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), 'utf8'));
                        } catch (e) {
                            this.debug('The progression file is corrupt, reset done.')
                        }
                    } else {
                        this.debug('No progression file found, generating one.')
                    }

                    fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'extra.json'), (exists2) => {
                        if (exists2) {
                            try {
                                this.ExtraData = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'extra.json'), 'utf8'));
                            } catch (e) {
                                this.ExtraData = {};
                                this.debug('The extra data file is corrupt, reset done.')
                            };
                        } else {
                            this.debug('No extra data file found, generating one.')
                        };
                        this.ExtraData['Config'] = this.Config;

                        success(true);

                        setTimeout(() => {
                            this.Run();
                        }, 1000);
                    });
                });
            });
        });
    };

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
        if (!this.Progression[index]) {
            this.Progression[index] = value;
        }

        try {
            fs.writeFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'progression.json'), JSON.stringify(this.Progression, null, 2));
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Saves current progression
     * @param {string} index If set: sets an index to the specified value 
     * @param {any} value 
     */

    SaveProgression(index, value = false) {
        if (typeof index !== 'undefined') {
            this.Progression[index].complete = (value !== false);
        }

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
     */

    GetExtraData(type) {
        if (!type) throw 'No type found';
        return this.ExtraData[type] || false;
    }


    /**
     * Saves extra data to communicate with other functions
     * @param {string} type If set: sets an index to the specified value
     * @param {any} value
     */

    SetExtraData(type, value) {

        if (!type) throw 'No type found';
        if (!value) throw 'No value found';

        if (this.ExtraData[type] && typeof this.ExtraData[type] === 'object') {
            try {
                this.ExtraData[type] = this.ExtraData[type].concat(value);
            } catch (e) {
                this.ExtraData[type] = value;
            }
        } else {
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

                if (self.Progression[i].complete == false && promises == 0) {

                    if (self.Steps[i]['type'] == 0) {
                        promises.push(self.PresetFunction(i, self.Steps[i]['func'], self.Steps[i]['arg']));
                    } else if (self.Steps[i]['type'] == 2) {
                        promises.push(self[self.Steps[i]['func']]());
                    };

                };
            };

            waterfall(promises).then((values) => {
                success(values);
                throw 'Restarting..';
            }).catch(console.error);
        });

    }

    PresetFunction(id, funcId, args) {
        const self = this;
        return new Promise((success, error) => {

            const funcPath = path.join(self.Config.Directory, 'functions', funcId + '.js');
            const func = require(funcPath);

            let dataToPass = self.ExtraData;
            dataToPass.Config = self.Config;
            dataToPass.StepID = id;

            self.debug('Running ' + funcId);

            func(args, dataToPass).then((result) => {
                if (typeof result === 'object') {
                    self.SetExtraData(result.type, result.values);
                    self.SaveProgression(id, result.values);
                } else {
                    self.SaveProgression(id, result);
                }
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

            console.log('Video done! Reset in 1 minute!');

            setTimeout(function () {
                self.Progression = {};
                self.SaveProgression();

                if (NoDeletion) {
                    process.exit();
                }

                fs.unlinkSync(path.join(self.Config.Folder, 'temp', 'progression.json'));
                fs.unlinkSync(path.join(self.Config.Folder, 'temp', 'extra.json'));

                fs.rmdirSync(path.join(self.Config.Folder, 'images'), {
                    recursive: true
                });
                fs.rmdirSync(path.join(self.Config.Folder, 'audio'), {
                    recursive: true
                });

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
            }, 1 * 10 * 1000);
        });
    }
};