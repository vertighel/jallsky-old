#!/usr/local/bin/node

"use strict"

var config = require('./config.json');
var message = require('./message.js');

var mongo = require('mongodb');
var db = new mongo.Db(config.mongo.database, new mongo.Server(config.mongo.ip, config.mongo.port, {}), {});

(function(){

    exports.last_entry = function(cb){
	db.open(function(err, db) {
	    console.log("opening")
	    db.collection(config.mongo.collection, function(err, collection) {
		collection.find({}).limit(1).sort({dateobs:-1}).toArray(function(err,result){
		    result[0].whoami="database"
		    //		    connection.send(JSON.stringify(result[0])); /// send the string to the client
		    
		    //		    console.log(JSON.stringify(result[0])); /// send the string to the client
		    cb(result[0])

		    db.close();
		})
	    });				
	});	
    }

    
    exports.last_n = function(n,cb){
	db.open(function(err, db) {
	    db.collection(config.mongo.collection, function(err, collection) {
		collection.find({}).limit(n).sort({dateobs:-1}).toArray(function(err,result){
		    cb(result)
		    db.close();
		})
	    });				
	});	
    }


    exports.enter = function(doc,cb){
	db.open(function(err, db) {
	    db.collection(config.mongo.collection, function(err, collection) {
	    	collection.insert(doc, function() {
	    	    console.log("inserting")
	    	    cb(doc)
	    	    db.close(function() {
		    });				
	    	});
	    });
	});	    

    }


}).call()
