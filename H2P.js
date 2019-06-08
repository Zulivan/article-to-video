const Config = {
    LocalPort: 5000,
    oAuth: {
        Public: '786080127763-qmrkld41cf5vreqpsb74bncblmt303n6.apps.googleusercontent.com',
        Private: 'sgPGM3qrMi_zQR3aAsRcSNeP'
    },
    Folder: 'h2p',
    Tags: ['how to pronounce']
};

const Bot = require('./classes/Pronounciation.js');
const H2P = new Bot(__dirname, Config);