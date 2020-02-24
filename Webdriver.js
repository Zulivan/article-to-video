const Config = {
    LocalPort: 5000,
    oAuth: {
        Public: '370774627054-dl9pkp0f4ktnp4k46drueucvv7lenj0o.apps.googleusercontent.com',
        Private: 'xbC5kRQV00HT28iStA0rH28V'
    },
    Video: {
        CompliationLoop: false
    },
    Folder: 'webdriver'
};

const Bot = require('./classes/Webdriver.js');
const Actubot = new Bot(__dirname, Config);

// Actubot