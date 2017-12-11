#!/usr/bin/env node

/**
 * @file   server.2.js
 * @author Davide Ricci (davide.ricci82@gmail.com)
 * @date   Sat Apr 22 02:27:23 2017
 * 
 * @brief Manages client data and dispatches messages to the database.
 *
 * 
 */

// "use strict"

var wsserver = require('websocket').server;
var http = require('http');    

var config= require('./config.json')   /// Configuration file.
var db_obs= require('./db_obs.js');    /// DB functions.
var schedule =require('./schedule.js') /// Launches observations.

/// 1) Create http server and listening.
var server = http.createServer(function(request, response) {});

server.listen(config.ws.port, function(){   /// Same port as client side.
    console.log((new Date()) + ': Server is listening on port '+config.ws.port);
});

/// 2) Creates a websocket server.
ws = new wsserver( { httpServer: server } );

/// 3) Creates a listener for connections.
var count = 0;                  /// Resets clients counter.
var clients = {};               /// Stores connected client.

ws.on('request', function(r){   /// Listens connections.
    var connection = r.accept('echo-protocol', r.origin); /// Accepts the connection.
    var client_id = count++;    /// Set an  id for this client & increment counts,
    clients[client_id] = connection; /// Stores the connection method
                                     /// so that we can loop through &
                                     /// contact all clients.

    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' connected. It\'s client n°: '+client_id);
    
    /// 3a) Retrieves the most recent entry from the database (to show something).
    
    db_obs.last_entry(function(data){
	connection.send(JSON.stringify(data)); /// Sends the string to the client.
    })
    
    /// 3b) Listens for incoming messages and broadcast.
    connection.on('message', function(message){ /// Creates event listener.
	
	var msgString = message.utf8Data; /// The string message that was sent to us.
	var msgjson = JSON.parse(msgString)
	
	msgjson.id=client_id
	
	if(msgjson.whoami=='abort'){   /// Calls the scheduler to abort the command.
	    	schedule.abort(msgjson) 
	}
	
	if(msgjson.whoami=='client'){
	  	    
	    /**
	     * This should be replaced by an async function
	     * 
	     */
	    
	    var ntrucs=msgjson.nexp;
	    
	    function do_something(cb){
	    	schedule.launch(msgjson,cb)
	    } /// do something	    
	    
	    function done_cb(){
	    	ntrucs--;
	    	if(ntrucs>0){
	    	    do_something(done_cb);
	     	    msgjson.iteration=parseFloat(ntrucs)
	    	    console.log("==== Iteration "+msgjson.iteration+" complete ====");
	    	}else{
	    	    console.log("==== Done all iterations! ====");
	    	}
	    }
	    
	    do_something(done_cb);
	  	    
	    /**
	     * This is the async function. Can't find the bug.
	     * 
	     */

	    // async function times(n, f) { while (n-- > 0) await f(n); }
	    // times(msgjson.nexp, (nn)=>schedule.launch(msgjson, function(){return nn}) )
	    
	} /// if msgjson
	
	/// Showing in the server console all the message.
    	console.log(msgjson);		    
	
	/// Dispatching the message to each connected client.
	for(var i in clients)
	    clients[i].sendUTF(JSON.stringify(msgjson)); 
	
    }); /// connection.on
    
    /// 3b) Listening for client disconnection.
    connection.on('close', function(reasonCode, description){ /// Creates an event listener.
	delete clients[client_id];
	console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');		
    });
    
}); /// ws.on
