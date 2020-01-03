const videoshow = require('videoshow');
const request = require('request');
const cheerio = require('cheerio');
const audioconcat = require('audioconcat');
const mp3Duration = require('mp3-duration');
const txtomp3 = require('text-to-mp3');
const GoogleImages = require('google-images');
const download = require('image-downloader');
const jimp = require('jimp');
const got = require('got');
const mime = require('mime');
const fs = require('fs');
const Lien = require('lien');
const Google = require('googleapis');
const opn = require('opn');
const prettyBytes = require('pretty-bytes');

let oauth = new Google.auth.OAuth2(oauthpublic, oauthprivate, "http://localhost:"+localport+"/oauth2callback");

var precachearticle = null;
var speecherror = -1;
var speecherroramt = 0;
var channelname = "FRANCE INFOS 24/7";
var currentbytes = -1;
var firstupload = true;
var projectprogression = {};
var wordsperrecord = 15;
var maxchars = 60;
var magazinetries = -1;
var tagsvid = ["#news"]
var propername = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

var prevPages = {}
prevPages.voici = null
prevPages.gala = null
prevPages.vminutes = null
prevPages.vminutes1 = null
prevPages.vminutes2 = null
prevPages.figaro = null
prevPages.valeursactuelles = null
var imgdownloaded = []

function waitMinutes(time){
	console.log('No article found, fetching again in '+time+' minutes..')
	resetProgram(false)
	setTimeout(function(){
		process.exit();
	},(time * 60 * 1000))
}

function searchImages(query, callback){
	var requestOptions = {
		encoding: "utf8",
		json: true,
		method: "GET",
		headers: {
			'X-Mashape-Key':'inNpyVnZf4mshBoJQyltw4Jm2Ocrp1SstqfjsnLVnY4yZUkVRh',
			'X-Mashape-Host':'contextualwebsearch-websearch-v1.p.mashape.com'
		},
		uri: 'https://contextualwebsearch-websearch-v1.p.mashape.com/api/Search/ImageSearchAPI?count=15&q='+query+'&autoCorrect=false&safeSearch=true'
	};
	request(requestOptions, function(error, response, body){
		const items = body.value || [];
		callback(items)
	})
	
}

function browseMagazine(){
	if(projectprogression.magazinechosen == false){
		fs.readFile('lastmagazines.json', 'utf8', function (err, data) {
			if(data.length > 5){
				prevPages = JSON.parse(data)
			}
			magazinetries = magazinetries + 1
			console.log('Loading magazine #'+magazinetries)
			if(magazinetries == 0){
				var requestOptions = { encoding: "utf8", method: "GET", uri: "https://www.voici.fr/news-people/actu-people"};
				request(requestOptions, function(error, response, html){
					if(!error){
						var parsed = html.toString()
						if(parsed.indexOf('data-share-setlinkback="') > -1) {
							parsed = parsed.slice(parsed.indexOf('data-share-setlinkback="'), (parsed.length - 1)).replace('data-share-setlinkback="', '')
							var articlelink = parsed.slice(parsed, parsed.indexOf('"'))
							articlelink = articlelink.split('"')
							articlelink = articlelink.join('')
							setTimeout(function(){
								if(prevPages.voici == articlelink){
									browseMagazine()
								}else{
									readPage(articlelink)
								}
							},10000)
						}else{
							waitMinutes(10)
						}
					}else{
						waitMinutes(10)	
					}
				})
			}else if(magazinetries == 1){
				var requestOptions = { encoding: "utf8", method: "GET", uri: "https://www.gala.fr/l_actu/news_de_stars"};
				request(requestOptions, function(error, response, html){
					if(!error){
						var parsed = html.toString()
						if(parsed.indexOf('/l_actu/news_de_stars/') > -1) {
							parsed = parsed.slice(parsed.indexOf('href="/l_actu/news_de_stars/'), (parsed.length - 1)).replace('href="', '')
							var articlelink = parsed.slice(0, parsed.indexOf('"'))
							articlelink = articlelink.split('"')
							articlelink = articlelink.join('')
							articlelink = "https://www.gala.fr" + articlelink
							setTimeout(function(){
								if(prevPages.gala == articlelink){
									browseMagazine()
								}else{
									readPage(articlelink)
								}
							},10000)
						}else{
							waitMinutes(10)
						}
					}else{
						waitMinutes(10)
					}
				})
			}else if(magazinetries == 2){
				var requestOptions = { encoding: "utf8", method: "GET", uri: "https://www.20minutes.fr/arts-stars/people/"};
				request(requestOptions, function(error, response, html){
					if(!error){
						var parsed = html.toString()
						if(parsed.indexOf('/arts-stars/people/') > -1) {
							parsed = parsed.slice(parsed.indexOf('<a href="/arts-stars/people/'), (parsed.length - 1)).replace('<a href="', '')
							while(parsed.slice(0, parsed.indexOf('"')).length < 30){
								parsed = parsed.replace('/arts-stars/people/', '')
								parsed = parsed.slice(parsed.indexOf('<a href="/arts-stars/people/'), (parsed.length - 1)).replace('<a href="', '')
							}
							var articlelink = parsed.slice(0, parsed.indexOf('"'))
							articlelink = articlelink.split('"')
							articlelink = articlelink.join('')
							articlelink = "https://www.20minutes.fr" + articlelink
							setTimeout(function(){
								if(prevPages.vminutes == articlelink){
									browseMagazine()
								}else{
									readPage(articlelink)
								}
							},10000)
						}else{
							waitMinutes(10)
						}
					}else{
						waitMinutes(10)
					}
				})
			}else if(magazinetries == 3){
				var requestOptions = { encoding: "utf8", method: "GET", uri: "https://www.20minutes.fr/faits_divers/"};
				request(requestOptions, function(error, response, html){
					if(!error){
						var parsed = html.toString()
						if(parsed.indexOf('/faits_divers/') > -1) {
							parsed = parsed.slice(parsed.indexOf('<a href="/faits_divers/'), (parsed.length - 1)).replace('<a href="', '')
							while(parsed.slice(0, parsed.indexOf('"')).length < 20){
								parsed = parsed.replace('/faits_divers/', '')
								parsed = parsed.slice(parsed.indexOf('<a href="/faits_divers/'), (parsed.length - 1)).replace('<a href="', '')
							}
							var articlelink = parsed.slice(0, parsed.indexOf('"'))
							articlelink = articlelink.split('"')
							articlelink = articlelink.join('')
							articlelink = "https://www.20minutes.fr" + articlelink
							setTimeout(function(){
								if(prevPages.vminutes1 == articlelink){
									browseMagazine()
								}else{
									console.log(articlelink)
									readPage(articlelink)
								}
							},10000)
						}else{
							waitMinutes(10)
						}
					}else{
						waitMinutes(10)
					}
				})
			}else if(magazinetries == 4){
				var requestOptions = { encoding: "utf8", method: "GET", uri: "https://www.20minutes.fr/sport/"};
				request(requestOptions, function(error, response, html){
					if(!error){
						var parsed = html.toString()
						if(parsed.indexOf('/sport/') > -1) {
							parsed = parsed.slice(parsed.indexOf('<a href="/sport/'), (parsed.length - 1)).replace('<a href="', '')
							while(parsed.slice(0, parsed.indexOf('"')).length < 20){
								parsed = parsed.replace('/sport/', '')
								parsed = parsed.slice(parsed.indexOf('<a href="/sport/'), (parsed.length - 1)).replace('<a href="', '')
							}
							var articlelink = parsed.slice(0, parsed.indexOf('"'))
							articlelink = articlelink.split('"')
							articlelink = articlelink.join('')
							articlelink = "https://www.20minutes.fr" + articlelink
							setTimeout(function(){
								if(prevPages.vminutes2 == articlelink){
									browseMagazine()
								}else{
									console.log(articlelink)
									readPage(articlelink)
								}
							},10000)
						}else{
							waitMinutes(10)
						}
					}else{
						waitMinutes(10)
					}
				})
			}else if(magazinetries == 5){
				var requestOptions = { encoding: "utf8", method: "GET", uri: "http://tvmag.lefigaro.fr/programme-tv/people/"};
				request(requestOptions, function(error, response, html){
					if(!error){
						var parsed = html.toString()
						if(parsed.indexOf('http://tvmag.lefigaro.fr/programme-tv/') > -1) {
							parsed = parsed.slice(parsed.indexOf('fig-list-articles'), (parsed.length - 1)).replace('fig-list-articles', '')
							parsed = parsed.slice(parsed.indexOf('<a href="http://tvmag.lefigaro.fr/programme-tv/'), (parsed.length - 1)).replace('<a href="', '')
							while(parsed.slice(0, parsed.indexOf('"')).indexOf('tnt') > -1 || parsed.slice(0, parsed.indexOf('"')).length < 50){
								console.log(parsed.slice(0, parsed.indexOf('"')).length < 50+ ' negro: '+parsed.slice(0, parsed.indexOf('"')).indexOf('tnt') > -1)
								parsed = parsed.replace('http://tvmag.lefigaro.fr/programme-tv/', '')
								parsed = parsed.slice(parsed.indexOf('<a href="http://tvmag.lefigaro.fr/programme-tv/'), (parsed.length - 1)).replace('<a href="', '')
							}
							var articlelink = parsed.slice(0, parsed.indexOf('"'))
							articlelink = articlelink.split('"')
							articlelink = articlelink.join('')
							setTimeout(function(){
								if(prevPages.figaro == articlelink){
									browseMagazine()
								}else{
									readPage(articlelink)
								}
							},10000)
						}else{
							waitMinutes(10)
						}
					}else{
						waitMinutes(10)
					}
				})
			}else if(magazinetries == 6){
				var requestOptions = { encoding: "utf8", method: "GET", uri: "https://www.valeursactuelles.com/societe"};
				request(requestOptions, function(error, response, html){
					if(!error){
						var parsed = html.toString()
						if(parsed.indexOf('/societe/') > -1) {
							parsed = parsed.slice(parsed.indexOf('<a href="/societe/'), (parsed.length - 1)).replace('<a href="', '')
							var articlelink = parsed.slice(0, parsed.indexOf('"'))
							articlelink = articlelink.split('"')
							articlelink = articlelink.join('')
							articlelink = "https://www.valeursactuelles.com" + articlelink
							setTimeout(function(){
								if(prevPages.valeursactuelles == articlelink){
									browseMagazine()
								}else{
									readPage(articlelink)
								}
							},10000)
						}else{
							waitMinutes(10)
						}
					}else{
						waitMinutes(10)
					}
				})
			}else{
				waitMinutes(10)
			}
		})
	}else{
		readPage(projectprogression.magazinechosen)
	}
}

function readPage(url){
	fs.readFile('lastmagazines.json', 'utf8', function (err, data) {
		if(data.length > 5){
			prevPages = JSON.parse(data)
		}
		projectprogression.magazinechosen = url;
		var requestOptions = { encoding: "utf8", method: "GET", uri: url};
		if(projectprogression.magazineloaded == false){
			var videotitle = null
			var videocontent = "Abonnez vous"
			if(url.indexOf("voici") > -1){ // Si le magazine est Voici.fr
				if(prevPages.voici == url){
					browseMagazine()
				}else{
					request(requestOptions, function(error, response, html){
						if(!error){
							console.log('Reading Voici.fr')
							var scraper = cheerio.load(html);
							var contentsplit = [];
							scraper('.opensans.fs-1.c-black.fw-700.lh-125').filter(function(){
								videotitle = scraper(this).first().text()
							});
							scraper('#content-left-article').each(function(i, elm) {
								contentsplit.push(scraper(this).text())
								videocontent = contentsplit[contentsplit.length - 1]
							});
							prevPages.voici = url;
							fs.writeFile("lastmagazines.json", JSON.stringify(prevPages), function(errfile) {
								produceVideo(videotitle, videocontent)
							})
						}
					})
				}
			}else if(url.indexOf("gala") > -1){ // Si le magazine est Gala.fr
				if(prevPages.gala == url){
					browseMagazine()
				}else{
					request(requestOptions, function(error, response, html){
						if(!error){
							console.log('Reading Gala.fr')
							var scraper = cheerio.load(html);
							var contentsplit = [];
							scraper('h1[class="m-reset inline"]').filter(function(){
								videotitle = scraper(this).first().text()
							});
							scraper('div[class="ugc text-justify clearfix"]').each(function(i, elm) {
								contentsplit.push(scraper(this).text())
								videocontent = contentsplit[contentsplit.length - 1]
							});
							prevPages.gala = url;
							fs.writeFile("lastmagazines.json", JSON.stringify(prevPages), function(errfile) {
								produceVideo(videotitle, videocontent)
							})
						}
					})
				}
			}else if(url.indexOf("20minutes") > -1){ // Si le magazine est 20minutes.fr
				if(prevPages.vminutes == url || prevPages.vminutes1 == url || prevPages.vminutes2 == url){
					browseMagazine()
				}else{
					request(requestOptions, function(error, response, html){
						if(!error){
							console.log('Reading 20minutes.fr')
							var scraper = cheerio.load(html);
							var contentsplit = [];
							scraper('h1[class="nodeheader-title"]').filter(function(){
								videotitle = scraper(this).first().text()
							});
							scraper('div[class="lt-endor-body content"]').each(function(i, elm) {
								contentsplit.push(scraper(this).text())
								videocontent = contentsplit[contentsplit.length - 1]
							});
							if(url.indexOf("people") > -1){
								prevPages.vminutes = url;
							}else if(url.indexOf("faits_divers") > -1){
								prevPages.vminutes1 = url;
							}else if(url.indexOf("sport") > -1){
								prevPages.vminutes2 = url;
							}
							videocontent = videocontent.slice(0, videocontent.indexOf('A lire aussi'))
							fs.writeFile("lastmagazines.json", JSON.stringify(prevPages), function(errfile) {
								produceVideo(videotitle, videocontent)
							})
						}
					})
				}
			}else if(url.indexOf("figaro") > -1){ // Si le magazine est lefigaro.fr
				if(prevPages.figaro == url){
					browseMagazine()
				}else{
					request(requestOptions, function(error, response, html){
						if(!error){
							console.log('Reading lefigaro.fr')
							var scraper = cheerio.load(html);
							var contentsplit = [];
							scraper('h1[class="fig-main-title"]').filter(function(){
								videotitle = scraper(this).first().text()
							});
							scraper('div[class="fig-content__body"]').each(function(i, elm) {
								contentsplit.push(scraper(this).text())
								videocontent = contentsplit[contentsplit.length - 1]
							});
							prevPages.figaro = url;
							videocontent = videocontent.slice(0, videocontent.indexOf('A lire aussi'))
							fs.writeFile("lastmagazines.json", JSON.stringify(prevPages), function(errfile) {
								produceVideo(videotitle, videocontent)
							})
						}
					})
				}
			}else if(url.indexOf("valeursactuelles") > -1){ // Si le magazine est Valeurs Actuelles
				if(prevPages.valeursactuelles == url){
					browseMagazine()
				}else{
					request(requestOptions, function(error, response, html){
						if(!error){
							console.log('Reading valeursactuelles.fr')
							var scraper = cheerio.load(html);
							var contentsplit = [];
							scraper('h1[class="title page-title"]').filter(function(){
								videotitle = scraper(this).first().text()
							});
							scraper('div[property="schema:text"]').each(function(i, elm) {
								contentsplit.push(scraper(this).text())
							});
							prevPages.valeursactuelles = url;
							videocontent = contentsplit.join(" ")
							videocontent = videocontent.slice(0, videocontent.indexOf('A lire aussi'))
							fs.writeFile("lastmagazines.json", JSON.stringify(prevPages), function(errfile) {
								produceVideo(videotitle, videocontent)
							})
						}
					})
				}
			}else{
				console.log('Magazine parsing schema isn\'t set for url: '+url)
			}
		}else{
			produceVideo(projectprogression.magazineloaded.title,projectprogression.magazineloaded.content)
		}
	})
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

			function produceVideo(title, content){
				if(title == null){
					resetProgram(true)
				}else{
					projectprogression.magazineloaded = {'title':title, 'content':content};
					fs.writeFile('./'+resourcesfolder+'/preset/progression.json', JSON.stringify(projectprogression), function(errfile) {
						if(errfile) {
							return console.log(errfile);
						}
						content = content.replace(/(\r\n\t|\n|\r\t)/gm,"");
						content = content.replace(/\s\s+/g, ' ');
						content = content.split("-­")
						content = content.join("")
						content = content.split("­")
						content = content.join("")
						content = content.split("<")
						content = content.join("")
						content = content.split(">")
						content = content.join("")
						content = content.replace(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g, "");
						content = content.replace(/voici.fr/g, "24 sur 7 news france");
						const precontent = content
						content = content.split("«")
						content = content.join("")
						content = content.split("»")
						content = content.join("")
						content = content.split('"')
						content = content.join("")
						content = content.split('?')
						content = content.join("")
						content = content.split('#')
						content = content.join("")
						content = content.split('@')
						content = content.join("")
						content = content.replace(/closer/g, "closeure");
						content = content.replace(/la mort/g, "la disparition");
						content = content.replace(/mort/g, "disparu");
						content = videointro+''+content
						
						fs.writeFile("caption.txt", content, function(errwrite) {})
						
						title = title.split("«")
						title = title.join("")
						title = title.split("»")
						title = title.join("")
						title = title.split("<")
						title = title.join("")
						title = title.split(">")
						title = title.join("")
						title = title.replace(/\s\s+/g, ' ');
						title = title.split("­")
						title = title.join("")

						const titleword = title.split(" ")
						var propertitle = []
						for(var i=0; i < titleword.length; i++) {
							var alreadyadded = false;
							for(var j=0; j < propername.length; j++) {
								if(titleword[i].includes(propername[j])){
									if(!alreadyadded){
										alreadyadded = true;
										propertitle.push(titleword[i])
									}
								}
							}
						}
						propertitle = propertitle.join(" ")
						propertitle = propertitle.replace(/\s\s+/g, ' ');
						propertitle = propertitle.split(":")
						propertitle = propertitle.join("")
						const searchterm = title.split(":")
						if(title.length > 92){
							title = title.slice(0, 90)
							title = title+"..."
						}
						
						console.log("Title: "+title)
						console.log("----------------")
						console.log("Research terms: "+propertitle)
						console.log("--------------------------------")
						console.log("Content: "+content)
						console.log("--------------------------------")
						var words = content.split(" ")
						var imgrendered = projectprogression.imagerendered
						
						function imageProcess(index, array){
							if(array[index].url.indexOf(".jpg") > -1 || array[index].url.indexOf(".bmp") > -1 || array[index].url.indexOf(".png") > -1){
								var options = {
									url: array[index].url,
									dest: __dirname + '/' + resourcesfolder
								}
								download.image(options).then(({ filename, nulle }) => {
									let filenew = getRandomArbitrary(10, 999999)+'.jpg';
									var imgdir = resourcesfolder+'/'+filename.split('\\')[filename.split('\\').length - 1];
									if(filename.indexOf(".jpg") > -1 || filename.indexOf(".bmp") > -1 || filename.indexOf(".png") > -1){
										var directory = './'+resourcesfolder+'/'+filenew;
										setTimeout(function(){
											jimp.loadFont(jimp.FONT_SANS_64_BLACK).then(function (font) {
												jimp.read(imgdir, function (err, imagebuffer) {
													if (err) throw err;
													imagebuffer.resize(1080, 720).blur(1).flip(true, false).print(font, 2, 2, channelname).write(directory);
													imgdownloaded.push({path: directory, name:filenew})
													projectprogression.imagedownloaded = imgdownloaded
													console.log('Compiled: '+filename)
												});
											});
										},2000);
									};
								}).catch((err) => {
									throw err
								})
							}
						}

						if(projectprogression.imagedownloaded.length == 0){
							if(title.length > 0){
								searchImages(propertitle, function(returnimg){
									if(returnimg.length > 0){
										for(var i=0; i < returnimg.length; i++) {
											imageProcess(i, returnimg)
										}
										setTimeout(function(){
											afterImgSearch()
										},10000)
									}else if(searchterm.length > 0){
										searchImages(searchterm[0], function(returnimg2){
											if(returnimg2.length > 0){
												for(var i=0; i < returnimg2.length; i++) {
													imageProcess(i, returnimg2)
												}
												setTimeout(function(){
													afterImgSearch()
												},10000)
											}else if(searchterm.length > 1){
												searchImages(searchterm[1], function(returnimg3){
													if(returnimg3.length > 0){
														for(var i=0; i < returnimg3.length; i++) {
															imageProcess(i, returnimg3)
														}
														setTimeout(function(){
															afterImgSearch()
														},10000)
													}else{
														resetProgram(true)
													}
												})
											}else{
												resetProgram(true)
											}
										})
									}else{
										resetProgram(true)
									}
								})
							}else{
								resetProgram(true)
							}
						}else{	
							imgdownloaded = projectprogression.imagedownloaded
							afterImgSearch()
						}
						
						function afterImgSearch(){
							console.log('Generating ~'+(Math.floor(words.length/wordsperrecord)+1)+' different vocals using google voice!')
							console.log('=====================================================')
							
							var vocals = [];
							
							for(var i=0; i < projectprogression.lastvoice; i++) {
								vocals.push(__dirname+'/'+resourcesfolder+'/audio/vocal'+i+'.mp3')
							}
							
							var progression = (projectprogression.lastvoice * wordsperrecord);
							var wait = 5;
							
							loopPart(projectprogression.lastvoice)
							
							function loopPart(index){
								if(index == projectprogression.lastvoice){
									wait = wait + 5
								}else{
									wait = 5
									projectprogression.lastvoice = index;
								}
								fs.writeFile('./'+resourcesfolder+'/preset/progression.json', JSON.stringify(projectprogression), function(errfile2) {
									if(errfile2) {
										return console.log(errfile2);
									}
									setTimeout(function(){
										if((progression + wordsperrecord) <= words.length || words.length - progression > 0){
											console.log('Vocal #'+index+' is going to be made.')
											if(speecherror == index){
												speecherroramt = speecherroramt + 1
												if(speecherroramt >= 3){
													resetProgram(true)
												}
											}else{
												speecherroramt = 0
												speecherror = index
											}
											if(words.length - progression < wordsperrecord){
												var word = words.slice(progression, progression + (words.length - progression)).join("")+"."
												if(word.length < 20){
													word = word+". Merci d'avoir regardé!"
												}
												txtomp3.saveMP3(langcode, word, __dirname + '/' +resourcesfolder+'/audio/vocal'+index+'.mp3', function(err1, absoluteFilePath){
													if(err1){
														console.log(words.slice(progression, (progression + wordsperrecord)).join(" ")+'.')
														console.log(err1)
														loopPart(index)
													}else{
														mp3Duration(__dirname + '/' +resourcesfolder+'/audio/vocal'+index+'.mp3', function (err2, duration) {
															if(err2 || duration < 1){
																console.log(words.slice(progression, (progression + wordsperrecord)).join(" ")+'.')
																console.log(err2)
																loopPart(index)
															}else{
																var chars = words.slice(progression, progression + (words.length - progression)).join(" ").split('');
																var currchars = 0
																var loopsdone = 0
																var recoveryindex = 0
																var sentence = "";
																if(chars.length/maxchars - Math.floor(chars.length/maxchars) > 0){
																	var roundedmultiple = Math.floor(chars.length/maxchars) + 1;
																}else{
																	var roundedmultiple = Math.floor(chars.length/maxchars);
																}
																var blocktop = 720 - 25 * roundedmultiple - 10;
																let randomimage = imgdownloaded[Math.floor(Math.random() * imgdownloaded.length)];
																var directory = './'+resourcesfolder+ '/' + randomimage.name;
																var directoryfinal = './'+resourcesfolder+'/speech' +index + '.jpg'
																var directorybgfinal = './'+resourcesfolder+'/speech' +index + 'bg.jpg'
																jimp.loadFont(jimp.FONT_SANS_32_BLACK).then(function (font2) {
																	jimp.read('./'+resourcesfolder+'/preset/background.png', function (jimperr1, prebackground) {
																		if (jimperr1) throw jimperr1;
																		prebackground.resize(1080, 25 * roundedmultiple + 10).quality(60).write(directorybgfinal)
																		jimp.read(directorybgfinal, function (importerror, background) {
																			if (importerror) throw importerror;
																			jimp.read(directory, function (jimperr, imagebuffer){
																				if (jimperr) throw jimperr;
																				vocals.push(__dirname +'/'+resourcesfolder+'/audio/vocal'+index+'.mp3')
																				imagebuffer.composite(background, 0, blocktop)
																				imagebuffer.quality(60)
																				
																				for (var i = 0; i < chars.length; i++) {
																					currchars = currchars + 1;
																					sentence += chars[i];
																					if(currchars >= maxchars){
																						imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, sentence)
																						currchars = 0;
																						loopsdone = loopsdone + 1;
																						sentence = "";
																						recoveryindex = i;
																					}
																				}
																				
																				if(chars.length >= (loopsdone * maxchars)){
																					imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, chars.slice(recoveryindex, chars.length - 1).join("")+".")
																				}
																				
																				imagebuffer.write(directoryfinal);
																				imgrendered.push({path: directoryfinal, loop: (duration + 5)})
																				projectprogression.imagerendered = imgrendered
																				fs.writeFile('./'+resourcesfolder+'/preset/progression.json', JSON.stringify(projectprogression), function(errfile) {
																					loopPart(index + 1)
																					progression = progression + wordsperrecord
																					console.log('Vocal #'+index+' successfully recorded!')
																				})
																			});
																		});
																	});
																});
															}
														})
													}
												})
											}else{
												txtomp3.saveMP3(langcode, words.slice(progression, (progression + wordsperrecord)).join(" ")+',', __dirname + '/'+resourcesfolder+'/audio/vocal'+index+'.mp3', function(err1, absoluteFilePath){
													if(err1){
														console.log(words.slice(progression, (progression + wordsperrecord)).join(" ")+'.')
														loopPart(index)
													}else{
														mp3Duration(__dirname + '/'+resourcesfolder+'/audio/vocal'+index+'.mp3', function (err2, duration) {
															if(err2 || duration < 1){
																console.log(words.slice(progression, (progression + wordsperrecord)).join(" ")+'.')
																console.log(err2)
																loopPart(index)
															}else{
																if(index > 0){
																	var chars = words.slice(progression, (progression + wordsperrecord)).join(" ").split('');
																	var currchars = 0
																	var loopsdone = 0
																	var recoveryindex = 0
																	var sentence = "";
																	if(chars.length/maxchars - Math.floor(chars.length/maxchars) > 0){
																		var roundedmultiple = Math.floor(chars.length/maxchars) + 1;
																	}else{
																		var roundedmultiple = Math.floor(chars.length/maxchars);
																	}
																	var blocktop = 720 - 25 * roundedmultiple - 10;
																	var randomimage = imgdownloaded[Math.floor(Math.random() * imgdownloaded.length)];
																	var directory = './'+resourcesfolder+'/' + randomimage.name;
																	var directoryfinal = './'+resourcesfolder+'/speech' +index + '.jpg'
																	var directorybgfinal = './'+resourcesfolder+'/speech' +index + 'bg.jpg'
																		jimp.loadFont(jimp.FONT_SANS_32_BLACK).then(function (font2) {
																			jimp.read('./'+resourcesfolder+'/preset/background.png', function (jimperr1, prebackground) {
																				prebackground.resize(1080, 25 * roundedmultiple + 10).quality(60).write(directorybgfinal)
																				jimp.read(directorybgfinal, function (importerror, background) {
																					if (importerror) throw importerror;
																					jimp.read(directory, function (jimperr, imagebuffer){
																						if (jimperr) throw jimperr;
																						vocals.push(__dirname + '/'+resourcesfolder+'/audio/vocal'+index+'.mp3')
																						imagebuffer.composite(background, 0, blocktop)
																						imagebuffer.quality(60)
																						
																						for (var i = 0; i < chars.length; i++) {
																							currchars = currchars + 1;
																							sentence += chars[i];
																							if(currchars >= maxchars){
																								sentence += "-"
																								imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, sentence)
																								currchars = 0;
																								loopsdone = loopsdone + 1;
																								sentence = "";
																								recoveryindex = i;
																							}
																							
																						}

																						if(chars.length >= (loopsdone * maxchars)){
																							imagebuffer.print(font2, 12, blocktop + 25 * loopsdone, chars.slice((recoveryindex + 1), chars.length).join("")+".")
																						}
																						
																						imagebuffer.resize(1080, 720).write(directoryfinal);
																						imgrendered.push({path: directoryfinal, loop: duration-0.1})
																						projectprogression.imagerendered = imgrendered
																						fs.writeFile('./'+resourcesfolder+'/preset/progression.json', JSON.stringify(projectprogression), function(errfile) {
																							loopPart(index + 1)
																							progression = progression + wordsperrecord
																							console.log('Vocal #'+index+' successfully recorded!')
																						})
																					});
																				});
																			});
																		});
																}else{
																	loopPart(index + 1)
																	progression = progression + wordsperrecord
																	console.log('Vocal #'+index+' successfully recorded!')
																}
															}
														})
													}
												})
											}
										}else{
											if(projectprogression.audiodone == false){
												audioconcat(vocals)
												  .concat(__dirname + '/'+resourcesfolder+'/audio/compilation.mp3')
												  .on('start', function (command) {
													console.log('The vocals made by synthesized voice are going to be compiled..')
												  })
												  .on('error', function (err, stdout, stderr) {
													console.error('Voice compilation Error:', err)
													console.error('ffmpeg stderr:', stderr)
												  })
												.on('end', function (output) {
													audioIsCompiled()
												})
											}else if(projectprogression.videodone == true){
												processUpload()
											}else{
												audioIsCompiled()
											}
											function processUpload(){
												let server = new Lien({
													host: "localhost",
													port: localport
												});
												console.log('Video successfully created! Publishing on youtube..')
												fs.readFile('./'+resourcesfolder+'/preset/tokens.json', 'utf8', function (err, tokenfile) {
													if(tokenfile.length > 5){
														oauth.setCredentials({
															refresh_token: JSON.parse(tokenfile).refresh
														});
														uploadVideo("\r\n ► "+ title +" \r\n \r\n "+ precontent +" \r\n ---------------------------------------------------------------------- \r\n ► Tout ce qui concerne les nouvelles, le scandale, l'idole, les faits, les drôles, les échecs, les accidents, les chansons, et bien d'autres. n'oubliez pas de vous abonner, aimer, et partager \r\n ---------------------------------------------------------------------- \r\n ► Si vous croyez que des images ou des photos sur cette chaîne enfreignent tout droit d'auteur que vous possédez ou contrôlez, vous pouvez envoyer une notification écrite à mon courrier et je vais immédiatement le supprimer. \r\n ---------------------------------------------------------------------- \r\n ► Déni de copyright - Titre 17, Code des États-Unis (articles 107-118 de la loi sur le droit d'auteur, Loi 1976): une allocation est prévue utiliser à des fins telles que la critique, les commentaires, les reportages, l'enseignement, l'érudition et la recherche. Tous les médias de cette vidéo sont utilisés à des fins d'examen et de commentaires dans le cadre d'un usage loyal. Toutes les images et images utilisées.")
													}else{
														opn(oauth.generateAuthUrl({
															access_type: 'offline',
															scope: ['https://www.googleapis.com/auth/youtube.upload','https://www.googleapis.com/auth/youtube.force-ssl','https://www.googleapis.com/auth/youtubepartner', 'https://www.googleapis.com/auth/youtube']
														}));
														server.addPage("/oauth2callback", lien => {
															console.log("Trying to get the token using the following code: " + lien.query.code);
															oauth.getToken(lien.query.code, (err, tokens) => {
																if (err) {
																	lien.lien(err, 400);
																	return console.log(err);
																}
																oauth.setCredentials(tokens);
																console.log('Access token: '+tokens.access_token);
																if (tokens.refresh_token) {
																	var tokensave = {refresh: tokens.refresh_token, access: tokens.access_token}
																	fs.writeFile('./'+resourcesfolder+'/preset/tokens.json', JSON.stringify(tokensave), function(errfile3) {
																		console.log('Refresh token '+tokens.refresh_token);
																	})
																}
																lien.end("<center><h4>The video is going to be uploaded on youtube with the selected account! <br/> Check out the logs in the terminal.</h4></center>");
																uploadVideo("\r\n ► " + title +" \r\n  \r\n "+precontent+"  ---------------------------------------------------------------------- \r\n ► Tout ce qui concerne les nouvelles, le scandale, l'idole, les faits, les drôles, les échecs, les accidents, les chansons, et bien d'autres. n'oubliez pas de vous abonner, aimer, et partager \r\n ---------------------------------------------------------------------- \r\n ► Si vous croyez que des images ou des photos sur cette chaîne enfreignent tout droit d'auteur que vous possédez ou contrôlez, vous pouvez envoyer une notification écrite à mon courrier et je vais immédiatement le supprimer. \r\n ---------------------------------------------------------------------- \r\n ► Déni de copyright - Titre 17, Code des États-Unis (articles 107-118 de la loi sur le droit d'auteur, Loi 1976): une allocation est prévue utiliser à des fins telles que la critique, les commentaires, les reportages, l'enseignement, l'érudition et la recherche. Tous les médias de cette vidéo sont utilisés à des fins d'examen et de commentaires dans le cadre d'un usage loyal. Toutes les images et images utilisées.")
															});
														});
													}
													tagsvid = tagsvid.concat(propertitle.split(" "))
													function uploadVideo(description){
														const youtube = Google.youtube({
															version: 'v3',
															auth: oauth
														});
														var req = youtube.videos.insert({
															notifySubscribers: true,
															resource: {
																snippet: {
																	title: title,
																	description: description + '\r\n Source: ' + projectprogression.magazinechosen,
																	categoryId: '22',
																	defaultLanguage: 'fr',
																	tags: tagsvid
																},
																status: {
																	privacyStatus: 'public',
																	publicStatsViewable: false,
																	embeddable: true
																}
															},
															part: "snippet,status",
															media: {
																body: fs.createReadStream("video.mp4")
															}
														}, (err, video) => {
															if(!err){
																console.log('Youtube video '+title+' uploaded at id '+video.id)
																var req2 = youtube.captions.insert({
																	resource: {
																		snippet: {
																			videoId: video.id,
																			language: 'fr',
																			name: 'Sous-Titres',
																			isDraft: false
																		}
																	},
																	sync: true,
																	part: "snippet",
																	media: {
																		body: fs.createReadStream("caption.txt")
																	}
																}, (errcc, data) => {
																	if(!errcc){
																		console.log('--- Youtube Caption Uploaded! ---')
																		var randomimage = imgdownloaded[Math.floor(Math.random() * imgdownloaded.length)];
																		var thumbimage = './'+resourcesfolder+'/' + randomimage.name;
																		var imagedirectory = './'+resourcesfolder+'/thumbnail.png';
																		jimp.read('./'+resourcesfolder+'/preset/thumbnail.png', function (importerror, overlay) {
																			jimp.read(thumbimage, function (importerror2, background) {
																				background.composite(overlay, 0, 0).resize(1280, 720).quality(60).write(imagedirectory);
																				setTimeout(function(){
																					var req3 = youtube.thumbnails.set({
																						videoId: video.id,
																						media: {
																							body: fs.createReadStream(imagedirectory)
																						}
																					}, (errthumbnail, data) => {
																						if(!errthumbnail){
																							console.log('---------------------------------')
																							console.log('--- Youtube Thumbnail Uploaded! ---')
																							resetProgram(false)
																							setTimeout(function(){
																								process.exit()
																							},5 * 60 * 1000)
																						}else{
																							console.log(errthumbnail)
																							process.exit()
																						}
																					});
																				},5000)
																			})
																		})
																	}else{
																		console.log(errcc)
																		console.log(tagsvid)
																		process.exit()
																	}
																});
															}else{
																console.log(err)
																console.log(tagsvid)
																uploadVideo(" \r\n ► "+ title +" \r\n  ---------------------------------------------------------------------- \r\n ► Tout ce qui concerne les nouvelles, le scandale, l'idole, les faits, les drôles, les échecs, les accidents, les chansons, et bien d'autres. n'oubliez pas de vous abonner, aimer, et partager")
															}
														});
														if(firstupload){
															firstupload = false
															setInterval(function () {
																if(currentbytes !== prettyBytes(req.req.connection._bytesDispatched)){
																	currentbytes = prettyBytes(req.req.connection._bytesDispatched);
																	console.log(prettyBytes(req.req.connection._bytesDispatched)+' uploaded.');
																}
															}, 200);
														}
													}
												})
											}
											function audioIsCompiled(){
												projectprogression.audiodone = true;
												fs.writeFile('./'+resourcesfolder+'/preset/progression.json', JSON.stringify(projectprogression), function(errfile3) {
													if(errfile3) {
														return console.log(errfile3);
													}
													mp3Duration(__dirname + '/' + resourcesfolder+'/audio/compilation.mp3', function (err, duration) {
														const videolength = Math.floor(duration + 8);
														if(duration < 45){
															console.log('This video is suspected to be glitched, resetting...')
															resetProgram(true)
														}else{
															console.log('The vocals made by synthesized voice were compiled and its duration is '+videolength+' seconds!')
														}
														var options = {
														  fps: 1,
														  loop: (videolength/imgrendered.length), // seconds
														  transition: false,
														  transitionDuration: 0, // seconds
														  videoBitrate: 1024,
														  videoCodec: 'libx264',
														  pixelFormat: 'yuv420p',
														  size: '640x?',
														  audioBitrate: '128k',
														  audioChannels: 2,
														  format: 'mp4'
														}

														setTimeout(function(){
															videoshow(imgrendered, options)
															  .audio(__dirname + '/' +resourcesfolder+'/audio/compilation.mp3')
															  .save('video.mp4')
															  .on('start', function (command) {
																console.log('The video is in preparation...')
															}).on('error', function (err) {
																	console.log(err)
																	resetProgram(true)
															}).on('end', function (output) {
																projectprogression.videodone = true;
																
																fs.writeFile('./'+resourcesfolder+'/preset/progression.json', JSON.stringify(projectprogression), function(errfile3) {
																	if(errfile3) {
																		return console.log(errfile3);
																	}
																})
																	
																processUpload()
															})
														}, 5000)
													})
												})
											};
										}
									}, wait * 1000);
								})
							}
						}
					})
				}
			}
function resetProgram(endup){
	projectprogression.imagedownloaded = [];
	projectprogression.imagerendered = [{path: './'+resourcesfolder+'/preset/subscribe_btn.png', loop:videointrotime}];
	projectprogression.videodone = false;
	projectprogression.audiodone = false;
	projectprogression.lastvoice = 0;
	projectprogression.magazinechosen = false;
	projectprogression.magazineloaded = false;
	fs.writeFile('./'+resourcesfolder+'/preset/progression.json', JSON.stringify(projectprogression), function(errfile3) {
		if(errfile3) {
			return console.log(errfile3);
		}else{
			if(endup){
				process.exit();
			}	
		}
	})
	fs.unlink('video.mp4', function(err) {});
	fs.readdir('./'+resourcesfolder, function( err, files ) {
		files.forEach( function( file, index ) {
			if(file.indexOf(".jpg") > -1 || file.indexOf(".bmp") > -1 || file.indexOf(".png") > -1){
				fs.unlink('./'+resourcesfolder+'/'+file, (err) => {});
			}
		})
	})
	fs.readdir( './'+resourcesfolder+'/audio', function( err, files ) {
		files.forEach( function( file, index ) {
			if(file.indexOf(".mp3") > -1){
				fs.unlink('./'+resourcesfolder+'/audio/'+file, (err) => {});
			}
		})
	})
}

process.argv.forEach((val, argindex) => {
	if(argindex == 2){
		precachearticle = val;
		fs.readFile('./'+resourcesfolder+'/preset/progression.json', 'utf8', function (err, data) {
			if(data.length < 5){
				if(precachearticle){
					resetProgram(false)
					console.log('Going to create a video with article: '+precachearticle)
					setTimeout(function(){
						projectprogression.magazinechosen = precachearticle;
						readPage(precachearticle)
					},5000)
				}else{
					resetProgram(false)
				}
			}else if(JSON.parse(data).magazinechosen == false){
				if(precachearticle){
					resetProgram(false)
					console.log('Going to create a video with article: '+precachearticle)
					projectprogression.magazinechosen = precachearticle;
					readPage(precachearticle)
				}else{
					resetProgram(false)
				}
			}else{
				projectprogression = JSON.parse(data);
				browseMagazine()
			}
		})
	}
});

fs.readFile('./'+resourcesfolder+'/preset/progression.json', 'utf8', function (err, data) {
	if(process.argv.length < 3){
		if(data.length < 5){
			resetProgram(false)
		}else{
			projectprogression = JSON.parse(data);
		}
		browseMagazine()
	}
})