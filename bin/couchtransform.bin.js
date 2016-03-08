#!/usr/bin/env node

process.env.DEBUG = (process.env.DEBUG) ? process.env.DEBUG + ",couchtransform" : "couchtransform";

var debug = require('debug')('couchtransform'),
	couchtransform = require('../app.js'),
	config = require('../includes/config.js');

couchtransform.transform(config, function(err, data) {
	if (err) return debug("Transform failed", err);
	debug(JSON.stringify(data, null, ' '));
	debug("Transform succeeded", err);
});

