const request = require('request');
const download = require('image-downloader');
const jimp = require('jimp');

const DEBUG = true;

module.exports = class ImagesFinder {
    /**
     * Initializes a MagazineBrowser instance (only used by Bot.js)
     * @param {string} directory Root directory
     * @param {string} folder Magazines folder
     * @param {string} config Config array
     * @param {string} magazines Magazines
     */

    constructor(config, directory, folder = 'nothing') { 

        this.Config = config || {};
        this.Config.Directory = directory;
        if(!this.Config.Folder){
            this.Config.Folder = folder;
        };

    }
    
    debug(text){
        if (DEBUG) console.log(text);
    }

    queryImages(query){
        return new Promise((success, error) => {
            let requestOptions = {
                encoding: 'utf8',
                json: true,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                },
                uri: 'https://api.qwant.com/api/search/images?count=15&t=images&safesearch=1&locale=fr_FR&uiv=%204&q='+query
            };
            request(requestOptions, function(err, _, body){
                if(err){
                    const nothing = [];
                    success(nothing);
                }else{
                    const items = body.data.result.items || [];
                    success(items);
                };
            })
        });
    }

    imageProcess(index, array){
        const self = this;
        self.debug('Image process: starting..')
        return new Promise((success, error) => {
            const link = array[index].media;
            if(link.indexOf('.jpg') > -1 || link.indexOf('.bmp') > -1 || link.indexOf('.png') > -1){
                self.debug('Image process: downloading image called '+link+'..');
                const options = {
                    url: link,
                    dest: './'+self.Config.Folder+'/images'
                };
                download.image(options).then(({ filename, image }) => {
                    self.debug('Image process: downloaded image called '+filename+'..');
                    const NewFileName = self.getRandomArbitrary(0, 989769)+'.jpg';
                    const NewImgDirectory = './'+self.Config.Folder+'/images/'+NewFileName;
                    const OldImgDirectory = './'+self.Config.Folder+'/images/'+filename.split('\\')[filename.split('\\').length - 1];

                    if(filename.indexOf('.jpg') > -1 || filename.indexOf('.bmp') > -1 || filename.indexOf('.png') > -1){
                        setTimeout(function(){
                            jimp.loadFont(jimp.FONT_SANS_64_BLACK).then(function (font) {
                                jimp.read(OldImgDirectory, function (err, imagebuffer) {
                                    imagebuffer.resize(1080, 720).blur(1).flip(true, false).print(font, 2, 2, self.Config.Name).write(NewImgDirectory);
                                    self.debug('Image process: saved image  '+filename+' through: '+JSON.stringify({path: NewImgDirectory, name:NewFileName}));
                                    success({path: NewImgDirectory, name:NewFileName});
                                }).catch((err) => {
                                    success(null);
                                });
                            });
                        },2000);
                    };
                }).catch((err) => {
                    success(null);
                });
            }else{
                success(null);
            };
        });
    }

    getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }      

    searchImages(title){
        const self = this;
        return new Promise((success, reset) => {
            self.debug('search Images: starting');
            const searchterm = title.split(":");
            let ImgToProcess = [];
            self.queryImages(title).then((returnimg) => {
                self.debug('search Images: query on title: '+title);
                if(returnimg.length > 0){
                    self.debug('search Images: processing relevant results');
                    for(let i=0; i < returnimg.length; i++) {
                        ImgToProcess.push(self.imageProcess(i, returnimg));
                    };
                    Promise.all(ImgToProcess).then((values) => {
                        success(values);
                    });
                }else if(searchterm.length > 0){
                    self.debug('search Images: no image found previously, query on '+searchterm[0]);
                    self.queryImages(searchterm[0]).then((returnimg2) => {
                        if(returnimg2.length > 0){
                            for(let i=0; i < returnimg2.length; i++) {
                                ImgToProcess.push(self.imageProcess(i, returnimg2));
                            }
                            Promise.all(ImgToProcess).then((values) => {
                                success(values);
                            });
                        }else if(searchterm.length > 1){
                            self.debug('search Images: no image found previously query on '+searchterm[1]);
                            self.queryImages(searchterm[1]).then((returnimg3) => {
                                if(returnimg3.length > 0){
                                    for(let i=0; i < returnimg3.length; i++) {
                                        ImgToProcess.push(self.imageProcess(i, returnimg3));
                                    }
                                    Promise.all(ImgToProcess).then((values) => {
                                        success(values);
                                    });
                                }else{
                                    success(null);
                                }
                            })
                        }else{
                            success(null);
                        }
                    })
                }else{
                    success(null);
                }
            });
        });
    };

};