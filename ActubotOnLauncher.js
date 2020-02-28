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
        const preload = JSON.parse(fs.readFileSync(path.join(Config.Directory, Config.Folder, 'temp', 'preload.json'), 'utf8'));

        fs.writeFileSync(path.join(Config.Directory, Config.Folder, 'temp', 'preload.json'), JSON.stringify({
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
        console.log(e)
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

    Arguments = {
        overlay: path.join(Config.Folder, 'preset', 'thumbnail.png'),
        background: path.join(Config.Folder, 'images', 'image0.jpg')
    }

    Launcher.AddPresetStep('genThumbnail', Arguments);

    Launcher.AddPresetStep('genVideo');

    const Videos = [path.join(Config.Folder, 'preset', 'intro.mp4'), Launcher.GetExtraData('video')];

    console.log(Videos)

    Launcher.AddPresetStep('concatVideos', Videos);

    let tags = ['#news'];
    const searchterms = Launcher.GetExtraData('magazine').content;

    tags.concat(searchterms);

    Arguments = {
        file: Launcher.GetExtraData('video'),
        title: Launcher.GetExtraData('magazine').title,
        subtitles: Launcher.GetExtraData('magazine').content,
        tags: tags,
        thumbnail: Launcher.GetExtraData('thumbnail')
    }

    Launcher.AddPresetStep('upload', Arguments);
});