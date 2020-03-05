const fs = require('fs');
const Lien = require('lien');
const TextEditor = require('../classes/TextEditor.js');
// const prettyBytes = require('pretty-bytes');
const open = require('open');
const path = require('path');
const {
    google
} = require('googleapis');

module.exports = class YoutubeUploader {
    /**
     * Initializes a Uploader instance
     * @param {object} folder Folder 
     * @param {string} client Google's oAuth client 
     */

    constructor(folder, client) {

        this.Config = {
            Folder: folder
        };

        this.LocalPort = client.LocalPort
        this.oAuth = new google.auth.OAuth2(client.Public, client.Private, 'http://localhost:' + client.LocalPort + '/oauth2callback');

        this.uploading = false;

    }

    uploadVideo(file, title, subtitles, tags = ['#news', 'france infos', 'nouvelles', 'actualités'], thumbnail, description = 'Les nouvelles les plus palpitantes sur cette chaine youtube gratuitement', magazine = 'FRANCE INFOS 24/7') {
        const self = this;
        const badChars = ['<', '>', '«', '»'];
        title = TextEditor.HTMLtoUTF8(title)
        title = TextEditor.clear(title)
        title = TextEditor.replaceByFilter(title, badChars, '\'');
        title = title.replace(/PHOTO/g, '').replace(/voici.fr/g, magazine).replace(/closer/g, magazine).replace(/la mort/g, 'la disparition').replace(/mort/g, 'disparu');
        if (title.length > 92) title = title.slice(0, 90) + '...';

        return new Promise((success, error) => {
            self.logIn().then(logged_in => {
                if (logged_in && !self.uploading) {
                    self.uploading = true;
                    console.log('Uploading...');
                    const youtube = google.youtube({
                        version: 'v3',
                        auth: self.oAuth
                    });
                    let req1 = youtube.videos.insert({
                        notifySubscribers: true,
                        resource: {
                            snippet: {
                                title: title,
                                description: title + '\r\n' + description + '\r\n Source: ' + magazine,
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
                        if (!err) {
                            const video = res1.data;
                            console.log(video);
                            console.log('Youtube video ' + title + ' uploaded as watch?v=' + video.id)
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
                                if (!errcc) {
                                    console.log('--- Youtube Caption Uploaded! ---')
                                    let req3 = youtube.thumbnails.set({
                                        videoId: video.id,
                                        media: {
                                            body: fs.createReadStream(thumbnail)
                                        }
                                    }, (errthumbnail, data) => {
                                        if (!errthumbnail) {
                                            console.log('---------------------------------');
                                            console.log('--- Youtube Thumbnail Uploaded! ---');
                                            success(video.id);
                                        } else {
                                            console.log(errthumbnail)
                                            success(false);
                                        }
                                    });
                                } else {
                                    console.log(errcc)
                                    console.log(tags)
                                    success(false);
                                }
                            });
                        } else {
                            console.log(err)
                            console.log(tags)
                            success(false);
                        }
                    });
                    if (this.uploading) {
                        // this.uploading = false;
                        // let currentbytes = 0;
                        // setInterval(function () {
                        //     if (currentbytes !== prettyBytes(req1.req.connection._bytesDispatched)) {
                        //         currentbytes = prettyBytes(req1.req.connection._bytesDispatched);
                        //       console.log(prettyBytes(req1.req.connection._bytesDispatched) + ' uploaded.');
                        //    }
                        //}, 1000);
                    }
                } else {
                    console.log('Not logged in, restart required.');
                };
            });
        });
    }

    logIn() {
        const self = this;
        return new Promise((success, error) => {

            const oauth = self.oAuth;

            const server = new Lien({
                host: 'localhost',
                port: this.LocalPort
            });

            const tokensPath = path.join(self.Config.Folder, 'temp', 'tokens.json');

            // console.log(tokensPath)

            fs.readFile(tokensPath, 'utf8', (err, tokenfile) => {
                if (err) tokenfile = '{}';

                if (tokenfile.length > 5) {
                    console.log('Token file is done.')
                    oauth.setCredentials({
                        refresh_token: JSON.parse(tokenfile).refresh
                    });
                    success(true);
                } else {
                    console.log('Token file is empty.')
                    const url = oauth.generateAuthUrl({
                        access_type: 'offline',
                        scope: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.force-ssl', 'https://www.googleapis.com/auth/youtubepartner', 'https://www.googleapis.com/auth/youtube']
                    });
                    console.log('Please log in to YouTube with this link:');
                    open(url);
                    server.addPage('/oauth2callback', lien => {
                        console.log('Trying to get the token using the following code: ' + lien.query.code);
                        oauth.getToken(lien.query.code, (err, tokens) => {
                            if (err) {
                                // lien.lien(err, 400);
                                error(err);
                            };
                            console.log(tokens)
                            if (tokens.refresh_token) {
                                fs.writeFile(tokensPath, JSON.stringify({
                                    refresh: tokens.refresh_token,
                                    access: tokens.access_token
                                }), function (errfile3) {
                                    console.log('Refresh token ' + tokens.refresh_token);
                                    console.log('Access token: ' + tokens.access_token);
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