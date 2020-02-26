const Config = {
    oAuth: {
        LocalPort: 5000,
        Public: '370774627054-dl9pkp0f4ktnp4k46drueucvv7lenj0o.apps.googleusercontent.com',
        Private: 'xbC5kRQV00HT28iStA0rH28V'
    },
    Video: {
        CompliationLoop: false
    },
    Folder: 'webdriver'
};

const LauncherClass = require('./classes/Launcher.js');
const Launcher = new LauncherClass(__dirname, Config);

let image_info = [];

for (let i = 0; i < 15; i++) {
    image_info.push({
        type: 'rndimage'
    });
};

Launcher.AddPresetStep('genImages', image_info);

const Args = {
    audioFile: 'tone.mp3'
}

Launcher.AddPresetStep('genVideo', Args);
