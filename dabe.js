const jimp = require('jimp');
let filenew = '1002020.jpg';
var imgdir = './1_davidbrown04.jpg';
console.log('talkit!'+imgdir)
	var directory = './'+filenew;
	setTimeout(function(){
		jimp.loadFont(jimp.FONT_SANS_64_BLACK).then(function (font) {
			jimp.read(imgdir, function (err, imagebuffer) {
				if (err) throw err;
				imagebuffer.resize(1080, 720).blur(1).flip(true, false).print(font, 2, 2, 'Lol').write(directory);
			});
		});
	},2000);