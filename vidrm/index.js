const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

const proc = new ffmpeg();
proc.addInput(path.join(__dirname, 'input.mp4'))
.on('start', function() {
    console.log('Starting...');
})
.on('end', function(output) {
    console.log('Done!')
    setTimeout(function(){
        console.log('ok')
    },8000

    )
})
.on('error', function(error) {
    console.error('Error:', error)
    throw error;
})
.outputOptions(['-vf hflip', '-c:a copy'])
.output(path.join(__dirname, 'final.mp4'))
.run();