var defaults = require('./defaults.js'),
	theconfig = defaults.get(),
	debug = require('debug')('couchtransform'),
	path = require('path'),
	argv = require('minimist')(process.argv.slice(2));

// CouchDB url
if( typeof process.env.COUCH_URL != "undefined") {
	theconfig.COUCH_URL = process.env.COUCH_URL;
}

// CouchDB database
if( typeof process.env.COUCH_DATABASE != "undefined") {
	theconfig.COUCH_DATABASE = process.env.COUCH_DATABASE;
}

// CouchDB database design
if( typeof process.env.COUCH_DESIGN != "undefined") {
	theconfig.COUCH_DESIGN = process.env.COUCH_DESIGN;
}

// CouchDB database view
if( typeof process.env.COUCH_VIEW != "undefined") {
	theconfig.COUCH_VIEW = process.env.COUCH_VIEW;
}

// CouchDB database view
if( typeof process.env.COUCH_VIEW_PARAMS != "undefined") {
	theconfig.COUCH_VIEW_PARAMS = process.env.COUCH_VIEW_PARAMS;
}

// Transformation function
if( typeof process.env.COUCH_TRANSFORM != "undefined") {
	theconfig.COUCH_TRANSFORM = require(path.resolve(process.cwd(),process.env.COUCH_TRANSFORM));
}

// Parallelism specified
if( typeof process.env.COUCH_PARALLELISM != "undefined") {
	theconfig.COUCH_PARALLELISM = parseInt(process.env.COUCH_PARALLELISM);
}

// override with command-line parameters
if(argv.url) {
	theconfig.COUCH_URL = argv.url;
}
if(argv.db) {
	theconfig.COUCH_DATABASE = argv.db;
}
if(argv.design) {
	theconfig.COUCH_DESIGN = argv.design;
}
if(argv.view) {
	theconfig.COUCH_VIEW = argv.view;
}
if(argv.view_params) {
	theconfig.COUCH_VIEW_PARAMS = argv.view_params;
}
if(argv.transform) {
	theconfig.COUCH_TRANSFORM = require(path.resolve(process.cwd(),argv.transform))
}
if(argv.parallelism) {
	theconfig.COUCH_PARALLELISM = parseInt(argv.parallelism);
}

debug("********************");
debug("configuration");
debug(JSON.stringify(theconfig, null, ' ').replace(/\/\/.+@/g, "//****:****@"));
debug("********************");

module.exports = theconfig;
