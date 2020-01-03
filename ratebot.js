const videoshow = require('videoshow');
const request = require('request');
const cheerio = require('cheerio');
const audioconcat = require('audioconcat');
const mp3Duration = require('mp3-duration');
const txtomp3 = require("text-to-mp3");
const fs = require("fs");
const Lien = require("lien");
const Google = require("googleapis");
const opn = require("opn");
const prettyBytes = require("pretty-bytes");

const oauthId = "46509845086-ba5mqr6bebgg3ab09duhb9n9umrdhhsq.apps.googleusercontent.com"
const oauthSecret = "istSdCZX3X5OtMrX0Mb9_a7R"

let oauth = new Google.auth.OAuth2(oauthId, oauthSecret, "http://localhost:5000/oauth2callback");

var server = new Lien({
	host: "localhost",
	port: 5000
})












rateVideo('ORXUe5ubzxM', 5, 'like')

// farmLogins()

















function farmLogins(){
	opn(oauth.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/youtube.force-ssl','https://www.googleapis.com/auth/youtubepartner', 'https://www.googleapis.com/auth/youtube']
	}));
	server.addPage("/oauth2callback", lien => {
		console.log("Trying to get the token using the following code: " + lien.query.code);
		oauth.getToken(lien.query.code, (err, tokens) => {
			if (err) {
				lien.lien(err, 400);
				return console.log(err);
			}
			oauth.setCredentials(tokens);
			
			
			console.log('Access token: '+tokens.access_token);
			if (tokens.refresh_token) {
				fs.stat("farmTokens.json", function(errorload, stats){
					if(errorload){
						var tokensave = new Array();
						tokensave.push({refresh: tokens.refresh_token, access: tokens.access_token})
						fs.writeFile("farmTokens.json", JSON.stringify(tokensave), function(errfile3) {
							console.log('First refresh token '+tokens.refresh_token+' added to tokens list ;)');
							farmLogins()
						})
					}else{
						fs.readFile('farmTokens.json', 'utf8', function (err, tokenfile) {
							if(!err){
								var tokensave = {refresh: tokens.refresh_token, access: tokens.access_token}
								var arraylogs = JSON.parse(tokenfile)
								arraylogs.push(tokensave)
								fs.writeFile("farmTokens.json", JSON.stringify(arraylogs), function(errfile3) {
									console.log('Refresh token '+tokens.refresh_token+' added to tokens list ;)');
									farmLogins()
								})
							}
						})
					}
				})
			}
			
			lien.end("<center><h4>The video is going to be uploaded on youtube with the selected account! <br/> Check out the logs in the terminal.</h4></center>");
		});
	});
}

function rateVideo(id, amount, type){
	var likedamt = 0;
	fs.readFile('farmTokens.json', 'utf8', function (err, tokenfile) {
		if(tokenfile.length < 5){
			farmLogins()
		}else{
			if(amount == Infinity){
				console.log('Sending '+JSON.parse(tokenfile).length+' '+type+'s on '+id+'.')
				amount = JSON.parse(tokenfile).length
			}
			console.log('Estimated time to add all the likes: '+Math.floor(60 + amount * 2))
			JSON.parse(tokenfile).forEach( function( contents, index ) {
				if(likedamt < amount){
					likedamt = likedamt + 1;
					actRate(index)
				}
			})
			function actRate(indexoftoken){
					setTimeout(function(){
						let oauth2client = new Google.auth.OAuth2(oauthId, oauthSecret, "http://localhost:5000/oauth2callback");
						oauth2client.setCredentials({
							refresh_token: JSON.parse(tokenfile)[indexoftoken].refresh
						});
						const youtube = Google.youtube({
							version: 'v3',
							auth: oauth2client
						});
						youtube.videos.rate({
							id: id,
							rating: type
						}, (err, result) => {
							console.log('Video successfully '+type+'d')
						})
					}, Math.floor(Math.random() * (60 + amount * 2)) * 1000);
			}
		}
	})
}



//Command processing...
process.argv.forEach((val, argindex) => {
	if(argindex == 2){
		
	}
});