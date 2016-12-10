
/// submitting the color and the age
$("form").on("submit",function(event){
    event.preventDefault();                  /// avoids the page to reload

    var normaldata=$(this).serializeArray(); /// takes all the form parameters
    
    var compactdata = { };                   /// compacts them in a "key,value" pair:
    $.each(normaldata, function() {          /// on each element...
	compactdata[this.name] = this.value; ///the name is the value 
    });

    compactdata.whoami="client"
    
    console.log(JSON.stringify(compactdata,undefined,2))
    
    /// inserting the text on the textareas 
    // $("aside.sent div").text(JSON.stringify(normaldata, undefined, 2));   /// indentation level = 2
    $("aside.sent span").text(JSON.stringify(compactdata, undefined, 2)); /// indentation level = 2
    ws.send(JSON.stringify(compactdata)); /// send the string to the server
 
});

/* opening a websocket connection to interact with other users.  Where is server.js? */
var ws = new WebSocket('ws://localhost:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
//var ws = new WebSocket('ws://192.168.1.23:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
// var ws = new WebSocket('ws://87.15.121.195:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!


var tot=[] /// creating a new array to contain my data and other user's data
ws.addEventListener("message", function(e) { /// creates an event listener for server messages
    var obj=$.parseJSON(e.data)

    /// Messages are arriving from the allskycam or from the client
    
    if(obj.whoami=="get_bytes"){
	$("#iteration").val(obj.iteration)
	$("#total_exp").val(obj.nexp)
	$("#transfer_progress").val(obj.percent)
	$("#transfer_output").text(obj.percent)
    }
    
    if(obj.whoami=="image_data_func"){
	$("#exposure_progress").val(obj.percent)
	$("#exposure_output").text(obj.percent)
    }
    
    if(obj.whoami=="database" || obj.whoami=="create_png"){
	var datearr=obj.dateobs.slice(0,-4).split('T')
	
	$("figure h2").text(datearr[0])
	$("figure h4").text(datearr[1]+" UT")
	$("img").attr("src",obj.pngname)
	$("img").attr("alt",obj.dateobs)
	$("figcaption span").html("<strong>JD: </strong>"+obj.jd+" &nbsp; - &nbsp; <strong>Exposure time: </strong>"+obj.exptime+"s")
	
	//    $("video source").attr("src",'./mnt/output.mp4')
	
	$("a.fits").attr("href",obj.fitsname)
	$("a.png").attr("href",obj.pngname)

	$("pre code").text(JSON.stringify(obj, undefined, 2))
    }
    
    //	.prepend("<br>")   /// appends a new line
    
    });


