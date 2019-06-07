const txtomp3 = require('text-to-mp3');

const sentence = 'how can we determine the problem'

const langcode = 'fr-ca'

// en // BRIT
// en-US // AMERICAN
// en-AU // Australian
// en-IN // Indian

txtomp3.saveMP3(langcode, sentence, './vocal-'+langcode+'.mp3', function(err1, absoluteFilePath){
	
});