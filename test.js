function firstPromise() {
	return new Promise((success, error) => {
		setTimeout(function () {
			success('congrats!');
		}, 4 * 1000);
	});
};

function secondPromise(someArgument) {
	return new Promise((success, error) => {
		setTimeout(function () {
			success(someArgument);
		}, 100);
	});
};

var guid = 0;
function run() {
  guid++;
  var id = guid;
  return new Promise(resolve => {
    // resolve in a random amount of time
    setTimeout(function () {
      console.log(id);
      resolve(id);
    }, (Math.random() * 1.5 | 0) * 1000);
  });
}

runWaterfall([firstPromise(), secondPromise('dude!')]).then((result) => {
	console.log('Waterfall done!');
	console.log(result);
});

function runWaterfall(functions) {
	return new Promise((success, error) => {
		let index = 0;
		const promise = functions.reduce(function (acc) {
			return acc.then(function (res) {
				return functions[index].then(function (result) {
					res.push(result);
					index = index + 1;
					return res;
				});
			});
		}, Promise.resolve([]));

		promise.then(success);
	});
};




// const multiPromises = functions.reduce(function (acc) {

// 	var index = 0;

// 	return acc.then(function (res) {
// 		index = index + 1;
// 		console.log(index)
// 		return functions[index].then(function (result) {
// 			res.push(result);
// 			return res;
// 		});
// 	});
// }, Promise.resolve([]));

// multiPromises.then(console.log);


function runWaterfall1(functions) {
	return new Promise((success, error) => {

		let res = [];

		functions.forEach(element => {
			console.log(element)
			element.then((result) => {
				console.log(result)
				res.push(result);
			}).catch((err) => {
				res.push(err);
			});
		}, console.log(res));
	});
};


// const Config = {
//     Directory: __dirname,
//     LocalPort: 5000,
//     oAuth: {
//         Public: '370774627054-dl9pkp0f4ktnp4k46drueucvv7lenj0o.apps.googleusercontent.com',
//         Private: 'xbC5kRQV00HT28iStA0rH28V'
//     },
//     Video: {
//         CompliationLoop: false
//     },
//     Folder: 'actus',
//     Name: 'FRANCE INFOS 24/7',
//     Tags: ['#news'],
//     Intro: {
//         Time: 5,
//         Text: 'Afin d\'être informé veuillez vous abonner et cliquez sur la cloche pour être notifié!'
//     },
//     LCode: 'Fr-fr',
//     Magazines: ['voici', 'gala', 'vminutes-people', 'vminutes-divers', 'vminutes-sports', 'figaro', 'valeursactuelles']
// };

// const MagazineBrowser = require('./classes/MagazineBrowser.js');
// const MB = new MagazineBrowser(Config, Config.Directory, Config.Folder);

// MB.getMagazine().then(Magazine => {
//     console.log(Magazine.title)
//     console.log(Magazine.content)
// });


// function testThumbnailGeneration(){
//     const ImageMaker = require('./classes/ImageMaker.js');
//     const IM = new ImageMaker(Config);

//     IM.generateThumbnail('314063.jpg').then((thumbnail_dir, errimg) => {
//         console.log(thumbnail_dir)
//     });
// };
//testThumbnailGeneration()

// const fs = require('fs');

// let words = [];

// let remaining = fs.readFileSync('words.json').toString();

// let index = remaining.indexOf('\n');
// while (index > -1) {  
//   const line = remaining.substr(0, index);
//   console.log(line);
//   words.push(line);
//   remaining = remaining.substr(index + 1);
//   index = remaining.indexOf('\n');
// }

// fs.writeFileSync('words.json', JSON.stringify(words));

// setTimeout(function(){

// },999999)