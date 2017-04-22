/**
 * @file   client.js
 * @author Davide Ricci
 * @date   Sat Apr 22 01:52:25 2017
 * 
 * @brief Grabs information from the webpage and send it to the server.
 *        compactdata.whoami is the sender of the websocket message.
 *        Depending from the sender, a server action is called.
 *        d3.js code draws an histogram of the values.
 */


/// Retrieves the configuration file
var config = (function() {
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

/// Retrives form data
$("form").on("submit",function(event){
    event.preventDefault();                  /// Avoids the page to reload on click.
    
    var normaldata=$(this).serializeArray(); /// Takes all the form parameters.
    
    var compactdata = { };                   /// Compacts them in a "key,value" pair:
    $.each(normaldata, function() {          /// on each element...
	compactdata[this.name] = this.value; /// the name is the value.
    });
    
    compactdata.whoami="client" /// This tells the websocket who's sending the event.
    console.log(JSON.stringify(compactdata,undefined,2))    
    ws.send(JSON.stringify(compactdata)); /// Sends the string to the server.
    
});

/// Trigger the abort command
$("#abort").on("click",function(event){
    
    var compactdata = {}
    compactdata.whoami="abort" 
    compactdata.action="abort"     
    console.log(JSON.stringify(compactdata,undefined,2))    
    ws.send(JSON.stringify(compactdata)); /// Sends the string to the server         
    
});


/**
 *
 * Opening a websocket connection to interact with other users,
 * for example at ws://localhost:1234 (the same port have to be set on
 * the server side).
 * 
 */

var ws = new WebSocket('ws://'+config.ws.ip+':'+config.ws.port, 'echo-protocol');

/**
 * Creating the barchart for the histogram value using d3.js
 */

var w = {min:"5",max:"300"}
var h = {min:"5",max:"100"}
var widthrange = [w.min,w.max]
var heightrange = [h.min,h.max]
var colorrange = ["#000","#eee"]

var hlin = d3.scaleLinear() /// Creates a linear scale for the histogram values.
    .range(heightrange)
var hlog = d3.scaleLog() /// Creates a log scale for the histogram values.
    .range(heightrange)
var clin = d3.scaleLinear()  /// Creates a log scale for the histogram color.
    .range(colorrange)

var svg = d3.select("#histogram figure") /// Selects the The html tag. 
    .append("svg")
    .attr("viewBox", "0 0 300 100")   /// Dynamically resizes the svg image.
    .attr("class", "img-fluid")       /// Dynamically resizes the svg image.
    .attr("width", "100%")            /// Dynamically resizes the svg image.

/// Creates an event listener for server messages.
ws.addEventListener("message", function(e) {
    var obj=$.parseJSON(e.data)
    
    /// Messages are arriving from the AllSkyCam or from the client.
    
    if(obj.whoami=="get_bytes"){
	$("#transfer_progress").val(obj.percent)
	$("#transfer_output").text(obj.percent)
    }
    
    if(obj.whoami=="image_data_func"){
	$("#exposure_progress").val(obj.percent)
	$("#exposure_output").text(obj.percent)
    }
    
    /// Messages are arriving from the database or the function creating the png
    if(obj.whoami=="database" || obj.whoami=="create_png"){
	
	if(obj.histo) update_barchart()
	
	// if(obj.histo) update_histogram()
	
	/// Changing min max values and color cuts.
	$("#maxist").text(Math.max(...obj.histo.data))
	$("#minist").text(Math.min(...obj.histo.data))
	
	$("#mincuts").text(obj.histo.start)
	$("#maxcuts").text(obj.histo.step)
	
	$("#iteration").text(obj.iteration)
	$("#total_exp").text(obj.nexp)
	
	// $("#image h2").text(obj.dateobs)
	
	/// Filling tags with data
	var datearr=obj.dateobs.split('T') /// 2017-04-21T18:44:22
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
	    dataset = dataset.map(x => x+1) /// Avoids logscale issues.
	    
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
	    
	    
	    /// Adding a rectangle (bar) for each histogram value
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
	    
	    /// Adding Labels
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

	} /// update_barchart
	
    } /// if obj
    
}); /// ws.addEventListener




