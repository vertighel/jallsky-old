#!/usr/local/bin/node

var wsserver = require('websocket').server;
var http = require('http');    

var config= require('./config.json')   /// Configuration file
var db_obs= require('./db_obs.js');    /// DB functions
var schedule =require('./schedule.js') /// Launch observations

/// 1) Create http server and listening.
var server = http.createServer(function(request, response) {});

server.listen(config.ws.port, function(){       /// SET SAME PORT ON CLIENT SIDE!
    console.log((new Date()) + ': Server is listening on port '+config.ws.port);
});

/// 2) Create websocket server
ws = new wsserver( { httpServer: server } );

/// 3) Create listener for  connections
var count = 0;                                  /// Reset clients counter
var clients = {};                               /// Store connected client

ws.on('request', function(r){                   /// Listen connections
    var connection = r.accept('echo-protocol', r.origin); /// Accept the connection
    var client_id = count++;                           /// Specific id for this client & increment count
    clients[client_id] = connection;                   /// Store the connection method so we can loop through & contact all clients
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' connected. It\'s client n°: '+client_id);
    
    /// 3a) Retrieving from database the most recent entry
    
    db_obs.last_entry(function(data){
	connection.send(JSON.stringify(data)); /// send the string to the client
    })
    
    /// 3b) Listen for incoming messages and broadcast
    connection.on('message', function(message){ /// Create event listener
	
	var msgString = message.utf8Data;       /// The string message that was sent to us	
	var msgjson = JSON.parse(msgString)
	
	msgjson.id=client_id
	
	if(msgjson.whoami=='abort'){	    
	    	schedule.abort(msgjson) 
	}
	
	if(msgjson.whoami=='client'){

	   
	    /// Non va la callback
	    // async function times(n, f) { while (n-- > 0) await f(n); }
	    // times(msgjson.nexp, (nn)=>schedule.launch(msgjson, function(){return nn}) )
	    
	    
	     var ntrucs=msgjson.nexp;

	    //	    schedule.launch(msgjson,function(){return "done"})
	    
	    function do_something(cb){
	    	schedule.launch(msgjson,cb)
	    } /// do something	    
	    
	    function done_cb(){
	    	ntrucs--;
	    	if(ntrucs>0){
	    	    do_something(done_cb);
	     	    msgjson.iteration=parseFloat(ntrucs)
	    	    console.log("===================iteration!"+msgjson.iteration);
	    	}else{
	    	    console.log("Done all trucs !");
	    	}
	    }
	    
	    do_something(done_cb);
	    
	} /// if msgjson
		    	    
	// console.log("Message received from client n°: "+client_id+". The message is");
    	console.log(msgjson);		    
	
	for(var i in clients)
	    clients[i].sendUTF(JSON.stringify(msgjson));      /// Send a message to the client with the message 	    
	
    });
    
    /// 3b) Listen for client disconnection
    connection.on('close', function(reasonCode, description){ /// Create event listener
	delete clients[client_id];
	console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');		
    });
    
}); /// ws.on
