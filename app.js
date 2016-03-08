var debug = require('debug')('couchtransform'),
	async = require('async'),
	defaults = require('./includes/defaults.js');

function initDBConnection(dbURL, db) {
	var cloudant = require("cloudant")(dbURL);
	var db = cloudant.use(db);

	return db;
}

/*
 * Transform documents
 */
var transform = function(opts, callback) {
	opts = defaults.merge(opts);
	//debug(opts);

	var db = initDBConnection(opts.COUCH_URL, opts.COUCH_DATABASE);

	if (opts.COUCH_DESIGN && opts.COUCH_VIEW) {
		debug(JSON.stringify(JSON.parse(opts.COUCH_VIEW_PARAMS), null, '  '));
		db.view(opts.COUCH_DESIGN, opts.COUCH_VIEW, JSON.parse(opts.COUCH_VIEW_PARAMS), function(err, result) {
			if (err) return callback(err);
			callback(null, result);
		});
	} else {
		db.list(function(err, result) {
			if (err) return callback(err);
			callback(null, result);
		});
	}
};

module.exports = {
	transform: transform
};
