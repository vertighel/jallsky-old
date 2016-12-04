#!/usr/bin/node

var serialport = require('serialport'); /// include the library
///var buffer = require('buffer'); /// Interpreting bytes as packed binary data
var fs=require("fs") /// file stream

var Promise = require('promise');

var fits = require('../node-fits/build/Release/fits');

/// yargs for arguments

//////////////////////////////////////////////////
/// Constant commands

/// Test Commands
const COM_TEST = 'E';

/// Shutter Commands
const OPEN_SHUTTER  = 'O';
const CLOSE_SHUTTER = 'C';
const DE_ENERGIZE   = 'K';

/// Heater Commands
const HEATER_ON  = 'g\x01';
const HEATER_OFF = 'g\x00';

/// Setup Commands
const GET_FVERSION = 'V';
const GET_SERIAL   = 'r';
const BAUD_RATE    = {9600: 'B0',
		      19200: 'B1',
		      38400: 'B2',
		      57600: 'B3',
		      115200: 'B4',
		      230400: 'B5',
		      460800: 'B6'};

/// Imaging Commands
const TAKE_IMAGE  = 'T';
const ABORT_IMAGE = 'A';
const XFER_IMAGE  = 'X';

const CSUM_OK    = 'K';
const CSUM_ERROR = 'R';
const STOP_XFER  = 'S';

const EXPOSURE_IN_PROGRESS = 'E';
const READOUT_IN_PROGRESS  = 'R';
const EXPOSURE_DONE        = 'D';

const MAX_EXPOSURE         = 0x63FFFF;

/// Guiding Commands
const CALIBRATE_GUIDER = 'H';
const AUTO_GUIDE       = 'I';
const TERMINATOR       = String.fromCharCode(0x1A);

/// Other Constants
const PIXEL_SIZE = 2;

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

    portName = process.argv[2]    
    TEMPO = process.argv[3]    

var sp = new serialport(portName,
			{
			    parser: serialport.parsers.raw,
			    autoOpen: false,
			    baudRate: 115200,
			    dataBits: 8,
			    stopBits: 1,
			    parity: "none",
			    
			},
			function(err){			    
			    if (err) {
				return console.log('Error: ', err.message);
			    }
			}
		       );

//sp.on('open',  showPortOpen);
sp.on('close', showPortClose);
sp.on('disconnect', showPortDisconnect);
sp.on('error', showError);
sp.on('data',  sendSerialData);

function showPortOpen(error) {
    return new Promise(
        function (resolve, reject) {
	    if(error!==null){
		console.log('Error while opening the port ' + error)
	    }else{
		console.log('port open. Data rate: ' + sp.options.baudRate)
	    }
//		resolve(console.log('port open. Data rate: ' + sp.options.baudRate));
//		reject(console.log('Error while opening the port ' + error) );
//	    }else{
//	    }
        });

}

sp.open(function(err){

    showPortOpen()
	// .then(function(result1){
	//     return send_test();
	// })
	// .then(function(result2){
	//     return get_serial_number();
	// })
	// .then(function(result3){
	//     return get_firmware_version();
	// })
	// .then(function(result){
	//     return open_shutter();
	// })
	// .then(function(result){
	//     return get_image(cb);
	// })
	// .then(function(result){
	//     return close_shutter();
	// })
	// .catch(function(error) {
	//     console.log("there was an error: "+error)
	// });
    
   });

	
function showPortOpen(error) {
    
    if (error) {
	console.log('Error while opening the port ' + error);
    } else {
	console.log('port open. Data rate: ' + sp.options.baudRate);
	
        send_command(COM_TEST, function(err,res){

	    if(err!==null) return "Com test failed" ;

	    send_command(GET_SERIAL, function(err, data){
		if(err!==null) return console.log("Error get serial number: " + err);
		var serial=data.toString('ascii');
		console.log("Serial Number : [" + serial + "] NB=" + data.length );
		
		send_command(GET_FVERSION, function(err, data){
		    if(err!==null) return console.log("Error get firmware: " + err);
		    var version = data.readInt16LE(0);
		    console.log("Firmware version : " + version);
		    
		    open_shutter(function (err, res){
			
			if(err!==null) return;
			
			get_image(TEMPO , function(){}, function(err, image_data){
			    
			    console.log("Done get image !");
			    
			    var fifi=new fits.file; 
			    fifi.file_name="test.fits";
			    var M=new fits.mat_ushort;
			    M.set_data(640,480, image_data);
			    
			    fifi.write_image_hdu(M);
  
			    fifi.read_image_hdu(function(error, image){
				if(error){
				    console.log("Bad things happened while reading image hdu : " + error);
				    return;
				}
				
				if(image){
	    
				    var colormap=[ [0,0,0,1,0],
						   [1,0,1,1,.8],
						   [1,.2,.2,1,.9],
						   [1,1,1,1,1]
						 ];
				    var cuts=[1000,3000];
				    
				    image.set_colormap(colormap);
				    image.set_cuts(cuts);
	    
				    var out
				    out = fs.createWriteStream("test.png");
				    out.write(image.tile( { tile_coord :  [2,3], zoom :  10, tile_size : [640,480], type : "png" }));
				    out.end();

				}
			    });
			    
			    
			    close_shutter(function (err, res){
				if(err!==null) return;
				console.log("Shutter closed !");
				sp.close(); return;
			    }); /// close shutter
			    
			}); /// get image
		    });  /// open_shutter
		    		    
		}, 3); /// send_command get version
		
	    }, 11);  /// send_command get serial
	    
	}, 2);  /// send_command com test
	
    } /// else

} /// showPortOpen


var data_listener_func=null;

function sendSerialData(data){
    if(data_listener_func!==null){
	data_listener_func(data);
    }
}

function showPortClose() {
    console.log('Port closed.');
}


function showPortDisconnect() {
    console.log('Port disconnected.');
}


function showError(error) {
    console.log('Serial port error: ' + error);
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
}

function checksum(com){
    var cs = 0
    for(var b=0; b<com.split('').length; b++){
	var csb = ~com[b].charCodeAt(0) & 0x7F;
        cs = cs ^ csb	
    }
    return String.fromCharCode(cs)
}


// function a2hex(str) {
//     var arr = [];
//     for (var i = 0, l = str.length; i < l; i ++) {
// 	var hex = Number(str.charCodeAt(i)).toString(16);
// 	arr.push(hex);
//     }
//     return arr.join('');
// }

// // Print a string as hex values
// function hexyfy(s){
//     var res=[];
//     for( c of s){
// 	res.push(a2hex(c));
//     }
//     console.log(res.join(":"));
//     return res;
// }

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


/// Send Command
function send_command (command, callback, nb) {
    cs = checksum(command)

    var cmd=command+cs;
    console.log("Sending command ["+command+"]... Length="+cmd.length + " Checksum=" + cs.charCodeAt(0));

    function on_data(buf){
	var received_cs=buf.readUInt8(0);
	var received_data=buf.slice(1); /// cut the first element
	
	if(received_cs!==cs.charCodeAt(0)){  /// checksum matching
	    console.log("Checksum not matching ! sent = " + cs.charCodeAt(0) + " received=" + received_cs );
	}else{
	    console.log("Checksum match OK!");
	}
	
	callback(null, received_data);
    }
    
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
	    callback(err);
	}
    });
    
}


/// Sending test command
function send_test(cb){
    send_command(COM_TEST, function(err,data){
	if(err!==null) return console.log("Error sending test command: " + err);
	console.log("Sent test. Received response. Is it 'O'? : " + data);
	if(data=="O"){
	    console.log("Response is ok!" )
	}else{
	   return console.log("Response is not ok: " + err)
	}
    }
		 ,2);

}

/// Request version information from the camera returns a hex string
/// of the version numbers
function get_firmware_version(cb){
    send_command(GET_FVERSION, function(err,data){
	if(err!==null) return console.log("Error getting firmware version: " + err);
	var version = data.readInt16LE(0);
	console.log("Firmware version : [" + version + "] NB=" + data.length );
    }
		 ,3);
    
}

/// Returns the camera's serial number
function get_serial_number(cb){
    send_command(GET_SERIAL, function(err,data){
	if(err!==null) return console.log("Error getting serial number: " + err);
	var serial=data.toString('ascii');
	console.log("Serial Number : [" + serial + "] NB=" + data.length );
    }
		 ,11);
}


/// Open the camera shutter.
/// n.b. leaves the shutter motor energized
function  open_shutter(cb){
    send_command(OPEN_SHUTTER, function(err,data){
	if(err!==null) return  console.log("Error opening shutter: " + err);
	console.log("Shutter open !");
	setTimeout(function(){
	    send_command(DE_ENERGIZE, cb);
	},1000) //1 seconde = 1000ms....	
    });
}


/// Close the camera shutter.
/// n.b. leaves the shutter motor energized
function  close_shutter(cb){
    send_command(CLOSE_SHUTTER,function(err,data){
	if(err!==null) return  console.log("Error closing shutter: " + err);
 	console.log("Shutter closed !");
	setTimeout(function(){
	    send_command(DE_ENERGIZE, cb)
	},1000) //1 second = 1000ms....
	
    });
    
}


/// Request the camera to automatically calibrate the guider.
/// returns the string of calibration data sent back from camera
function  calibrate_guider(cb){
    send_command(CALIBRATE_GUIDER, function(err, res){
	if(err!==null) return cb(err);
	response = '';
	a = '';
	while( a != TERMINATOR){
	    //	a = sp.read(1)
	    response += a;
	}
	cb(null, response);
    });

}
    
/// Begin autonomous guiding process
/// returns -- Data sent back from camera
function  autonomous_guide(cb){
    send_command(AUTO_GUIDE, function(err, res){
	response = '';
	a = '';
	while(a != TERMINATOR){
	    //	a = sp.read(1)
	    response += a;
	}
	cb(null, response);
    });
    
}


/// Fetch an image from the camera
/// exposure -- exposure time in seconds
/// progress_callback -- Function to be called after each block downloaded
/// returns an astropy HDUList object

function get_image(exposure, progress_callback, get_cb){

    /// Camera expsosure time works in 100µs units
    var exptime = exposure / 100e-6;

    if(exptime > MAX_EXPOSURE){
	exptime = MAX_EXPOSURE;
	exposure = 653.3599;
    }

    var exp = new Buffer(4); //Enough place for a long int
    exp.writeInt32LE(exptime);  //Little endian for Upper byte first...

    var up=exp.readUInt8(2); //On fait ca en details... trop!, mais c'est pour etre sur!
    var mid=exp.readUInt8(1);
    var low=exp.readUInt8(0);
    
    console.log("exptime is "+exptime+" * 100us -->  "+ exposure+"sec,  up " + up + " mid " + mid + " low " + low  );

    var combuf=new Buffer(7);

    combuf.writeUInt8(TAKE_IMAGE.charCodeAt(0),0);
    combuf.writeUInt8(up,1);
    combuf.writeUInt8(mid,2);
    combuf.writeUInt8(low,3);
    combuf.writeUInt8(0,4);
    combuf.writeUInt8(1,5);

    checksum_buf(combuf);

    var com=combuf;
    var cmd_checksum=combuf.readUInt8(6);
    
    console.log("Take image checksum is " + cmd_checksum);
    console.log("Length of com=" + com.length + " should be 7?");

    
    var timestamp = new Date();
    timestamp = timestamp.toISOString();
    

    console.log('Beginning Exposure')

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
	else
	    console.log("GetImage received progress data ["+in_data.toString('ascii')+"]");
	
	if(in_data == EXPOSURE_DONE){
	    
	    
	    var blocks_expected = (640 * 480) / 4096;
	    var blocks_complete = 0;
	    var block_nbytes=8192;
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
		

		console.log("Received image data  (8193 =?" + nb + " Total image bytes="+received_bytes + "/" + total_nbytes + " CSUM=" + cs + " CSUM IN " + csum_in + "      \r");
		
		if(received_bytes===total_nbytes){
		    sp.write(CSUM_OK);
		    console.log("Received all data !")
		    get_cb(null, image_data);
		}
		else
		    sp.write(CSUM_OK);
	    }, 1);
	    
	    send_command(XFER_IMAGE, function(err, res){
		if(err!==null)
		    return cb(err);
		
	    }, null);
	    
	}
    }

    data_listener_func=image_data_func;

    sp.write(com,function(err){
	if(err!==null) return get_cb(err);
	console.log("Command TAKEIMAGE sent ok!");
    });


    
}

