#!/usr/local/bin/node

/**
 * @file   message.js
 * @author Davide Ricci (davide.ricci82@gmail.com)
 * @date   Sat Apr 22 02:39:59 2017
 * 
 * @brief  Simple message functions. 
 * 
 * 
 */

"use strict"

var WebSocket = require('ws')    
var config= require('./config.json')   /// Configuration file

var ws = new WebSocket('ws://'+config.ws.ip+':'+config.ws.port, 'echo-protocol'); /// Same port on the server and the client.

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

