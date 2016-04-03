var debug = require("debug")("couchtransform"),
	async = require("async"),
	fs = require("fs"),
	stream = require("stream"),
	JSONStream = require("JSONStream"),
	format = require("format-json-stream"),
	through = require("through");
	defaults = require("./includes/defaults.js");

/*
 * Transform the documents and save
 */
function transform(opts, data, callback) {
	var transformer = require("./includes/transformer.js")(opts.COUCH_TRANSFORM_OBJ);

	var rs = new stream.Readable();
	rs.push(JSON.stringify(data));
	rs.push(null);

	try {
		var writer;
		var output;
		var offset = data.offset;
		if (opts.OUTPUT_FILE) {
			writer = fs.createWriteStream(opts.OUTPUT_FILE, {flags: "a"});
			writer.write("{\n\"page_offset\": " + offset + ",");
			writer.write("\n\"docs\":\n");
			output = "output file " + opts.OUTPUT_FILE;

			var ending = through(function write(data) {
				this.queue(data);
			}, function end() {
				this.queue("\n},\n");
				debug("Completed writing to " + output);
				callback(null);
			});

			rs.pipe(JSONStream.parse("rows.*.doc"))
				.pipe(transformer)
				.pipe(JSONStream.stringify())
				.pipe(format())
				.pipe(ending)
				.pipe(writer);
		} else if (opts.COUCH_DEST_URL && opts.COUCH_DEST_DATABASE) {
			writer = require("./includes/writer.js")(opts.COUCH_DEST_URL, opts.COUCH_DEST_DATABASE, opts.COUCH_BUFFER_SIZE, opts.COUCH_PARALLELISM);
			output = "database " + opts.COUCH_DEST_DATABASE;
			rs.pipe(JSONStream.parse("rows.*.doc"))
				.pipe(transformer)
				.pipe(writer);
		} else {
			writer = require("./includes/writer.js")(opts.COUCH_URL, opts.COUCH_DATABASE, opts.COUCH_BUFFER_SIZE, opts.COUCH_PARALLELISM);
			output = "database " + opts.COUCH_DATABASE;
			rs.pipe(JSONStream.parse("rows.*.doc"))
				.pipe(transformer)
				.pipe(writer);
		}

		writer.on("written", function(data) {
			debug("[Page offset " + offset + "] - Wrote " + data.documents + " (" + data.total + ") documents");
		});

		writer.on("writecomplete", function() {
			debug("[Page offset " + offset + "] - Completed writing to " + output);
			callback(null);
		});

		writer.on("writeerror", function(err) {
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

	if (opts.INPUT_FILE) {
		var inputFile = require(opts.INPUT_FILE);
		transform(opts, inputFile, function(err, result) {
			if (err) return callback(err);
			callback(null);
		});
	} else if (opts.COUCH_DESIGN && opts.COUCH_VIEW) {
		var params = {limit: 1};
		debug("Reading docs from view " + "_design/" + opts.COUCH_DESIGN + "/_view/" + opts.COUCH_VIEW);
		db.view(opts.COUCH_DESIGN, opts.COUCH_VIEW, params, function(err, result) {
			if (err) return callback(err);
			var totalRows = result.total_rows;
			var start = 0;
			var viewParams = JSON.parse(opts.COUCH_VIEW_PARAMS);
			if (viewParams.limit) {
				totalRows = viewParams.limit;
			}
			if (viewParams.skip) {
				totalRows += viewParams.skip;
				start = viewParams.skip;
			}
			debug("Total docs to process " + totalRows);
			debug("Starting row " + start);
			var pages = [];
			var current = start;
			while (current < totalRows) {
				pages.push(current);
				current += opts.COUCH_PAGE_SIZE;
			}
			var parallelism = opts.COUCH_PARALLELISM;
			if (opts.OUTPUT_FILE) {
				parallelism = 1;
			}
			async.forEachLimit(pages, parallelism, function(page, cb) {
				var params = viewParams;
				params.skip = page;
				params.limit = opts.COUCH_PAGE_SIZE;
				db.view(opts.COUCH_DESIGN, opts.COUCH_VIEW, params, function(err, result) {
					if (err) return cb(err);
					debug("[Page offset " + result.offset + "] - docs to process " + result.rows.length);
					transform(opts, result, function(err, result) {
						if (err) return cb(err);
						cb(null);
					});
				});
			}, function(err) {
				if (err) callback(err);
				callback(null);
			});
		});
	} else {
		var params = {limit: 1};
		debug("Reading docs from _all_docs");
		db.list(params, function(err, result) {
			if (err) return callback(err);
			var totalRows = result.total_rows;
			var start = 0;
			var viewParams = JSON.parse(opts.COUCH_VIEW_PARAMS);
			if (viewParams.limit) {
				totalRows = viewParams.limit;
			}
			if (viewParams.skip) {
				totalRows += viewParams.skip;
				start = viewParams.skip;
			}
			debug("Total docs to process " + totalRows);
			debug("Starting row " + start);
			var pages = [];
			var current = start;
			while (current < totalRows) {
				pages.push(current);
				current += opts.COUCH_PAGE_SIZE;
			}
			var parallelism = opts.COUCH_PARALLELISM;
			if (opts.OUTPUT_FILE) {
				parallelism = 1;
			}
			async.forEachLimit(pages, parallelism, function(page, cb) {
				var params = viewParams;
				params.skip = page;
				params.limit = opts.COUCH_PAGE_SIZE;
				db.list(params, function(err, result) {
					if (err) return cb(err);
					debug("[Page offset " + result.offset + "] - docs to process " + result.rows.length);
					transform(opts, result, function(err, result) {
						if (err) return cb(err);
						cb(null);
					});
				});
			}, function(err) {
				if (err) callback(err);
				callback(null);
			});
		});
	}
};

module.exports = {
	execute: execute
};
