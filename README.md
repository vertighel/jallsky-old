
## Synopsis

**jallsky** is a node.js system control for the SBIG AllSky 340M Camera.
Its development stage is **in a pre-alpha phase**.

It takes inspiration from the following python drivers:

 - https://github.com/badders/pyallsky
 - https://github.com/saltastro/skycam

It provides following features:

 - A node driver to communicate with the camera: 
   it is a node translation of the pyallsky code.
 - A web page to control the camera:
   it is a simple interface based on bootstrap 4.
 - A link to the [node-fits](https://github.com/Nunkiii/node-fits) github module:
   this module allows using data from the AllSky Camera to treate FITS files and png images, and to add custom FITS header keys. It also creates a simple histogram of the values of the image.
 - A set of mongodb functions to save informations about observations:
   these observations are mainly key headers containing image informations, timing, and filesystem paths of the locations where fits and png images are stored.
 - A websocket server to broadcast camera and db informations;
 - a node video script to create an animation of last images (IN PROGRESS).

## Motivation

This project is born to provide the [OARPAF observatory](http://www.orsa.unige.net) with the best AllSkyCamera system and to help its robotization process.
The final goal is to integrate [webGL features](https://github.com/Nunkiii/XD-1) to dynamically change image cuts; to provide a web interface to dynamically browse the image db, and to  add overlays to the image containing the position of celestial objects and of the OARPAF 80cm telescope during pointing, improving ESO solutions such as the [La Silla AllSky Camera](http://www.ls.eso.org/lasilla/dimm/lasc/). 

## Installation

Due to the early development stage, the installation process is quite articulated.

### Installing the latest node version

The latest node version (7.9) supports async/await functions which are very helpful in our case.

    cd /usr/local/	
    wget https://nodejs.org/dist/v7.9.0/node-v7.9.0-linux-x64.tar.xz
    tar --strip-components 1 -xf node-v7.9.0-linux-x64.tar.xz
    ln -s /usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js node-gyp
    rm CHANGELOG.md LICENSE README.md node-v7.9.0-linux-x64.tar.xz

### Cloning the repository

Enter into your favourite git directory, or mkdir it:

    cd ~ # or your git directory
    git clone https://github.com/vertighel/jallsky.git
	cd jallsky/
	npm -f install

<!-- Creating directories to store fits files and png images -->

<!--     mkdir ./mnt ./mnt/fits ./mnt/png -->

Installing the node-fits module, necessary in order to convert the images of the camera to FITS and png files:

    cd node-modules/
    git clone https://github.com/Nunkiii/node-fits.git
	sudo apt-get install g++ libpng-dev libjpeg9-dev libcfitsio3-dev 
	cd node-fits
	node-gyp configure
	node-gyp build

### Installing the additional components

Installing bootstrap, which provide a mobile-first html, css and js framework:

	cd ~ # or your git directory
    git clone https://github.com/twbs/bootstrap.git

Installing mongodb, necessary to store the information and metadata relative to the saved images, and creating the collection which will contain these information:

	sudo apt-get install mongodb
	mongo
	db.createCollection(allskycam)
	exit


## Configuration

./config.json and ./header_template.json contain information about image storing, connection to the database, and FITS  header keys.

## Launch

	./server.2.js

If you have an installed web server, for example apache, open your browser on localhost at page.2.html, and launch observations.
The idea is to make this page a configuration page, password-protected. The page external.html will be the front end for everyone.



<!-- ## API Reference -->

<!-- Depending on the size of the project, if it is small and simple enough the reference docs can be added to the README. For medium size to larger projects it is important to at least provide a link to where the API reference docs live. -->

<!-- ## Tests -->

<!-- Describe and show how to run the tests with code examples. -->

## Contributors

Davide Ricci
Pierre Sprimont

## License

This program is free software.
