const Config = {
    LocalPort: 5000,
    oAuth: {
        Public: '370774627054-dl9pkp0f4ktnp4k46drueucvv7lenj0o.apps.googleusercontent.com',
        Private: 'xbC5kRQV00HT28iStA0rH28V'
    },
    Video: {
        CompliationLoop: false
    },
    WordsPerRecording: 15,
    Folder: 'actus',
    Name: 'FRANCE INFOS 24/7',
    Tags: ['#news'],
    Intro: {
        Time: 5,
        Text: 'Afin d\'être informé veuillez vous abonner et cliquez sur la cloche pour être notifié!'
    },
    LCode: 'Fr-fr',
    Magazines: ['voici', 'gala', 'vminutes-people', 'vminutes-divers', 'vminutes-sports', 'figaro', 'valeursactuelles']
};

const LauncherClass = require('./classes/Launcher.js');
const Launcher = new LauncherClass(__dirname, Config);

// Launcher.AddStep('findMagazines', function(){

// });

// Launcher.AddPresetStep('findMagazines', Arguments);

// Launcher.AddPresetStep('findImages', Arguments);

let vocals = [];

for (let i = 0; i < total; i++) {
    const WpR = 15;

    const sentence_array = content.split(' ').slice(i * WpR, i * WpR + WpR);

    let sentence = sentence_array.join(' ') + '.';
    if (sentence_array.length < 12) {
        sentence = sentence + ' Merci d\'avoir regardé!';
    }

    vocals.push({
        lang: self.Config.LCode,
        text: sentence
    });
};

// this.AudioProcess.createCompilation(vocals).then((res) => {
//     success(res);
// });

// Launcher.AddPresetStep('genAudio', Arguments);

// Launcher.AddPresetStep('genImagesPerAudioChunk', Arguments);

// Launcher.AddPresetStep('genVideo', Arguments);

// Launcher.AddPresetStep('upload', Arguments);

Launcher.Run();