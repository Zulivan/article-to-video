module.exports = function (magazines, extradata) {
    return new Promise((success, error) => {
        const MagazineBrowser = require('../classes/MagazineBrowser.js');
        const MB = new MagazineBrowser(extradata.Config.Directory, extradata.Config.Folder, magazines);

        console.log('yes')

        MB.getMagazine().then(Magazine => {
            console.log('Found a fresh magazine..');
            if (Magazine) {
                if (Magazine.title && Magazine.content) {
                    
                    const output = {
                        type: 'magazine',
                        values: Magazine
                    }

                    success(output);

                } else {
                    error('The loaded magazine doesn\'t have the needed parameters to proceed with it');
                }
            } else {
                error('No magazine found');
            }
        }).catch((err) => {
            error('Cannot get magazine, ' + err);
        });
    });
};