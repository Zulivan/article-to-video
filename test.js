const Config = {
    Directory: __dirname,
    LocalPort: 5000,
    oAuth: {
        Public: '370774627054-dl9pkp0f4ktnp4k46drueucvv7lenj0o.apps.googleusercontent.com',
        Private: 'xbC5kRQV00HT28iStA0rH28V'
    },
    Video: {
        CompliationLoop: false
    },
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

const MagazineBrowser = require('./classes/MagazineBrowser.js');
const MB = new MagazineBrowser(Config, Config.Directory, Config.Folder);

MB.getMagazine().then(Magazine => {
    console.log(Magazine.title)
    console.log(Magazine.content)
});


//testThumbnailGeneration()

function testThumbnailGeneration(){
    const ImageMaker = require('./classes/ImageMaker.js');
    const IM = new ImageMaker(Config);

    IM.generateThumbnail('314063.jpg').then((thumbnail_dir, errimg) => {
        console.log(thumbnail_dir)
    });
};