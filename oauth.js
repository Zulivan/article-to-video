const fs = require("fs");
const Lien = require("lien");
const google = require("googleapis");
const opn = require("opn");
const oauth = new google.auth.OAuth2("207370561013-gcj05ndhd1j8lj0tkl8lrpbtrcnj7jr4.apps.googleusercontent.com", "-TRuLdAPJay-EFGPD2xarF4j", "http://localhost:5000/oauth2callback");



let server = new Lien({
	host: "localhost"
	, port: 5000
});

const url = oauth.generateAuthUrl({
	access_type: 'offline',
	scope: 'https://www.googleapis.com/auth/youtube.upload'
})

opn(url);

fs.readFile('tokens.json', 'utf8', function (err, tokenfile) {
	if(tokenfile.length > 5){
		oauth.setCredentials({
			refresh_token: JSON.parse(tokenfile).refresh
		});
	}else{
		server.addPage("/oauth2callback", lien => {
			console.log("Trying to get the token using the following code: " + lien.query.code);
			oauth.getToken(lien.query.code, (err, tokens) => {
				if (err) {
					lien.lien(err, 400);
					return console.log(err);
				}
				console.log("Got the tokens.");
				
				oauth.setCredentials(tokens);
															
				if (tokens.refresh_token) {
					var tokensave = {refresh: tokens.refresh_token, access: tokens.access_token}
					fs.writeFile("tokens.json", JSON.stringify(tokensave), function(errfile3) {
						console.log('Refresh token '+tokens.refresh_token);
					})
				}
				
				console.log(tokens);
				console.log('Access token: '+tokens.access_token);
				
				lien.end("<center><h4>Successfully logged on!</h4></center>");
			});
		});
	}
})