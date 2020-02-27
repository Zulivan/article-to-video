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

Launcher.Load().then(() => {

    let image_info = [];

    for (let i = 0; i < 15; i++) {
        image_info.push({
            type: 'rndimage'
        });
    };

    Launcher.AddPresetStep('genImages', image_info);

    function makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    const Args = {
        audioFile: 'tone.mp3',
        fileName: makeid(7)
    }

    Launcher.AddPresetStep('genVideo', Args);
});