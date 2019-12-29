const Config = {
    LocalPort: 5000,
    oAuth: {
        Public: '786080127763-t7f9qpknu5mk8ddkoe6u17qp8glfalj2.apps.googleusercontent.com',
        Private: 'SoSz4zAFYi2YmoNu-ObCLSvK'
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