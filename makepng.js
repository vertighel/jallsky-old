#!/usr/bin/node

var fits = require('../node-fits/build/Release/fits');
var fs = require('fs');
var fifi=new fits.file("");

var file_name="/mnt/fits/2016-12-03T00:09:47.546.fits"; //or, more usefull: var file_name=process.argv[2]; 


var f = new fits.file(file_name); //The file is automatically opened (for reading) if the file name is specified on constructor.

f.get_headers(function(error, headers){
    
    if(error){
	console.log("Bad things happened : " + error);
	return;
    }
    
    console.log("FITS Headers : " + JSON.stringify(headers,null,5));

    
    //Reading an image as an arraybuffer of floats (4bytes/pixel). The returned image is another JS imported C++ class representing 2D data organised by rows: jsmat class. 
  //(this has to be extended to extract the data in other javascript supported binary types)
  
    f.read_image_hdu(function(error, image){


	
	if(error){
	    console.log("Bad things happened while reading image hdu : " + error);
	    return;
	}
	
	if(image){

	    //for (var ip in image) console.log("IP : " + ip);
	    
	    console.log("Image size : " + image.width() + " X " + image.height()); 
	    
	    var colormap=[
		[0.0, 0.0, 0.0 ,1 ,0.0],
		[0.4, 0.4, 0.4 ,1 ,0.8],
		[0.8, 0.8, 0.8 ,1 ,0.9],
		[1.0, 1.0, 1.0 ,1 ,1.0]
	    ];
	    
	    var cuts=[0,45000];
	    
	    image.set_colormap(colormap);
	    image.set_cuts(cuts);
	    
	    console.log(file_name)
	    out = fs.createWriteStream("test.png");
	    out.write(image.tile( { tile_coord :  [0,0], zoom :  0, tile_size : [640,480], type : "png" }));
	    out.end();
	    
	    //	image.histogram({ nbins: 350, cuts : [23,65] }, function(error, histo){ .... 
	    //      By default cuts are set to min,max and nbins to 200
	    
	    image.histogram({}, function(error, histo){ 
		if(error)
		    console.log("Histo error : " + error);
		else{
		    console.log("HISTO : " + JSON.stringify(histo));
		}
	    });
	    
	    console.log("End of fits callback!");
	    
	    var ab=image.get_data();
	    console.log("Image [" + image.width() + ", " +  image.height()+ " ] number of bytes " + ab.length);

            console.log("First pix is " + ab[0]);
      
	    //... do what you want with the pixels ...
	}
	
    });
  
});
