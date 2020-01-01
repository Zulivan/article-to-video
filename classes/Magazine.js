const request = require('request');

module.exports = class Magazine {
    /**
     * Initializes a magazine class
     */

    constructor(index, uri, root) {
        this.id = index;
        this.uri = uri;
        this.root = root;
    };

    /**
     * Sets a function to find the lastest posted article
     * @param {function} func Function executed whenever this website is called by the Magazine browser
     */

    setBrowser(func) {
        if (typeof (func) !== 'function') throw new TypeError('Expected func to be a function');
        this.browser = func;
    };

    /**
     * Gets the lastest posted article
     */

    getArticle() {
        return new Promise((resolve, reject) => {
            if (this.browser) {
                const browserfunc = this.browser;
                request({
                    encoding: 'utf8',
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                    },
                    uri: this.uri
                }, function (error, _, html) {
                    if (error) {
                        console.log(error)
                        reject(error);
                    }else{
                        resolve(browserfunc(html));
                    };
                });
            };
        });
    };

    /**
     * Gets the content of the article
     * @param {function} link Link of the article to read
     */

    readArticle(link) {
        return new Promise((resolve, reject) => {
            if (this.reader) {
                const browserfunc = this.reader;
                request({
                    encoding: 'UTF-8',
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
                    },
                    uri: this.root + link
                }, function (error, _, html) {
                    if (error) {
                        console.log(error)
                        reject(error);
                    }else{
                        resolve(browserfunc(html));
                    };
                });
            };
        });
    };

    /**
     * Reads an article on the specified website
     * @param {function} func Function executed after all the modules are loaded
     */

    setReader(func) {
        if (typeof (func) !== 'function') throw new TypeError('Expected func to be a function');
        this.reader = func;
    };
};