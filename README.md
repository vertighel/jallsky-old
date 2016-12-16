## Synopsis

**jallsky** is a node.js system control for the SBIG AllSky 340M Camera.
Its development stage is ridicously early.

It is inspired by following python drivers:

 - https://github.com/badders/pyallsky
 - https://github.com/saltastro/skycam

It provides following features:

 - a node driver to communicate with the camera;
 - a web page to control the camera;
 - a link to the node-fits module to create FITS files and png images, and to add custom FITS header keys;
 - a set of mongodb functions to save informations about observations;
 - a websocket server to broadcast camera and db informations;
 - a node video script to create an animation of last images.
 
## Code Example

## Motivation

This project is born to provide the Antola telescope the best AllSkyCamera system and to help its robotization process.

## Installation


	git clone https://github.com/vertighel/jallsky.git
	cd jallsky/
	npm -f install
		
	cd node-modules/
    git clone https://github.com/Nunkiii/node-fits.git
	sudo apt-get install node node-gyp g++ libpng-dev libjpeg-dev libcfitsio3-dev 
	cd node-fits
	node-gyp configure
	node-gyp build

    cd ../../
	sudo apt-get install mongodb
	mongo
	db.createCollection(allskycam)
	
	./server.js

Open your browser on localhost at  page.2.html	

<!-- ## API Reference -->

<!-- Depending on the size of the project, if it is small and simple enough the reference docs can be added to the README. For medium size to larger projects it is important to at least provide a link to where the API reference docs live. -->

<!-- ## Tests -->

<!-- Describe and show how to run the tests with code examples. -->

## Contributors

Davide Ricci
Pierre Sprimont

## License

This program is free software.
