const Config = {
    oAuth: {
        LocalPort: 5003,
        Public: '086080127763-qmrkld41cf5vreqpsb74bncblmt303n6.apps.googleusercontent.com',
        Private: 'sgPGM3qrMi_zQR3aAsRcSNeP'
    },
    Video: {
        CompilationLoop: 3
    },
    Folder: 'h2p',
    Word: 'Aww Man',
    Tags: ['pronounce ' + this.Word, 'say ' + this.Word, 'how to spell ' + this.Word]
};


const LauncherClass = require('./classes/Launcher.js');
const Launcher = new LauncherClass(__dirname, Config);

const Accents = {
    australian: {
        langcode: 'en-AU',
        name: 'Australian English'
    },
    british: {
        langcode: 'en',
        name: 'British English'
    },
    indian: {
        langcode: 'en-IN',
        name: 'Indian English'
    },
    american: {
        langcode: 'en-US',
        name: 'American English'
    }
};

const fs = require('fs');
const path = require('path');

Launcher.Load().then(() => {

    const wordsfile = JSON.parse(fs.readFileSync(path.join(Config.Folder, 'temp', 'words.json'), 'utf8'));
    console.log('Loaded ' + wordsfile.length + ' words!');
    const word = wordsfile.shift();
    console.log('The word of today is ' + word);

    let vocals = [];

    for (let i in Accents) {
        vocals.push({
            lang: Accents[i].langcode,
            text: word,
            extra: Accents[i]
        });
    };

    Launcher.AddPresetStep('genAudio', vocals);

    let Arguments = {
        type: 'h2p',
        background: path.join(Config.Folder, 'preset', 'background.jpg')
    }

    Launcher.AddPresetStep('genImagesPerAudioChunk', Arguments);

    Arguments = {
        fileName: word
    }

    Launcher.AddPresetStep('genVideo', Arguments);

    // Launcher.AddPresetStep('upload', Arguments);

    //TODO SKIP TO NEXT WORD

    Launcher.AddStep(function () {
        fs.writeFileSync(path.join(Config.Folder, 'temp', 'words.json'), JSON.stringify(self.wordsfile));
    });
});