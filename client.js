
var config = (function() { /// Retrieve configuration file.
        var config = null;
        $.ajax({
            'async': false,
            'global': false,
            'url': "./config.json",
            'dataType': "json",
            'success': function (data) {
                config = data;
            }
        });
        return config;
    })();


$("form").on("submit",function(event){
    event.preventDefault();                  /// avoids the page to reload
    
    var normaldata=$(this).serializeArray(); /// takes all the form parameters
    
    var compactdata = { };                   /// compacts them in a "key,value" pair:
    $.each(normaldata, function() {          /// on each element...
	compactdata[this.name] = this.value; /// the name is the value 
    });

    compactdata.whoami="client"
    
    console.log(JSON.stringify(compactdata,undefined,2))
    
    /// inserting the text on the textareas 
    // $("aside.sent div").text(JSON.stringify(normaldata, undefined, 2));   /// indentation level = 2
    // $("aside.sent span").text(JSON.stringify(compactdata, undefined, 2)); /// indentation level = 2

    ws.send(JSON.stringify(compactdata)); /// send the string to the server
    
});


$("#abort").on("click",function(event){

    var compactdata = {}
    compactdata.whoami="abort"
    compactdata.action="abort"
    
    console.log(JSON.stringify(compactdata,undefined,2))
    
    ws.send(JSON.stringify(compactdata)); /// send the string to the server    
    
});

/* opening a websocket connection to interact with other users.  Where is server.js? */
//var ws = new WebSocket('ws://localhost:1234', 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!
var ws = new WebSocket('ws://'+config.ws.ip+':'+config.ws.port, 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!

var w = {min:"5",max:"300"}
var h = {min:"5",max:"100"}
var widthrange = [w.min,w.max]
var heightrange = [h.min,h.max]
var colorrange = ["#000","#eee"]

var hlin = d3.scaleLinear()
    .range(heightrange)
var hlog = d3.scaleLog()
    .range(heightrange)
var clin = d3.scaleLinear()
    .range(colorrange)


var svg = d3.select("#histogram figure")
  .append("svg")
//     .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("viewBox", "0 0 300 100")
    .attr("class", "img-fluid")
    .attr("width", "100%")
//     .attr("height", h.max)


var tot=[] /// creating a new array to contain my data and other user's data
ws.addEventListener("message", function(e) { /// creates an event listener for server messages
    var obj=$.parseJSON(e.data)
    
    /// Messages are arriving from the allskycam or from the client
    
    if(obj.whoami=="get_bytes"){
	$("#transfer_progress").val(obj.percent)
	$("#transfer_output").text(obj.percent)
    }
    
    if(obj.whoami=="image_data_func"){
	$("#exposure_progress").val(obj.percent)
	$("#exposure_output").text(obj.percent)
    }

    
    if(obj.whoami=="database" || obj.whoami=="create_png"){

	if(obj.histo) update_barchart()

	// if(obj.histo) update_histogram()

	$("#maxist").text(Math.max(...obj.histo.data))
	$("#minist").text(Math.min(...obj.histo.data))

	$("#mincuts").text(obj.histo.start)
	$("#maxcuts").text(obj.histo.step)

	$("#iteration").text(obj.iteration)
	$("#total_exp").text(obj.nexp)

	 // $("#image h2").text(obj.dateobs)

	var datearr=obj.dateobs.split('T')
	$("#image h2").text(datearr[0])
	$("#image h4").text(datearr[1]+" UT")

	$("#image img").attr("src",obj.pngname)
	$("#image img").attr("alt",obj.dateobs)
	$("#image span").html("<strong>JD: </strong>"+obj.jd+" &nbsp; - &nbsp; <strong>Exposure time: </strong>"+obj.exptime+"s")
	
	//    $("video source").attr("src",'./mnt/output.mp4')
	
	$("a.fits").attr("href",obj.fitsname)
	$("a.png").attr("href",obj.pngname)

//	$("pre code").text(JSON.stringify(obj, undefined, 2))

	d3.selectAll("input").on("change",update_barchart)

	update_barchart()
	
function update_barchart(){
    console.log("called")
    
    var dataset=obj.histo.data
    dataset = dataset.map(x => x+1) /// adding one to avoid issue with log scale

    
    var dom=d3.extent(dataset)
    
    var hscale = d3.select("#log").property("checked") 
	? hlog.domain(dom) : hlin.domain(dom)
    
    var cscale = clin.domain([0,dataset.length-1])


    // var aspect = w.max / h.max,
    // 	chart = d3.select('#chart');
    // d3.select(window)
    // 	.on("resize", function() {
    // 	    var targetWidth = chart.node().getBoundingClientRect().width;
    // 	    chart.attr("width", targetWidth);
    // 	    chart.attr("height", targetWidth / aspect);
    // 	});

    var elem = svg.selectAll("rect")
	.data(dataset)

    elem
	.enter()
	.append("rect")

    elem
    	.attr("x", (d,i) => i * (w.max / dataset.length) )
	.attr("y", d =>  h.max-hscale(d)+1 ) 
	.attr("width", w.max / dataset.length )
	.attr("height", d => hscale(d)+1 )
	.attr("fill", (d,i) => cscale(i) )

    
    elem
	.exit()
	.remove()

    var labs = svg.selectAll("text")
	.data(dataset)

    labs
	.enter()
	.append("text")

    labs
	.text( (d,i) => i % (dataset.length/10) == 4  ? d : null )
	.attr("text-anchor", "middle")
    	.attr("x", (d,i) => i * (w.max / dataset.length) )
	.attr("y", d =>  h.max-hscale(d) - 16  )
	.attr("font-family", "sans-serif")
	.attr("font-size", "0.5em")
	.attr("fill", "steelblue");

    labs
	.exit()
	.remove()

}    





	

	
    } /// if obj
    
    
    
});




