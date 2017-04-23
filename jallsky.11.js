#!/usr/local/bin/babel-node

/**
 * @file   jallsky.11.js
 * @author Pierre Sprimont and Davide Ricci (davide.ricci82@gmail.com)
 * @date   Sat Apr 22 02:46:46 2017
 * 
 * @brief  AllSky 340M Camera driver
 * 
 * 
 */

"use strict";

var serialport = require('serialport'); /// Camera communication,
var julian = require("julian");     /// Julian Date conversion.
var fs=require("fs")                /// File stream for node-fits.

var fits = require('./node_modules/node-fits/build/Release/fits'); /// Manages fits files.
var config= require('./config.json')   /// Configuration file.
var message = require('./message.js'); /// Websocket meessage functions.

(function(){

    /// Opens the serial connection with the camera 
    var sp = new serialport(config.camera.device, /// /dev/ttyUSB0 
			    {baudRate: config.camera.baudrate,  // 115200 (, 230400, 460800),
			     autoOpen:false,},
			    err => err!== null ? console.log('serialport instance error: ', err.message) : true
			   );

    //    sp.on('open',  showPortOpen);
    sp.on('close', showPortClose);
    sp.on('disconnect', showPortDisconnect);
    sp.on('error', showError);
    sp.on('data',  sendSerialData);

    sp.open(err => {
	showPortOpen(err)
    });
    
    
    function open_port(err){
	sp.open(err => {
	    showPortOpen(err)
	});
    }

    function close_port(err){
	sp.close(err => {
	    showPortClose(err)
	}); 
    }
    
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
    function checksum_buf(com){
	var cs=0;
	var cl=com.length;
	for(var b=0; b<cl-1; b++){
	    var by=com.readUInt8(b);
	    var csb = ~by & 0x7F;
	    cs = cs ^ csb;
	}
	return com.writeUInt8(cs,cl-1);
	console.log("Checksum buf: ["+com.writeUInt8(cs,cl-1)+"]");
    }

    function checksum(com){
	var cs = 0
	for(var b=0; b<com.split('').length; b++){
	    var csb = ~com[b].charCodeAt(0) & 0x7F;
            cs = cs ^ csb	
	}
	return String.fromCharCode(cs)
	console.log("Checksum: ["+String.fromCharCode(cs)+"]");
    }

    /// Send Command
    function send_command(command, cb, nb) {
	var cs = checksum(command)

	var cmd=command+cs;
	console.log("Sending command ["+command+"]");

	function on_data(buf){
	    var received_cs=buf.readUInt8(0);
	    var received_data=buf.slice(1); /// Cuts the first element.
	    
	    if(received_cs!==cs.charCodeAt(0)){  /// Checksum matching.
		console.log("Checksum ERR ! sent = " + cs.charCodeAt(0) + " received=" + received_cs );
	    }else{
		console.log("Checksum OK  ! sent = " + cs.charCodeAt(0) + " received=" + received_cs );
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
	
	sp.write(cmd, err => {
	    if (err) {
		console.log("Error while sending ["+command+"] : " + err);
		cb(err);
	    }
	});
	
    }

    function send_test(cb){
	send_command('E', (err,data) => {
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
	send_command('V', (err,data) => {
	    if(err!==null) return console.log("Error getting firmware version: " + err);
	    var version = data.readInt16LE(0);
	    console.log("Firmware version : [" + version + "] NB=" + data.length );
	    cb()
	}, 3);
    }

    function get_serial_number(cb){
	send_command('r', (err,data) => {
	    if(err!==null) return console.log("Error getting serial number: " + err);
	    var serial=data.toString('ascii');
	    console.log("Serial Number : [" + serial + "] NB=" + data.length );
	    cb()
	}, 11);
    }

    function heater_on(cb){
	send_command('g\x01', err => {
    	    if(err!==null){
		console.log("Error switching on the heater: " + err);
		cb(err)
	    }	
    	    console.log("Heater on!");	
	}, undefined);

    }

    function heater_off(cb){
	send_command('g\x00', err => {
    	    if(err!==null){
		console.log("Error switching off the heater: " + err);
		cb(err)
	    }	
	    console.log("Heater off!");
	}, undefined);
    }

    function chop_on(cb){
	send_command('U\x01', err => {
	    if(err!==null){
		console.log("Error switching on chopping mode: " + err);
		cb(err)
	    }
	    console.log("Chop on!");
	}, undefined);
    }

    function chop_off(cb){
	send_command('U\x00', (err,data) => {
	    if(err!==null){
		console.log("Error switching off chopping mode: " + err);
		cb(err)
	    }
	    console.log("Chop off!");
	}, undefined);
    }

    function open_shutter(cb){
	send_command('O', (err,data) => {
	    if(err!==null) return  cb(err)
	    setTimeout(() => {
		send_command('K', cb, undefined);  /// DE_ENERGIZE
		console.log("Shutter open !");
	    },10) /// ms
	}, undefined);
    }

    function close_shutter(cb){
	send_command('C', (err,data) => {
	    if(err!==null) return cb(err)
	    setTimeout(() => {
		send_command('K', cb, undefined);  /// DE_ENERGIZE
		console.log("Shutter closed !");
	    },10) ///ms
	}, undefined);
    }

    function abort(cb){
	send_command('A', err => {
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

	data_listener_func= data => {
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



    /** 
     *
     * 
     * @param params 
     * @param cb 
     * 
     * @return 
     */
    function define_subframe(params,cb){
	
	var x=Buffer.alloc(4);
	x.writeInt32LE(params.x_start);    
	var y=Buffer.alloc(4);
	y.writeInt32LE(params.y_start);
	var s=Buffer.alloc(4);
	s.writeInt32LE(params.size);
	
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
	
	sp.write(combuf, err => {
	    if (err) {
		console.log("Error while sending ["+command+"] : " + err);
		cb(err);
	    }
	    console.log("Subframe defined. Parameters: "+[params.x_start,params.y_start,params.size]);
	});	
    }

    /** 
     *  
     * 
     * @param params 
     * @param progress_callback Function to be called after each block is downloaded.
     * @param cb 
     * 
     * @return 
     */
    function get_image(params, progress_callback, cb){	
	
	var image_type={
	    dark: {imcode:0},
	    light:{imcode:1},
	    auto: {imcode:2}, /// Light-Dark (only binned).
	}
	
	/// Maximum size of the sub-frame: 127 pixels.
	if(params.size == undefined) params.size=127 // Max size if not specified.
	
	var frame_type={// width, height, blocks, frcode
	    full:   {width:640,  height:480,  blocks:4096, frcode:0    },
	    crop:   {width:512,  height:480,  blocks:4096, frcode:1    },
	    binned: {width:320,  height:240,  blocks:1024, frcode:2    }, /// Only "auto".
	    custom: {width:params.size, height:params.size, blocks:params.size, frcode:255  },
	}

	if(params.imagetyp == 'auto') params.frametyp='binned'
	
	Object.assign(params, image_type[params.imagetyp], frame_type[params.frametyp])
		
	/// Camera expsosure time works in 100µs units.
	params.exptime= parseFloat(params.exptime) /// It will be useful several times
	var exptime = params.exptime / 100e-6;
	if(exptime > 0x63FFFF) exptime = 0x63FFFF /// 653.3599s;

	var blocks_expected = (params.width * params.height) / params.blocks;
	var block_nbytes=2*params.blocks;	

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
	
	console.log('Beginning Exposure')
	var start_time 0; /// "E" = Exposure in progress. This is sent approximately every 150ms.
	var E_in_progress: 150/1000 ///ms

	var first_data_received=true;
	
	var image_data_func= in_data =>{

	    if(first_data_received===true){
		var firstchar=in_data.readUInt8(0);
		first_data_received = false;

		if(cmd_checksum !== firstchar){
		    console.log("Image_data_func Checksum error !!");
		}else
		    console.log("Image_data_func Checksum match !");
	    }
	    else{
		console.log("GetImage received progress data ["+in_data.toString('ascii')+"]");
		
		var mid_time = new Date().getTime(); /// In ms.
		var time_diff = (mid_time-start_time)/1000; /// In s.

		message.elapsed({whoami:'image_data_func', t1:start_time+=e_in_progress, t2:params.exptime})
		
	    }
	    
	    if(in_data == 'D'){ /// Exposure complete!
		
		var blocks_complete = 0;
		var total_nbytes=blocks_expected*block_nbytes;

		var received_bytes=0;
		var received_cs_bytes=0;
		var block_bytes=0;

		var image_data=new Buffer(total_nbytes);
		
		console.log('Exposure Complete ! Transfering Image : ' + blocks_expected + " blocks to read");

		get_bytes(block_nbytes+1, (in_data) => {

		    var nb=in_data.byteLength;

		    var cs = 0
		    for(var c=0; c<block_nbytes; c++)
			cs = cs ^ in_data.readUInt8(c);
		    
		    in_data.copy(image_data,received_bytes,0,block_nbytes);

		    var csum_in=in_data.readUInt8(block_nbytes);
		    
		    received_bytes+=block_nbytes;

		    message.elapsed({whoami:'get_bytes', t1:received_bytes, t2:total_nbytes})
		    
		    if(received_bytes===total_nbytes){
			sp.write('K'); /// Checksum OK!
			console.log("Received all data !")
			cb(null, image_data);
		    }
		    else
			sp.write('K');  /// Checksum OK!
		}, 1);
		
		send_command('X', (err, res) => { /// Transfers image.
		    if(err!==null) return cb(err);		
		}, null);
		
	    }
	}

	data_listener_func=image_data_func;

	sp.write(com, err =>{
	    if(err!==null) return cb(err);
	    console.log("Comamnd TAKEIMAGE sent ok!");
	});
	
    }

    /** 
     * 
     * 
     * @param params 
     * @param cb 
     * 
     * @return 
     */
    function create_png(params,cb){
	
	var pngname  = config.png.dir+params.dateobs+".png"
	
	var f = new fits.file(params.fitsname); /// The file is automatically open (for reading) if the file name is specified on constructor.

	f.get_headers((error, headers) => {
	    
	    if(error) return console.log("Bad things happened : " + error);
	    
	    f.read_image_hdu((error, image) => {
		
		if(error) return console.log("Bad things happened while reading image hdu : " + error);
		
		if(image){
		    
		    console.log("Image size : " + image.width() + " X " + image.height()); 
		    
		    var colormap= config.png.colormap
		    ///R  ///G  ///B  ///A  ///level: 0=min,1=max
		    // [
		    // [0.0, 0.0, 0.0, 1.0, 0.0],
		    // [0.4, 0.4, 0.4, 1.0, 0.8],
		    // [0.8, 0.8, 0.8, 1.0, 0.9],
		    // [1.0, 1.0, 1.0, 1.0, 1.0]
		    // ];

//		    nbins:50
		    image.histogram({}, (error, histo) => { 
			if(error)
			    console.log("Histo error : " + error);
			else{
			    //			console.log("HISTO : " + JSON.stringify(histo));
			    params.histo=histo
			}
		    });
		    
		    var cuts=config.png.cuts;  /// For 25s
		    
		    image.set_colormap(colormap);
		    image.set_cuts(cuts);

		    params.pngname=pngname

		    var out = fs.createWriteStream(pngname);
		    out.write(image.tile( { tile_coord :  [0,0], zoom :  0, tile_size : [image.width(),image.height()], type : "png" }));
		    out.end();

		    console.log("create_png: written")

		    cb(params);
		}
		
	    });
	    
	    
	});
	console.log("create_png: ended")	
    }

    /** 
     * 
     * 
     * @param data 
     * @param params 
     * @param cb 
     * 
     * @return 
     */
    function write_fits(data,params,cb){
	
	console.log("write_fits: routine called. Got image!")		
	
	var now      = new Date(); /// Time stamp to be used for file names, DATE-OBS and JD
	var dateobs  = now.toISOString().slice(0,-5)  /// string
	var jd       = parseFloat(julian(now))        /// double
	
	var fitsname = config.fits.dir+dateobs+".fits"
	
	var fifi     = new fits.file(fitsname); 
	var M        = new fits.mat_ushort;
	
	M.set_data(params.width,params.height,data);
	fifi.file_name;		
	fifi.write_image_hdu(M);	
	
	var h=require(config.header.template) /// Loading json containing the header template

	/// Filling variable header keys.
	h.find(x => x.key === 'DATE-OBS').value = dateobs
	h.find(x => x.key === 'JD'      ).value = jd
	h.find(x => x.key === 'EXPTIME' ).value = params.exptime
	h.find(x => x.key === 'IMAGETYP').value = params.imagetyp
	h.find(x => x.key === 'FRAMETYP').value = params.frametyp
	h.find(x => x.key === 'BINNING' ).value = params.frametyp == 'binned' ? parseInt(2) : parseInt(1)
	h.find(x => x.key === 'SUBFRAME').value = params.frametyp == 'custom'
	    ? "["+[params.x_start, params.y_start, params.size].toString()+"]" : ''

	/// Filling fixed header keys.
	fifi.set_header_key(h, err => console.log("Error setting fits header: "+err))
	
	var post  = {jd:jd, dateobs:dateobs, exptime:params.exptime, fitsname:fitsname };

	Object.assign(params, post);

	cb(params)
	
    }


    /** 
     * 
     * 
     * @param params 
     * @param cb 
     * 
     * @return 
     */
    async function launch_exposure(params,cb){
	
    	if(params.x_start && params.y_start && params.size)
    	    await define_subframe(params, (err) => err!==null ? console.log("define_subframe error: "+err) : true)
	
    	await open_shutter( err => err!==null ? console.log("open_shutter error: "+err) : true) 
	
    	await get_image(params, function(){}, (err, image_data) =>{
    	    if(err!== null) return console.log('a_get_image error: ', err);
	    
    	 write_fits(image_data,params, function(err){
	
		create_png(params, function(){
	    	    console.log("********** callback of create_png: called ***********")
		    
	    	    setTimeout(function(){
	    		params.whoami="create_png"

		    message.simple(params,function(){
			cb()
		    })
	    	    },300) /// 1 second = 1000ms....
		    
		})

	    })
	    
    	    close_shutter( err => err!==null ? console.log("close_shutter error: "+err) : cb(params)
			 ) /// close_shutter
	    
    	}) /// get_image

    }    

///////////////////////////////////////////////////////////////////////////////////////////////////////
    
    module.exports = {

	open_port            : open_port            ,
	close_port           : close_port           ,

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


	    
