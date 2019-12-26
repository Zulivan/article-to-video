const Config = {
    LocalPort: 5000,
    oAuth: {
        Public: '786080127763-qmrkld41cf5vreqpsb74bncblmt303n6.apps.googleusercontent.com',
        Private: 'sgPGM3qrMi_zQR3aAsRcSNeP'
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

const Bot = require('./classes/Bot.js');
const Actubot = new Bot(__dirname, Config);

// Actubot