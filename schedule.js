#!/usr/local/bin/babel-node

"use strict"

var config = require('./config.json');

var jall = require('./jallsky.11.js'); /// Camera driver
var db_obs= require('./db_obs.js');    /// DB functions


(function(params){

//jall.launch_exposure({exptime:2,imagetyp:'light',frametyp:'crop'})
    
    exports.launch = function(params,cb){
	
	jall.launch_exposure(params,function(){
	    
	    db_obs.enter(params,function(){
		cb("******************************done!");		
	    })
	    
//	    console.log("Do un truc... ntrucs = " + ntrucs);
	}) /// jall.launch_exposure

    }

    
    exports.abort = function(params,cb){	
	jall.abort(params,function(){	    
	    cb("Image aborted");		
	})
    }

	
}).call()
