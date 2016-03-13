var debug = require('debug')('couchtransform'),
	async = require('async'),
	fs = require('fs'),
	stream = require('stream'),
	JSONStream = require('JSONStream'),
	format = require('format-json-stream'),
	defaults = require('./includes/defaults.js');

/*
 * Transform the documents and save
 */
function transform(opts, data, callback) {
	var transformer = require('./includes/transformer.js')(opts.COUCH_TRANSFORM_OBJ);

	var rs = new stream.Readable();
	rs.push(JSON.stringify(data));
	rs.push(null);

	try {
		var writer;
		var output;
		if (opts.OUTPUT_FILE) {
			writer = fs.createWriteStream(opts.OUTPUT_FILE);
			output = "output file " + opts.OUTPUT_FILE;
			rs.pipe(JSONStream.parse('rows.*.doc'))
				.pipe(transformer)
				.pipe(JSONStream.stringify())
				.pipe(format())
				.pipe(writer);

			writer.on('finish', function() {
				debug("Completed writing to " + output);
				callback(null);
			});
		} else if (opts.COUCH_DEST_URL && opts.COUCH_DEST_DATABASE) {
			writer = require('./includes/writer.js')(opts.COUCH_DEST_URL, opts.COUCH_DEST_DATABASE, opts.COUCH_BUFFER_SIZE, opts.COUCH_PARALLELISM);
			output = "database " + opts.COUCH_DEST_DATABASE;
			rs.pipe(JSONStream.parse('rows.*.doc'))
				.pipe(transformer)
				.pipe(writer);
		} else {
			writer = require('./includes/writer.js')(opts.COUCH_URL, opts.COUCH_DATABASE, opts.COUCH_BUFFER_SIZE, opts.COUCH_PARALLELISM);
			output = "database " + opts.COUCH_DATABASE;
			rs.pipe(JSONStream.parse('rows.*.doc'))
				.pipe(transformer)
				.pipe(writer);
		}

		writer.on('written', function(data) {
			debug("Wrote " + data.documents + " (" + data.total + ") documents");
		});

		writer.on('writecomplete', function() {
			debug("Completed writing to " + output);
			callback(null);
		});

		writer.on('writeerror', function(err) {
			callback(err);
		});
	} catch(e) {
		callback(e);
	}
}

/*
 * Execute transformation on documents
 */
var execute = function(opts, callback) {
	opts = defaults.merge(opts);

	var cloudant = require("cloudant")(opts.COUCH_URL);
	var db = cloudant.use(opts.COUCH_DATABASE);

	if (opts.COUCH_DESIGN && opts.COUCH_VIEW) {
		db.view(opts.COUCH_DESIGN, opts.COUCH_VIEW, JSON.parse(opts.COUCH_VIEW_PARAMS), function(err, result) {
			if (err) return callback(err);
			transform(opts, result, function(err, result) {
				if (err) return callback(err);
				callback(null);
			});
		});
	} else {
		db.list(function(err, result) {
			if (err) return callback(err);
			transform(opts, result, function(err, result) {
				if (err) return callback(err);
				callback(null);
			});
		});
	}
};

module.exports = {
	execute: execute
};
