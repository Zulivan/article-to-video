const fs = require('fs');
const path = require('path');

module.exports = class MagazineBrowser {
    /**
     * Initializes a MagazineBrowser instance
     * @param {string} directory Root directory
     * @param {string} folder Magazines folder
     * @param {array} magazines Magazines' names
     */

    constructor(directory, folder = 'none', magazines) {

        this.Loader = {
            toLoad: 0,
            loaded: 0,
            invalidFiles: 'Invalid files:'
        };

        this.Config = {
            Directory: directory,
            Folder: folder,
            MagHistFName: 'lastmagazines.json'
        };

        this.Config.Temp = path.join(directory, folder, 'temp');

        this.MagazinesList = magazines || []; // Magazines the bot looks for
        this.Magazines = [];

        this.MagazineHistory = {}; // Magazines that are already read

        try {
            this.MagazineHistory = JSON.parse(fs.readFileSync(path.join(this.Config.Temp, this.Config.MagHistFName), 'utf8'));
        } catch (error) {
            this.SaveMagazineHistory();
        }
        
        this.LoadMagazines();
    }

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
     * Load a magazine with its file
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

    SaveMagazineHistory() {
        fs.writeFile(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'lastmagazines.json'), JSON.stringify(this.MagazineHistory), function (errfile) {
            return 'Saved file!';
        });
    };

    getMagazine() {
        const self = this;
        return new Promise((success, error) => {
            let keys = [];
            self.loadAllMagazinesLinks().then(magazines => {
                for (let i in self.MagazineHistory) {
                    keys.push(i);
                }
                keys.forEach(function (index) {
                    let history = self.MagazineHistory[index] || null;
                    let magazine = self.Magazines[history.id];
                    if (!history.read) {
                        console.log('Found article url: ' + history.uri);
                        magazine.readArticle(history.uri).then(data => {
                            console.log('Article title: \r\n' + data.title + '\r\nArticle content: \r\n' + data.content);
                            magazine.read = true;
                            self.SaveMagazineHistory();
                            success(data);
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
                self.Magazines[id].getArticle().then((resolve) => {
                    if (resolve) {
                        self.MagazineHistory[self.Magazines[id].id] = self.MagazineHistory[self.Magazines[id].id] || {
                            id: id
                        };
                        self.MagazineHistory[self.Magazines[id].id].read = false;
                        if (self.MagazineHistory[self.Magazines[id].id] && self.MagazineHistory[self.Magazines[id].id].uri == resolve) {
                            self.MagazineHistory[self.Magazines[id].id].uri = resolve;
                            success(true);
                        } else {
                            self.MagazineHistory[self.Magazines[id].id].uri = resolve;
                            success(false);
                        };
                    }else{
                        self.MagazineHistory[self.Magazines[id].id].read = false;
                        self.MagazineHistory[self.Magazines[id].id].uri = '/';
                        success(null);
                    }
                    console.log('Found an article for magazine: ' + self.Magazines[id].id);
                    console.log('Outpoint: ' + resolve);
                    self.SaveMagazineHistory();
                }).catch((err) => {
                    self.MagazineHistory[self.Magazines[id].id].read = false;
                    self.MagazineHistory[self.Magazines[id].id].uri = '/';
                    success(err);
                });
            } else {
                success(null);
            };
        });
    };

    loadAllMagazinesLinks() {
        const self = this;
        const Magazines = self.Magazines;
        console.log('Loaded all magazines..')
        console.log(Magazines)
        return new Promise((success, error) => {
            let magazinescmd = [];
            Magazines.forEach(function (_, i) {
                magazinescmd.push(self.getMagazineBy(i));
            });
            Promise.all(magazinescmd).then(values => {
                self.SaveMagazineHistory();
                success(values);
            });
        });
    };

    allLoaded() {
        return this.Loader.toLoad - this.Loader.loaded <= 0;
    };

};