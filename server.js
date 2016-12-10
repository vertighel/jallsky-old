#!/usr/bin/node

var http = require('http'),                     /// http module
wsserver = require('websocket').server;         /// websocket module (npm install websocket)

var mysql = require('mysql')                     /// mysql module

var jall = require('./jallsky.8.js')                     /// my module

var dbconnection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'password',
    database : 'test'
});


/// 1) Create http server and listening.
var server = http.createServer(function(request, response) {});
var port = 1234                                 /// Listening on this port.
server.listen(port, function(){                 /// SET SAME PORT ON CLIENT SIDE!
    console.log((new Date()) + ': Server is listening on port '+port);
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

    /////////////////////////////////// 
    var query = dbconnection.query('SELECT * from allskycam ORDER BY id DESC LIMIT 1',  function(err, result) {
    	if(err!== null){
	    console.log("Error retreiving image: "+err)
	    console.log("Closing the connection ")
    	    dbconnection.end() /// closing mysql connection
	}
	    
    	console.log("Executed: "+query.sql);
    	console.log(result[0]);

	result[0].whoami="database"
    	console.log(result[0]);
	
	connection.send(JSON.stringify(result[0])); /// send the string to the client
	
    });

    
    /// 3a) Listen for incoming messages and broadcast
    connection.on('message', function(message){ /// Create event listener

	var msgString = message.utf8Data;       /// The string message that was sent to us			


	
	var msgjson = JSON.parse(msgString)

	msgjson.id=client_id

	if(msgjson.whoami=='client'){
	    jall.launch_exposure(msgjson)
	}
	
    	console.log("Message received from client n°: "+client_id+". The message is");
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


