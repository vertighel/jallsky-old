#!/usr/bin/nodejs

var http = require('http'),                     /// http module
wsserver = require('websocket').server;         /// websocket module (npm install websocket)

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
    var id = count++;                           /// Specific id for this client & increment count
    clients[id] = connection;                   /// Store the connection method so we can loop through & contact all clients
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' connected. Connection id: '+id);
    
    
    /// 3a) Listen for incoming messages and broadcast
    connection.on('message', function(message){ /// Create event listener

	var msgString = message.utf8Data;       /// The string message that was sent to us			

	var msgjson = JSON.parse(msgString)

	msgjson.id=id
	
	for(var i in clients)
            clients[i].sendUTF(JSON.stringify(msgjson));      /// Send a message to the client with the message

    });
    
    /// 3b) Listen for client disconnection
    connection.on('close', function(reasonCode, description){ /// Create event listener
	delete clients[id];
	console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
    
}); /// ws.on
