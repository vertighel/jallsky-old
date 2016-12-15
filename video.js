#!/usr/local/bin/babel-node

"use strict"

var db_obs= require('fluent-ffmpeg');    /// For Video conversion

var config= require('./config.json')   /// Configuration file
var db_obs= require('./db_obs.js');    /// DB functions

/// convert -delay 5 -type Grayscale `ls ./mnt/png/*.png | tail -n 60` ./mnt/output.mp4
/// ffmpeg -i ./mnt/output.mp4 -vcodec libvpx  -s 640x480 -aspect 4:3 -acodec libvorbis -ac 2 -y ./mnt/output.webm

(function(params){

    ffmpeg().addInput('/mnt/png/2016-12-15T0*.png /mnt/png/2016-12-15T1*.png').inputOptions("-pattern_type glob").noAudio().output("output.mp4").fps(4).run()
    
    exports.webm = function(params,cb){
	
	db_obs.last_n(5,function(result,cb){
		var a = result.map((r) => (r.pngname));

	    
	    })	    

    }

    
}).call()




// http://diveinto.html5doctor.com/video.html

// ## Theora/Vorbis/Ogg
// you@localhost$ ffmpeg2theora --videobitrate 200 --max_size 320x240 --output pr6.ogv pr6.dv

// ## H.264/AAC/MP4
// you@localhost$ HandBrakeCLI --preset "iPhone & iPod Touch" --vb 200 --width 320 --two-pass --turbo --optimize --input pr6.dv --output pr6.mp4
// ## VP8/Vorbis/WebM
// you@localhost$ ffmpeg -pass 1 -passlogfile pr6.dv -threads 16  -keyint_min 0 -g 250 -skip_threshold 0 -qmin 1 -qmax 51 -i pr6.dv -vcodec libvpx -b 204800 -s 320x240 -aspect 4:3 -an -f webm -y NUL

// you@localhost$ ffmpeg -pass 2 -passlogfile pr6.dv -threads 16  -keyint_min 0 -g 250 -skip_threshold 0 -qmin 1 -qmax 51 -i pr6.dv -vcodec libvpx -b 204800 -s 320x240 -aspect 4:3 -acodec libvorbis -ac 2 -y pr6.webm


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
