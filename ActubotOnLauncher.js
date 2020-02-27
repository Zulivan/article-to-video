const Config = {
    oAuth: {
        LocalPort: 5000,
        Public: '370774627054-dl9pkp0f4ktnp4k46drueucvv7lenj0o.apps.googleusercontent.com',
        Private: 'xbC5kRQV00HT28iStA0rH28V'
    },
    Video: {
        CompliationLoop: false
    },
    Folder: 'actus',
    Name: 'FRANCE INFOS 24/7',
    Intro: {
        Time: 5,
        Text: 'Afin d\'être informé veuillez vous abonner et cliquez sur la cloche pour être notifié!'
    },
};

const fs = require('fs');
const path = require('path');

const LauncherClass = require('./classes/Launcher.js');
const Launcher = new LauncherClass(__dirname, Config);

Launcher.Load().then(() => {
    const Magazines = ['voici', 'gala', 'vminutes-people', 'vminutes-divers', 'vminutes-sports', 'figaro', 'valeursactuelles']

    try {
        const preload = JSON.parse(fs.readFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'preload.json'), 'utf8'));
        fs.writeFileSync(path.join(this.Config.Directory, this.Config.Folder, 'temp', 'preload.json'), JSON.stringify({
            title: '',
            content: ''
        }));

        if (preload.title && preload.content && preload.title.length > 0) {
            Launcher.SetExtraData('magazine', preload);
        } else {
            console.log('The content to preload doesnt have one of these options: title, content');
            Launcher.AddPresetStep('findMagazines', Magazines);
        }
    } catch (e) {
        console.log('The preloaded content file is corrupt.');
        Launcher.AddPresetStep('findMagazines', Magazines);
    }

    let Arguments = {
        type: 'magazine',
        query: 'since the kind of the query is the magazine; this option is useless'
    }

    Launcher.AddPresetStep('findImages', Arguments);

    Arguments = {
        wpr: 15,
        text: Launcher.GetExtraData('magazine').content,
        lang: 'Fr-fr',
    };

    Launcher.AddPresetStep('genAudio', Arguments);

    Arguments = {
        type: 'news'
    }

    Launcher.AddPresetStep('genImagesPerAudioChunk', Arguments);

    Launcher.AddPresetStep('genVideo');
    
    let Videos = [path.join(__dirname, Config.Folder, 'preset', 'intro.mp4'), Launcher.GetExtraData('video')];
    Launcher.AddPresetStep('concatVideos', Videos);
    // tags ['#news']
    // Launcher.AddPresetStep('upload', Arguments);
});