const Magazine = require('../classes/Magazine.js');
const Public = new Magazine('vminutes-divers', 'http://www.20minutes.fr/faits_divers', 'http://www.20minutes.fr');
const cheerio = require('cheerio');

Public.setBrowser(function (content) {
    let parsed = content.toString().replace(/\s/g, '');
    if (parsed.indexOf('section="faits_divers"><ahref="/faits_divers/') > -1) {
        parsed = parsed.slice(parsed.indexOf('section="faits_divers"><ahref="/faits_divers/'), parsed.length - 1).replace('section="faits_divers"><ahref="', '');
        let articlelink = parsed.slice(parsed, parsed.indexOf('"'));
        articlelink = articlelink.split('"');
        articlelink = articlelink.join('');
        return articlelink;
    }
    return null;
});

Public.setReader(function (content) {
    let videotitle = null;
    let videocontent = null;
    let parsed = JSON.parse(JSON.stringify(content.toString()));
    let scraper = cheerio.load(content);
    let contentsplit = [];

    if (parsed.indexOf('<h1 class="nodeheader-title">') > -1) {
        videotitle = parsed.slice(parsed.indexOf('<h1 class="nodeheader-title">'), (parsed.length - 1)).replace('<h1 class="nodeheader-title">', '');
        videotitle = videotitle.slice(videotitle, videotitle.indexOf('</h1>'));
        videotitle = videotitle.split('</h1>');
        videotitle = videotitle.join('');
        videotitle = videotitle.replace('<h1 class="nodeheader-title">', '');
    }

    parsed = JSON.parse(JSON.stringify(content.toString()));

    scraper('div.lt-endor-body.content').find('p').each(function (i, elm) {
        contentsplit.push(scraper(this).text())
        videocontent = contentsplit[contentsplit.length - 1]
    });
    return {
        title: videotitle,
        content: videocontent
    };
});


module.exports = Public;