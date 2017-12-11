#!/usr/bin/node

"use strict";

(function(){
    
    
    var fs=require("fs"); /// file stream
    
    var julian = require("julian");
    var mysql = require("mysql");
    var fits = require('../node-fits/build/Release/fits');
    
    var WebSocket = require('ws');
    var allsky_mod=require("./allsky_drv");
    
    //    var ws = new WebSocket('ws://localhost:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    //var ws = new WebSocket('ws://192.168.0.6:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    var ws = new WebSocket('ws://79.51.122.224:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    
    var fits_dir="./mnt/fits/";
    var png_dir="./mnt/png/";
    
    /// CREATE TABLE allskycam (id int auto_increment primary key, 
    /// fitsname varchar(256), dateobs varchar(23), pngname varchar(256), jd double, exptime float);
    var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'password',
	database : 'test'
    });
    
    var cam = new allsky_mod.allsky();

    cam.on('open', function(){
	this.heater_on().catch(function(e){
	    console.log("Heater on error : " + e);
	});
    });

    cam.on('close', function(){
	this.heater_off().catch(function(e){
	    console.log("Heater off error : " + e);
	});
    });

    cam.on('error', function(){
	this.heater_on().catch(function(e){
	    console.log("Allsky camera error event : " + e);
	});
    });

    cam.on('disconnect', function(){
	console.log("Allsky camera : serial link disconnected.");
    });
    

    function create_png(params){
	return new Promise(function(ok, fail){
	    console.log("create_png: called");
	    
	    var f = new fits.file(params.fitsname); //The file is automatically opened (for reading) if the file name is specified on constructor.
	    
	    f.get_headers(function(error, headers){
		
		if(error){
		    fail("Bad things happened : " + error);
		}else{
		
		    f.read_image_hdu(function(error, image){
			
			if(error)
			    fail("Bad things happened while reading image hdu : " + error);
			else{
			    
			    if(image){
				
				//for (var ip in image) console.log("IP : " + ip);
				
				console.log("Image size : " + image.width() + " X " + image.height()); 
				
				var colormap=[
				    //R  //G  //B  //A  //level: 0=min,1=max
				    [0.0, 0.0, 0.0, 1.0, 0.0],
				    //		    [0.4, 0.4, 0.4, 1.0, 0.8],
				    //		    [0.8, 0.8, 0.8, 1.0, 0.9],
				    [1.0, 1.0, 1.0, 1.0, 1.0]
				];
				
				
				image.histogram({}, function(error, histo){ 
				    if(error)
					fail("Histo error : " + error);
				    else{
					//			console.log("HISTO : " + JSON.stringify(histo));
					params.histo=histo;
					
					var cuts=[11000,40000];  //25s
					
					image.set_colormap(colormap);
					image.set_cuts(cuts);
					
					var out = fs.createWriteStream(params.pngname);
					out.write(image.tile( { tile_coord :  [0,0], zoom :  0, tile_size : [image.width(),image.height()], type : "png" }));
					out.end();
					
					ok("create_png: written");
					
				    }
				});
			    }else fail("No image returned and no error ?");
			}
		    });
		}
	    }); ///get_headers
	});//Promise
    }
    
    
    async function launch_exposure(params){
	
	await cam.open();
	await cam.define_subframe(params);
	await cam.open_shutter();

	var image_data = await cam.get_image(params , function(message){ //progress callback
	    ws.send(JSON.stringify(message),function(err,res){
	    	if(err !=null) console.log("Websocket error sending message: "+err);
	    });
	});
	
	
	console.log("Got image!");
	    
	var now      = new Date(); /// Time stamp to be used for file names, DATE-OBS and JD
	var dateobs  = now.toISOString().slice(0,-1);  /// string
	var jd       = parseFloat(julian(now));        /// double
	var fitsname = fits_dir+dateobs+".fits";
	var pngname  = png_dir +dateobs+".png";
	
	var fifi     = new fits.file(fitsname); 
	var M        = new fits.mat_ushort;
	
	M.set_data(params.width,params.height, image_data);
	
	fifi.write_image_hdu(M);
	
	fifi.set_header_key([
	    { key : "DATE-OBS",
	      value : dateobs,
	      comment : "Observation date from laptop, synchronized with NTP"},
	    { key : "JD",
	      value : jd,
	      comment : "Julian Date from laptop, synchronized with NTP"},
	    { key : "EXPTIME",
	      value : params.exptime+0,
	      comment : "Exposure time in seconds"},
	], function(err){
    	    if(err!== null)
		console.log("Error setting fits header:");
	});
	
	var post  = {fitsname:fitsname, pngname:pngname, jd:jd, dateobs:dateobs, exptime:params.exptime };
	params.fitsname=fitsname;
	params.pngname=pngname;
	params.jd=jd;
	params.dateobs=dateobs;
	
	var query = connection.query('INSERT INTO allskycam SET ?', post, function(err, result) {
    	    if(err!== null){
		console.log("Error retreiving image: "+err);
		console.log("Closing the db connection!");
    		connection.end(); /// closing mysql connection	    
	    }
	    console.log("Executed the following mysql query: "+query.sql);
	    //    		    connection.end() /// closing mysql connection	    
	});	
	
	await create_png(params);

	params.whoami="create_png";

	ws.send(JSON.stringify(params),function(err,res){
	    if(err !=null) console.log("Websocket error sending message: "+err);
	    console.log("sending post to server.js");
	});		    

	await cam.close_shutter();
	
    } /// launch_exposure

    
    module.exports = {
	cam                  : cam            ,
	launch_exposure      : launch_exposure 
    };


    //FOR TESTING -->
    
    console.log("Module Ready!");

    launch_exposure().then(function(){
	console.log("Exposure done! ");
    }).catch(function(e){
	console.log("Exposure : " + e);
    });
    
}).call(this);
