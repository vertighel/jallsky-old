#!/usr/local/bin/node

"use strict"

var WebSocket = require('ws')    
var config= require('./config.json')   /// Configuration file

var ws = new WebSocket('ws://'+config.ws.ip+':'+config.ws.port, 'echo-protocol'); /// SET SAME PORT ON SERVER SIDE!

(function(){

    exports.elapsed = function(data,cb){
	data.percent = (data.t1/data.t2*100).toFixed(0)	
	ws.send(JSON.stringify(data),function(err,res){
	    if(err !=null) console.log("Websocket error sending message: "+err)
	})	
    }
    
    exports.simple = function(data,cb){	
	ws.send(JSON.stringify(data),function(err,res){
	    if(err !=null) console.log("Websocket error sending message: "+err)	    
	})	
    }
    

}).call()

