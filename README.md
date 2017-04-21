
## Synopsis

**jallsky** is a node.js system control for the SBIG AllSky 340M Camera.
Its development stage is **in a pre-alpha phase**.

It takes inspiration from the following python drivers:

 - https://github.com/badders/pyallsky
 - https://github.com/saltastro/skycam

It provides following features:

 - a node driver to communicate with the camera; 
 - a web page to control the camera;
 - a link to the node-fits module to create FITS files and png images, and to add custom FITS header keys;
 - a set of mongodb functions to save informations about observations;
 - a websocket server to broadcast camera and db informations;
 - a node video script to create an animation of last images (TODO).
 
## Code Example

## Motivation

This project is born to provide the OARPAF telescope with the best AllSkyCamera system and to help its robotization process.

## Installation

### Installing the latest node version

The latest node version (7.9) supports async/await functions which are handy our case

    cd /usr/local/	
    wget https://nodejs.org/dist/v7.9.0/node-v7.9.0-linux-x64.tar.xz
    tar --strip-components 1 -xf node-v7.9.0-linux-x64.tar.xz
    ln -s /usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js node-gyp
    rm CHANGELOG.md LICENSE README.md node-v7.9.0-linux-x64.tar.xz

### Cloning the repository

Enter into your favourite git directory, or mkdir it.

    cd ~ # or your git directory
    git clone https://github.com/vertighel/jallsky.git
	cd jallsky/

### Installing the components

To install the node-fits module, necessary in order to convert the images of the camera to FITS and png files:

    cd node-modules/
    git clone https://github.com/Nunkiii/node-fits.git
	sudo apt-get install g++ libpng-dev libjpeg9-dev libcfitsio3-dev 
	cd node-fits
	node-gyp configure
	node-gyp build

To install mongodb, necessary to store the information and metadata relative to the saved images

    cd ../../
	sudo apt-get install mongodb
	mongo
	db.createCollection(allskycam)
	exit

Creating directories to store fits files and png images

    mkdir ./mnt ./mnt/fits ./mnt/png

The position of these directories can be edited in the ./config.json file.

To install bootstrap, which provide a mobile-first html, css and js framework:

	cd ~ # or your git directory
    git clone https://github.com/twbs/bootstrap.git

## Launch

	./server.2.js

If you have an installed web server, for example apache, open your browser on localhost at page.2.html
The page external.html



<!-- ## API Reference -->

<!-- Depending on the size of the project, if it is small and simple enough the reference docs can be added to the README. For medium size to larger projects it is important to at least provide a link to where the API reference docs live. -->

<!-- ## Tests -->

<!-- Describe and show how to run the tests with code examples. -->

## Contributors

Davide Ricci
Pierre Sprimont

## License

This program is free software.
