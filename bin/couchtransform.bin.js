#!/usr/bin/env node

process.env.DEBUG = (process.env.DEBUG) ? process.env.DEBUG + ",couchtransform" : "couchtransform";

var debug = require("debug")("couchtransform"),
	couchtransform = require("../app.js"),
	config = require("../includes/config.js");

var startDate = new Date();
debug("START - " + startDate.toISOString());
couchtransform.execute(config, function(err, data) {
	var endDate = new Date();
	var diff = Math.abs(startDate - endDate);
	if (err) {
		debug("END - " + endDate.toISOString() + ", duration " + diff + "ms");
		debug("ERROR: transform failed", err);
	} else {
		debug("END - " + endDate.toISOString() + ", duration " + diff + "ms");
		debug("Transform successful");
	}
});

