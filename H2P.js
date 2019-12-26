const Config = {
    LocalPort: 5000,
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

const Bot = require('./classes/H2P.js');
const H2P = new Bot(__dirname, Config);