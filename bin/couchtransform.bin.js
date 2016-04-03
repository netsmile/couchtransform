#!/usr/bin/env node

process.env.DEBUG = (process.env.DEBUG) ? process.env.DEBUG + ",couchtransform" : "couchtransform";

var debug = require("debug")("couchtransform"),
	couchtransform = require("../app.js"),
	config = require("../includes/config.js");

couchtransform.execute(config, function(err, data) {
	if (err) return debug("ERROR: transform failed", err);
	debug("Transform successful");
});

