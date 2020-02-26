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

// pour enlever les 2 tools de audio processing on loop 4 fois avec accent différent les parties.


// Launcher.AddPresetStep('genAudio', Arguments);

// Launcher.AddPresetStep('genImagesPerAudioChunk', Arguments);

// Launcher.AddPresetStep('genVideo', Arguments);

// Launcher.AddPresetStep('upload', Arguments);

Launcher.Run();