const Magazine = require('../classes/Magazine.js');
const Public = new Magazine('voici', 'https://www.voici.fr/news-people/actu-people', 'https://www.voici.fr');
const cheerio = require('cheerio');

Public.setBrowser(function(content){
    let parsed = content.toString();
    if(parsed.indexOf('<a data-wide href="/news-people/actu-people/') > -1) {
        parsed = parsed.slice(parsed.indexOf('<a data-wide href="'), (parsed.length - 1)).replace('<a data-wide href="', '')
        let articlelink = parsed.slice(parsed, parsed.indexOf('"'));
        articlelink = articlelink.split('"');
        articlelink = articlelink.join('');
        return articlelink;
    }
    return null;
});

Public.setReader(function(content){
    let videotitle = null;
    let videocontent = null;
    let parsed = JSON.parse(JSON.stringify(content.toString()));
    let scraper = cheerio.load(content);
    let contentsplit = [];

    if(parsed.indexOf('<h1 class="articleChapo-mainTitle">') > -1) {
        videotitle = parsed.slice(parsed.indexOf('<h1 class="articleChapo-mainTitle">'), (parsed.length - 1)).replace('<h1 class="articleChapo-mainTitle montserrat">', '');
        videotitle = videotitle.slice(videotitle, videotitle.indexOf('</h1>'));
        videotitle = videotitle.split('</h1>');
        videotitle = videotitle.join('');
        videotitle = videotitle.replace('<h1 class="articleChapo-mainTitle">','');
    }

    parsed = JSON.parse(JSON.stringify(content.toString()));

    // scraper('.articleChapo-mainTitle.montserrat').filter(function(){
    //     videotitle = scraper(this).first().text()
    // });

    // scraper('.articleGrid.twoColsGrid.pageGrid').each(function(i, elm) {

    scraper('.articleContent-main').each(function(i, elm) {
        contentsplit.push(scraper(this).text())
        videocontent = contentsplit[contentsplit.length - 1]
    });
    return {title: videotitle, content: videocontent};
});


module.exports = Public;