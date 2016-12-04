#!/usr/bin/node

// var foo = function() {
//     console.log(new Date().getTime());  
// };


(function(count) {
    if (count < 5) {

	require("./jallsky.7.js")
	
//	foo();
        var caller = arguments.callee;
        setTimeout(function() {
            caller(count + 1);
        }, 1000);    
    }
})(0);
