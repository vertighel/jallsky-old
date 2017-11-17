#!/usr/bin/env node

/**
 * @file   schedule.js
 * @author Davide Ricci (davide.ricci82@gmail.com) and Pierre Sprimont
 * @date   Sat Apr 22 02:44:34 2017
 * 
 * @brief  Schedules observations and launches the exposures.
 * 
 * 
 */

"use strict"

var config = require('./config.json');

var jall = require('./jallsky.11.js'); /// Camera driver
var db_obs= require('./db_obs.js');    /// DB functions


(function(params){

//jall.launch_exposure({exptime:2,imagetyp:'light',frametyp:'crop'})
    
    exports.launch = function(params,cb){
	
	jall.launch_exposure(params,function(){
	    
	    db_obs.enter(params,function(){
		cb("*********** done! ***************");		
	    })
	    
	}) /// jall.launch_exposure

    }

    
    exports.abort = function(params,cb){	
	jall.abort(params,function(){	    
	    cb("Image aborted");		
	})
    }

	
}).call()
