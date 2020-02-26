const Config = {
    LocalPort: 5008,
    oAuth: {
        Public: '086080127763-qmrkld41cf5vreqpsb74bncblmt303n6.apps.googleusercontent.com',
        Private: 'sgPGM3qrMi_zQR3aAsRcSNeP'
    },
    Video: {
        CompliationLoop: 3
    },
    Folder: 'h2p',
    Word: 'Aww Man',
    Tags: ['pronounce '+this.Word, 'say '+this.Word, 'how to spell '+this.Word]
};


const LauncherClass = require('./classes/Launcher.js');
const Launcher = new LauncherClass(__dirname, Config);

this.Accents = {
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

let vocals = [];

for (let i in self.Accents) {
    vocals.push({
        lang: self.Accents[i].langcode,
        text: word,
        extra: self.Accents[i]
    });
};

// Launcher.AddPresetStep('genAudio', Arguments);

// Launcher.AddPresetStep('genImagesPerAudioChunk', Arguments);

// Launcher.AddPresetStep('genVideo', Arguments);

// Launcher.AddPresetStep('upload', Arguments);

Launcher.Run();