const fs = require('fs');
const path = require('path');

module.exports = class MagazineBrowser {
    /**
     * Initializes a MagazineBrowser instance (only used by Bot.js)
     * @param {string} directory Root directory
     * @param {string} folder Magazines folder
     * @param {string} config Config array
     * @param {string} magazines Magazines
     */

    constructor(config, directory, folder = 'nothing') {

        this.Loader = {
            toLoad: 0,
            loaded: 0,
            invalidFiles: 'Invalid files:'
        };

        this.Config = config || {};
        this.Config.Directory = directory;
        if (!this.Config.Folder) {
            this.Config.Folder = folder;
        };
        this.MagazinesList = this.Config.Magazines || []; // Magazines éligibles au type de bot
        this.Magazines = [];

        this.MagazinesHistory = {}; // Historique des magazines déjà lus

        let data = '{}';

        fs.exists(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'lastmagazines.json'), (exists) => {
            if (exists) {
                data = fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'lastmagazines.json'), 'utf8');
            }
        });

        if (data.length > 5) {
            this.MagazinesHistory = JSON.parse(data);
        };

        this.LoadMagazines();
    }

    /**
     * Load a magazine by its file
     * @param {string} file Magazine file
     */

    LoadMagazine(file) {
        let magazine = require(path.join(this.Config.Directory, 'magazines', file));
        if (!magazine.id) return;
        magazine.filename = file;
        if (this.Magazines[magazine.id]) {
            console.log('[' + this.Loader.loaded + '/' + this.Loader.toLoad + '] File: ' + file + '; Error: this magazine has the same id as another make sure it\'s not a duped file.');
            return;
        };
        if (this.MagazinesList.indexOf(magazine.id) > -1) {
            this.Magazines[this.Magazines.length] = magazine;
            this.LoadedMagazine(magazine);
        };
    };

    /**
     * Loads every magazine
     */

    LoadMagazines() {
        fs.readdirSync('magazines').forEach(file => {
            if (file.indexOf('.js') > -1) {
                const magazine = require(path.join(this.Config.Directory, 'magazines', file));
                if (magazine.id) {
                    this.Loader.toLoad += 1;
                };
            };
        });
        fs.readdirSync('magazines').forEach(file => {
            if (file.indexOf('.js') > -1) {
                const magazine = require(path.join(this.Config.Directory, 'magazines', file));
                if (magazine.id) {
                    this.LoadMagazine(file);
                } else {
                    this.Loader.invalidFiles += ' ' + file;
                };
            };
        });
    };

    /**
     * Triggered whenever a magazine is loaded
     * @param {object} magazine Magazine
     */

    LoadedMagazine(magazine) {
        this.Loader.loaded += 1;
        console.log('[' + this.Loader.loaded + '/' + this.Loader.toLoad + '] Loaded magazine: ' + magazine.id);
        if (this.allLoaded()) {
            if (this.Loader.invalidFiles !== 'Invalid files:') {
                console.log('');
                console.log(this.Loader.invalidFiles);
            };
            console.log('');
            console.log('All the magazines are loaded!');
        };
    };

    SaveMagazinesHistory() {
        fs.writeFile(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'lastmagazines.json'), JSON.stringify(this.MagazinesHistory), function (errfile) {
            return 'Saved file!';
        });
    };

    getMagazine() {
        const self = this;
        return new Promise((success, error) => {
            let keys = [];
            self.loadAllMagazinesLinks().then(magazines => {
                console.log('BIG FIRST');
                for (let i in self.MagazinesHistory) {
                    keys.push(i);
                }
                keys.forEach(function (index) {
                    let history = self.MagazinesHistory[index] || null;
                    let magazine = self.Magazines[history.id];
                    if (!history.read) {
                        console.log('Found article url: ' + history.uri);
                        magazine.readArticle(history.uri).then(content => {
                            console.log('read article: ' + content);
                            magazine.read = true;
                            self.SaveMagazinesHistory();
                            success(content);
                        });
                    };
                });
            });
        });
    };

    getMagazineBy(id = -1) {
        const self = this;
        return new Promise((success, error) => {
            if (id < self.Magazines.length) {
                self.Magazines[id].getArticle().then(resolve => {
                    if (resolve) {
                        self.MagazinesHistory[self.Magazines[id].id] = self.MagazinesHistory[self.Magazines[id].id] || {
                            id: id
                        };
                        self.MagazinesHistory[self.Magazines[id].id].read = false;
                        if (self.MagazinesHistory[self.Magazines[id].id] && self.MagazinesHistory[self.Magazines[id].id].uri == resolve) {
                            self.MagazinesHistory[self.Magazines[id].id].uri = resolve;
                            success(true);
                        } else {
                            self.MagazinesHistory[self.Magazines[id].id].uri = resolve;
                            success(false);
                        };
                    } else {
                        self.MagazinesHistory[self.Magazines[id].id].read = false;
                        self.MagazinesHistory[self.Magazines[id].id].uri = 'none';
                        success(null);
                    };
                    self.SaveMagazinesHistory();
                })
            } else {
                success(null);
            };
        });
    };

    loadAllMagazinesLinks() {
        const self = this;
        const Magazines = self.Magazines;
        console.log('Load all magazines')
        console.log(Magazines)
        return new Promise((success, error) => {
            let magazinescmd = [];
            Magazines.forEach(function (_, i) {
                magazinescmd.push(self.getMagazineBy(i));
            });
            Promise.all(magazinescmd).then(values => {
                self.SaveMagazinesHistory();
                success(values);
            });
        });
    };

    allLoaded() {
        return this.Loader.toLoad - this.Loader.loaded <= 0;
    };

};