#!/usr/local/bin/node

"use strict"

var ffmpeg= require('fluent-ffmpeg');    /// For Video conversion

var config= require('./config.json')   /// Configuration file
var db_obs= require('./db_obs.js');    /// DB functions

/// convert -delay 5 -type Grayscale `ls ./mnt/png/*.png | tail -n 60` ./mnt/output.mp4
/// ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -y ./mnt/output.webm

/// no audio
/// ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -acodec libvorbis -ac 2 -y ./mnt/output.webm

(function(params){

//    ffmpeg().addInput('/mnt/png/2016-12-15T0*.png /mnt/png/2016-12-15T1*.png').inputOptions("-pattern_type glob").noAudio().output("output.mp4").fps(4).run()
    
    exports.webm = function(params,cb){
	
	db_obs.last_n(15,function(result,cb){

	    var pngarr = result.map((r) => (r.pngname));

	    var f=0
	    f=ffmpeg()
	    pngarr.forEach(p => f.input(p))
	    console.log(pngarr)
	    f.fps(5).mergeToFile("./output.avi","./").output("./output.mp4").run()	    

	})	    

    }

    
}).call()

var pngarr=[
    "./mnt/png/2016-12-15T03:01:04.png",
    "./mnt/png/2016-12-15T03:01:24.png",
    "./mnt/png/2016-12-15T03:01:44.png",
    "./mnt/png/2016-12-15T03:02:04.png",
    "./mnt/png/2016-12-15T03:02:24.png",
    "./mnt/png/2016-12-15T03:02:44.png",
    "./mnt/png/2016-12-15T03:03:03.png",
    "./mnt/png/2016-12-15T03:03:23.png",
    "./mnt/png/2016-12-15T03:03:43.png",
    "./mnt/png/2016-12-15T03:04:03.png",
    "./mnt/png/2016-12-15T03:04:23.png",
    "./mnt/png/2016-12-15T03:04:43.png",
    "./mnt/png/2016-12-15T03:05:03.png",
    "./mnt/png/2016-12-15T03:05:23.png",
    "./mnt/png/2016-12-15T03:05:42.png"
]





// http://diveinto.html5doctor.com/video.html

// ## Theora/Vorbis/Ogg
// ffmpeg2theora --videobitrate 200 --max_size 320x240 --output pr6.ogv pr6.dv

// ## H.264/AAC/MP4
// HandBrakeCLI --preset "iPhone & iPod Touch" --vb 200 --width 320 --two-pass --turbo --optimize --input pr6.dv --output pr6.mp4

// ## VP8/Vorbis/WebM
// ffmpeg -pass 1 -passlogfile pr6.dv -threads 16  -keyint_min 0 -g 250 -skip_threshold 0 -qmin 1 -qmax 51 -i pr6.dv -vcodec libvpx -b 204800 -s 320x240 -aspect 4:3 -an -f webm -y NUL

// ffmpeg -pass 2 -passlogfile pr6.dv -threads 16  -keyint_min 0 -g 250 -skip_threshold 0 -qmin 1 -qmax 51 -i pr6.dv -vcodec libvpx -b 204800 -s 320x240 -aspect 4:3 -acodec libvorbis -ac 2 -y pr6.webm


// <video preload controls>
//   <source src="pr6.webm" type='video/webm; codecs="vp8, vorbis"' />
//   <source src="pr6.ogv" type='video/ogg; codecs="theora, vorbis"' />
//   <source src="pr6.mp4" />
// </video>
// <script>
//   var v = document.getElementsByTagName("video");
//       v.onclick = function() {
// 	    if (v.paused) {
// 		v.play();
// 	    } else {
// 		v.pause();
// 	    }
// 	};
// </script>
