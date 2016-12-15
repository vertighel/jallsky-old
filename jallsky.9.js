#!/usr/bin/node

"use strict";

(function(){

    var serialport = require('serialport'); /// include the library
    var fs=require("fs") /// file stream
    
    var julian = require("julian");
    var mysql = require("mysql");
    var fits = require('../node-fits/build/Release/fits');
    
    var WebSocket = require('ws')
    
    var ws = new WebSocket('ws://localhost:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    //var ws = new WebSocket('ws://192.168.0.6:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    // var ws = new WebSocket('ws://79.51.122.224:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
    
    var fits_dir="./mnt/fits/"
    var png_dir="./mnt/png/"
    
    /// CREATE TABLE allskycam (id int auto_increment primary key, 
    /// fitsname varchar(256), dateobs varchar(23), pngname varchar(256), jd double, exptime float);
    var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'password',
	database : 'test'
    });
    
    var sp = new serialport('/dev/ttyUSB0',
			    {baudRate: 115200}, // 115200, 230400, 460800,
			    function(err){			    
				if(err!== null)
				    return console.log('serialport instance error: ', err.message);
			    });
    
    sp.on('open',  showPortOpen);
    sp.on('close', showPortClose);
    sp.on('disconnect', showPortDisconnect);
    sp.on('error', showError);
    sp.on('data',  sendSerialData);
    
    sp.open(function(err){
	showPortOpen(err)
    }); /// sp.open
    
    // sp.close(function(err) {
    // 	showPortClose(err)
    // }); /// sp.close

    var data_listener_func=null;
    
    function sendSerialData(data){
	if(data_listener_func!==null)
	    data_listener_func(data);
    }
    
    function showPortOpen(err) {
	if(err!== null) return console.log('showPortOpen error: ', err);
	console.log('showPortOpen: port open. Data rate: ' + sp.options.baudRate)

	heater_on(err)

    }
    
    function showPortClose(err) {
	if(err!== null) return console.log('showPortClose error: ', err);
	console.log('showPortClose: Port closed.');

	heater_off(err)
	
    }

    function showPortDisconnect(err) {
	if(err!== null) return console.log('showPortDisconnect error: ', err);	
	console.log('showPortDisconnect: Port disconnected.');
    }

    function showError(err) {
	if(err!== null) return console.log('showError error: ', err);	
	console.log('showError: serial port error: ' + err);
    }
    
    ////////////////////////////////////////////////////////////
    /// The checksum is simply calculated by complementing the byte,
    /// clearing the most significant bit and XOR with the current
    /// checksum, going through each byte in the command. For each
    /// individual command the checksum starts as 0

    function checksum_buf(com){
	var cs=0;
	var cl=com.length;
	for(var b=0; b<cl-1; b++){
	    var by=com.readUInt8(b);
	    var csb = ~by & 0x7F;
	    cs = cs ^ csb;
	}
	com.writeUInt8(cs,cl-1);
	console.log("ckecksum ok!!!!")
    }

    function checksum(com){
	var cs = 0
	for(var b=0; b<com.split('').length; b++){
	    var csb = ~com[b].charCodeAt(0) & 0x7F;
            cs = cs ^ csb	
	}
	return String.fromCharCode(cs)
    }

    /// Send Command
    function send_command (command, cb, nb) {
	var cs = checksum(command)

	var cmd=command+cs;
	console.log("Sending command ["+command+"]; checksum ["+cs.charCodeAt(0)+"]; length="+cmd.length+" number of bytes="+nb);

	function on_data(buf){
	    var received_cs=buf.readUInt8(0);
	    var received_data=buf.slice(1); /// cut the first element
	    
	    if(received_cs!==cs.charCodeAt(0)){  /// checksum matching
		console.log("Checksum not matching ! sent = " + cs.charCodeAt(0) + " received=" + received_cs );
	    }else{
		console.log("Checksum match OK!");
	    }
	    
	    cb(null, received_data);

	} /// on_data
	
	if(nb===undefined)
	    data_listener_func=on_data;
	else{
	    if(nb!==null){
		if(typeof nb === "function")
		    data_listener_func=nb;
		else
		    get_bytes(nb, on_data);
	    }
	}
	
	sp.write(cmd, function (err) {
	    if (err) {
		console.log("Error while sending ["+command+"] : " + err);
		cb(err);
	    }
	});
	
    }

    function send_test(cb){
	send_command('E', function(err,data){
	    if(err!==null) return console.log("Error sending test command: " + err);
	    console.log("Sent test. Received response. Is it 'O'? : " + data);
	    if(data=='O'){
		console.log("Response is ok!" )
	    }else{
		return console.log("Response is not ok: " + err)
	    }
	    cb()
	}, 2);    
    }

    function get_firmware_version(cb){
	send_command('V', function(err,data){
	    if(err!==null) return console.log("Error getting firmware version: " + err);
	    var version = data.readInt16LE(0);
	    console.log("Firmware version : [" + version + "] NB=" + data.length );
	    cb()
	}, 3);
    }

    function get_serial_number(cb){
	send_command('r', function(err,data){
	    if(err!==null) return console.log("Error getting serial number: " + err);
	    var serial=data.toString('ascii');
	    console.log("Serial Number : [" + serial + "] NB=" + data.length );
	    cb()
	}, 11);
    }

    function heater_on(cb){
	send_command('g\x01', function(err){
    	    if(err!==null){
		console.log("Error switching on the heater: " + err);
		cb(err)
	    }	
    	    console.log("Heater on!");	
	}, undefined);

    }

    function heater_off(cb){
	send_command('g\x00', function(err){
    	    if(err!==null){
		console.log("Error switching off the heater: " + err);
		cb(err)
	    }	
	    console.log("Heater off!");
	}, undefined);
    }

    function chop_on(cb){
	send_command('U\x01', function(err){
	    if(err!==null){
		console.log("Error switching on chopping mode: " + err);
		cb(err)
	    }
	    console.log("Chop on!");
	}, undefined);
    }

    function chop_off(cb){
	send_command('U\x00', function(err,data){
	    if(err!==null){
		console.log("Error switching off chopping mode: " + err);
		cb(err)
	    }
	    console.log("Chop off!");
	}, undefined);
    }

    function open_shutter(cb){ /// leaves the shutter motor energized
	send_command('O', function(err,data){
	    if(err!==null) return  console.log("Error opening shutter: " + err);
	    console.log("Shutter open !");
	    setTimeout(function(){
		send_command('K', cb, undefined);  /// DE_ENERGIZE
	    },100) //1 second = 1000ms....	
	}, undefined);
    }

    function close_shutter(cb){ /// leaves the shutter motor energized
	send_command('C',function(err,data){
	    if(err!==null) return  console.log("Error closing shutter: " + err);
 	    console.log("Shutter closed !!");
	    setTimeout(function(){
		send_command('K', cb, undefined) /// DE_ENERGIZE
	    },100) //1 second = 1000ms....	
	}, undefined);
    }

    function abort(cb){
	send_command('A', function(err){
	    if(err!==null){
		console.log("Error Aborting image: " + err);
		cb(err)
	    }
	    console.log("Aborted!");
	}, undefined);
    }

    function get_bytes(nb, cb, skip){
	var nr=0,nt=0;
	var buf=new Buffer(nb);
	buf.fill(0);

	data_listener_func=function(data){
	    if(nt===0 && skip!==undefined){
		console.log("Skipping checksum byte...");
		if(data.length>1){
		    console.log("Skipping checksum byte... and we got more data " + data.length);
		    data.copy(buf,nr,1);
		    nr+=(data.length-1);
		}
	    }
	    else{
		data.copy(buf,nr);
		nr+=data.length;
	    }
	    nt+=data.length;
	    if(nr===nb){
		cb(buf);
		nr=0;
	    }
	    
	} /// data listener_func
    } /// get_bytes

    
    /// This command defines the location and size of the sub-frame. The
    /// maximum size of the sub- frame is 127 pixels. 
    function define_subframe(params,cb){
	
	var x=Buffer.alloc(4);
	x.writeInt32LE(params[0]);    
	var y=x
	y.writeInt32LE(params[1]);
	var s=x
	s.writeInt32LE(params[2]);
	
	var combuf =Buffer.alloc(7)    
	combuf[0]='S'.charCodeAt(0)
	combuf[1]=x[1]
	combuf[2]=x[0]
	combuf[3]=y[1]
	combuf[4]=y[0]
	combuf[5]=s[0]    
	
	checksum_buf(combuf);
	
	var com=combuf;
	var cmd_checksum=combuf.readUInt8(6);
	
	
	sp.write(combuf, function (err) {
	    if (err) {
		console.log("Error while sending ["+command+"] : " + err);
		cb(err);
	    }
	    console.log("Subframe defined. Parameters: "+params);
	});
	
	cb(null)
    }
    
    /// Fetch an image from the camera
    /// exposure -- exposure time in seconds
    /// progress_callback -- Function to be called after each block downloaded
    function get_image(params, progress_callback, get_cb){
	
	/// Camera expsosure time works in 100µs units
	/// MAX_EXPOSURE = 0x63FFFF;
	var exptime = params.exptime / 100e-6;

	var blocks_expected = (params.width * params.height) / params.blocks;
	var block_nbytes=2*params.blocks;
	
	if(exptime > 653.3599) exptime = 653.3599;

	var exp=Buffer.alloc(4);
	exp.writeInt32LE(exptime);

	var combuf =Buffer.alloc(7)
	
	combuf[0]='T'.charCodeAt(0)
	combuf[1]=exp[2]
	combuf[2]=exp[1]
	combuf[3]=exp[0]
	combuf[4]=params.frcode
	combuf[5]=params.imcode

	checksum_buf(combuf);

	var com=combuf;
	var cmd_checksum=combuf.readUInt8(6);
	
	console.log("Take image checksum is " + cmd_checksum);
	console.log("Length of com=" + com.length + " should be 7?");

	var timestamp = new Date();
	timestamp = timestamp.toISOString();
	
	console.log('Beginning Exposure')
	var start_time = new Date().getTime(); /// in ms

	var first_data_received=true;
	
	var image_data_func=function(in_data){

	    if(first_data_received===true){
		var firstchar=in_data.readUInt8(0);
		first_data_received = false;

		if(cmd_checksum !== firstchar){
		    console.log("Checksum error !!");
		}else
		    console.log("Checksum match !");
	    }
	    else{
		console.log("GetImage received progress data ["+in_data.toString('ascii')+"]");

		var mid_time = new Date().getTime(); //in ms
		var time_elapsed = ((mid_time-start_time)/1000).toFixed(3) /// in s
		
		var message={whoami:"image_data_func",
	    		     exposure_time : params.exptime, 
	    		     time_elapsed   : time_elapsed,
	    		     percent        : ((time_elapsed/params.exptime)*100).toFixed(0),
	    		    }
		
		ws.send(JSON.stringify(message),function(err,res){
	    	    if(err !=null) console.log("Websocket error sending message: "+err)
		})
		
	    }
	    
	    if(in_data == 'D'){
		
		var blocks_complete = 0;
		var total_nbytes=blocks_expected*block_nbytes;
		//var data=new ArrayBuffer();
		var received_bytes=0;
		var received_cs_bytes=0;
		var block_bytes=0;

		var image_data=new Buffer(total_nbytes);
		
		console.log('Exposure Complete ! Transfering Image : ' + blocks_expected + " blocks to read");

		get_bytes(block_nbytes+1, function(in_data){

		    var nb=in_data.byteLength;

		    var cs = 0
		    for(var c=0; c<block_nbytes; c++)
			cs = cs ^ in_data.readUInt8(c);
		    
		    in_data.copy(image_data,received_bytes,0,block_nbytes);

		    var csum_in=in_data.readUInt8(block_nbytes);
		    
		    received_bytes+=block_nbytes;

		    var message={whoami:"get_bytes",
				 received_bytes : received_bytes,
				 total_nbytes   : total_nbytes,
				 percent        : (received_bytes/total_nbytes*100).toFixed(0),
				}
		    
		    ws.send(JSON.stringify(message),function(err,res){
			if(err !=null) console.log("Websocket error sending message: "+err)
		    })		    
		    
		    if(received_bytes===total_nbytes){
			sp.write('K'); /// Checksum OK
			console.log("Received all data !")
			get_cb(null, image_data);
		    }
		    else
			sp.write('K');  /// Checksum OK
		}, 1);
		
		send_command('X', function(err, res){ /// transfer image
		    if(err!==null) return cb(err);		
		}, null);
		
	    }
	}

	data_listener_func=image_data_func;

	sp.write(com,function(err){
	    if(err!==null) return get_cb(err);
	    console.log("Command TAKEIMAGE sent ok!");
	});
	
    }

    function create_png(params,cb){
	console.log("create_png: called")
	
	var f = new fits.file(params.fitsname); //The file is automatically opened (for reading) if the file name is specified on constructor.

	f.get_headers(function(error, headers){
	    
	    if(error) return console.log("Bad things happened : " + error);
	    
	    f.read_image_hdu(function(error, image){
		
		if(error) return console.log("Bad things happened while reading image hdu : " + error);
		
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
			    console.log("Histo error : " + error);
			else{
			    //			console.log("HISTO : " + JSON.stringify(histo));
			    params.histo=histo
			}
		    });
		    
		    //		var cuts=[100,45000];
		    //		var cuts=[2000,6000];   //10s
		    //		var cuts=[3800,10000];  //25s

		    var cuts=[11000,40000];  //25s
		    
		    
		    
		    // console.log("***************************************************")
		    // console.log(params.width)
		    // console.log(image.width)
		    // console.log("***************************************************")
		    
		    image.set_colormap(colormap);
		    image.set_cuts(cuts);

		    var out = fs.createWriteStream(params.pngname);
		    out.write(image.tile( { tile_coord :  [0,0], zoom :  0, tile_size : [image.width(),image.height()], type : "png" }));
		    out.end();

		    console.log("create_png: written")

		}
		
	    });

	    cb();
	    
	});
	console.log("create_png: ended")
	
    }


    function launch_exposure(params,cb){

	/*
	  {
	  "observer": "",
	  "imagetyp": "light",
	  "exptime": "0.001",
	  "nexp": "1",
	  "frametyp": "full",
	  "whoami": "client"
	  }
	*/


	var imcode;  /// 2=L-D, 1=L, 0=D
	var frcode;  /// 2=binned, 1=cropped,0=full, 0xff=subframe

	var width,height,blocks

	switch(params.imagetyp) {
	case 'light-dark':        
    	    imcode=2
    	    frcode=2
	    width=320
	    height=240
	    blocks=1024
            break;
	case 'light':
    	    imcode=1
            break;
	case 'dark':
    	    imcode=0
            break;
	default:
    	    imcode=1	
	}
	
	if(params.imagetyp != 'light-dark'){
	    switch(params.frametyp) {
	    case 'full':     
    		frcode=0
		width=640
		height=480
		blocks=4096
		break;
	    case 'cropped':
    		frcode=1
		width=512
		height=480
		blocks=4096
		break;
	    case 'custom':
    		frcode=0xff
		width=params.size
		height=params.size
		blocks=params.size
		break;
	    default:
    		frcode=0
		width=640
		height=480
		blocks=4096
	    }
	}
	
	params.width=width;
	params.height=height;
	params.blocks=blocks;
	params.imcode=imcode;
	params.frcode=frcode;
	
	define_subframe([params.start_x,params.start_y,params.size],function(err){
	    if(err!==null) return console.log("define_subframe error: "+err);
	    
	    open_shutter(function (err, res){
		if(err!==null) return console.log("close_shutter error: "+err);
		
		get_image(params , function(){}, function(err, image_data){
		    if(err!== null) return console.log('a_get_image error: ', err);
		    
		    console.log("get_image: routine called. Got image!")		
		    
		    var now      = new Date(); /// Time stamp to be used for file names, DATE-OBS and JD
		    var dateobs  = now.toISOString().slice(0,-1)  /// string
		    var jd       = parseFloat(julian(now))        /// double
		    var fitsname = fits_dir+dateobs+".fits"
		    var pngname  = png_dir +dateobs+".png"
		    
		    var fifi     = new fits.file(fitsname); 
		    var M        = new fits.mat_ushort;
		    
		    M.set_data(width,height, image_data);
		    fifi.file_name;		
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
			    console.log("Error setting fits header:")		    
		    });
		    
		    
		    var post  = {fitsname:fitsname, pngname:pngname, jd:jd, dateobs:dateobs, exptime:params.exptime };
		    params.fitsname=fitsname
		    params.pngname=pngname
		    params.jd=jd
		    params.dateobs=dateobs
		    
		    var query = connection.query('INSERT INTO allskycam SET ?', post, function(err, result) {
    			if(err!== null){
			    console.log("Error retreiving image: "+err)
			    console.log("Closing the db connection!")
    			    connection.end() /// closing mysql connection	    
			}
			console.log("Executed the following mysql query: "+query.sql);
			//    		    connection.end() /// closing mysql connection	    
			
		    });	
		    
		    create_png(params, function(){
			console.log("callback of create_png: called")
			
			setTimeout(function(){
			    params.whoami="create_png"
			    //			    console.log(post)
			    ws.send(JSON.stringify(params),function(err,res){
				if(err !=null) console.log("Websocket error sending message: "+err)
				console.log("sending post to server.js")
				// console.log(params)			    
			    })		    
			    //			ws.close();			    
			    
			    cb(params)
			},3000) //1 second = 1000ms....
			
		    })		
		    
		    close_shutter(function (err, res){
			if(err!==null) return console.log("close_shutter error: "+err);		    
			
		    }); /// close_shutter
		    
		}); /// get_image
		
            }); /// open_shutter

        }); /// define_subframe

    } /// launch_exposure
    
    module.exports = {

	send_test            : send_test            ,
	get_serial_number    : get_serial_number    ,
	get_firmware_version : get_firmware_version ,
	
	launch_exposure      : launch_exposure      , /// define, open, get, close
	abort                : abort                ,
	
	define_subframe      : define_subframe      ,
	open_shutter         : open_shutter         , /// de_energize
	close_shutter        : close_shutter        , /// de_energize
	get_image            : get_image            ,	  
	heater_on            : heater_on            ,
	heater_off           : heater_off           ,
	
    }

}).call(this);