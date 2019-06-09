const fs = require('fs');
const Lien = require('lien');
const prettyBytes = require('pretty-bytes');
const jimp = require('jimp');
const open = require('open');
const {google} = require('googleapis');

const DEBUG = true;

module.exports = class AudioManager {
    /**
     * Initializes a MagazineBrowser instance (only used by Bot.js)
     * @param {object} config Config array
     * @param {string} client Google's oAuth client 
     */

    constructor(config = {}, client) { 

        this.Config = config;

        this.oAuth = client;

        this.uploading = false;

    }

    uploadVideo(file, title, subtitles, tags = ['#news', 'france infos', 'nouvelles', 'actualités'], thumbnail, description = 'Les nouvelles les plus palpitantes sur cette chaine youtube gratuitement', magazine = 'FRANCE INFOS 24/7'){
        const self = this;
        const resourcesfolder = self.Config.Folder;
        return new Promise((success, error) => {
            self.logIn().then((logged_in, reset) => {
                if(logged_in && !self.uploading){
                    this.uploading = true;
                    console.log('Uploading...');
                    const youtube = google.youtube({
                        version: 'v3',
                        auth: self.oAuth
                    });
                    const videoupload = youtube.videos.insert({
                        notifySubscribers: true,
                        resource: {
                            snippet: {
                                title: title,
                                description: title + '\r\n Source: ' + magazine,
                                categoryId: '22',
                                defaultLanguage: 'fr',
                                tags: tags
                            },
                            status: {
                                privacyStatus: 'public',
                                publicStatsViewable: false,
                                embeddable: true
                            }
                        },
                        part: "snippet,status",
                        media: {
                            body: fs.createReadStream(file)
                        }
                    }, (err, res1) => {
                        if(!err){
                            const video = res1.data;
                            console.log(video);
                            console.log('Youtube video '+title+' uploaded as watch?v='+video.id)
                            const req2 = youtube.captions.insert({
                                resource: {
                                    snippet: {
                                        videoId: video.id,
                                        language: 'fr',
                                        name: 'Sous-Titres',
                                        isDraft: false
                                    }
                                },
                                sync: true,
                                part: "snippet",
                                media: {
                                    body: subtitles
                                }
                            }, (errcc, data) => {
                                if(!errcc){
                                    console.log('--- Youtube Caption Uploaded! ---')
                                    const randomimage = thumbnail;
                                    const thumbimage = './'+resourcesfolder+'/images/' + randomimage.name;
                                    const imagedirectory = './'+resourcesfolder+'/thumbnail.png';
                                    jimp.read('./'+resourcesfolder+'/preset/thumbnail.png', function (importerror, overlay) {
                                        jimp.read(thumbimage, function (importerror2, background) {
                                            background.composite(overlay, 0, 0).resize(1280, 720).quality(60).write(imagedirectory);
                                            setTimeout(function(){
                                                let req3 = youtube.thumbnails.set({
                                                    videoId: video.id,
                                                    media: {
                                                        body: fs.createReadStream(imagedirectory)
                                                    }
                                                }, (errthumbnail, data) => {
                                                    if(!errthumbnail){
                                                        console.log('---------------------------------');
                                                        console.log('--- Youtube Thumbnail Uploaded! ---');
                                                        success(video.id);
                                                    }else{
                                                        console.log(errthumbnail)
                                                        success(false);
                                                    }
                                                });
                                            },5000)
                                        })
                                    })
                                }else{
                                    console.log(errcc)
                                    console.log(tags)
                                    success(false);
                                }
                            });
                        }else{
                            console.log(err)
                            console.log(tags)
                            success(false);
                        }
                    });
                }else{
                    console.log('Not logged in, restart required.');
                };
            });
        });
    }

    logIn(){
        const self = this;
        return new Promise((success, error) => {
            const resourcesfolder = self.Config.Folder;
            const oauth = self.oAuth;
            const server = new Lien({
                host: 'localhost',
                port: self.Config.LocalPort
            });
            console.log('Checking oAuth credentials.')
            fs.readFile('./'+resourcesfolder+'/temp/tokens.json', 'utf8', function (err, tokenfile) {
                if (err) tokenfile = '{}';
                if(tokenfile.length > 5){
                    oauth.setCredentials({
                        refresh_token: JSON.parse(tokenfile).refresh
                    });
                    success(true);
                }else{
                    const url = oauth.generateAuthUrl({
                        access_type: 'offline',
                        scope: ['https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/youtube.force-ssl','https://www.googleapis.com/auth/youtubepartner', 'https://www.googleapis.com/auth/youtube']
                    });
                    console.log('Please log in with this address:');
                    open(url);
                    server.addPage('/oauth2callback', lien => {
                        console.log("Trying to get the token using the following code: " + lien.query.code);
                        oauth.getToken(lien.query.code, (err, tokens) => {
                            if (err) {
                                // lien.lien(err, 400);
                                return console.log(err);
                            };
                            console.log(tokens)
                            if (tokens.refresh_token) {
                                fs.writeFile('./'+resourcesfolder+'/temp/tokens.json', JSON.stringify({refresh: tokens.refresh_token, access: tokens.access_token}), function(errfile3) {
                                    console.log('Refresh token '+tokens.refresh_token);
                                    console.log('Access token: '+tokens.access_token);
                                    oauth.setCredentials(tokens);
                                    success(true);
                                });
                            };
                            lien.end("<center><h4>The video is going to be uploaded on youtube with the selected account! <br/> Check out the logs in the terminal.</h4></center>");
                        });
                    });
                };
            });
        });
    }
}