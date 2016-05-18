var debug = require("debug")("couchtransform"),
	async = require("async"),
	fs = require("fs"),
	stream = require("stream"),
	JSONStream = require("JSONStream"),
	format = require("format-json-stream"),
	through = require("through");
	defaults = require("./includes/defaults.js");

var cloudant;
var db;

/*
 * Set pages data based on view
 */
function setPagesData(design, view, viewParams, pageSize, callback) {
	function calculatePages(data) {
		var pagesData = {
			total_rows: 0,
			rows: 0,
			pages: []
		};

		pagesData.total_rows = data.total_rows;
		pagesData.rows = data.rows.length;
		var current = 0;
		var page = 1;
		var limit = pageSize;
		while (current < pagesData.rows) {
			if ((current + pageSize) > pagesData.rows) {
				limit = pagesData.rows - current;
			} else {
				limit = pageSize;
			}
			pagesData.pages.push({
				id: data.rows[current].id,
				key: data.rows[current].key,
				page: page,
				limit: limit
			});
			current += pageSize;
			page++;
		}

		return pagesData;
	}

	var params = viewParams;
	params.include_docs = false;
	if (design && view) {
		db.view(design, view, params, function(err, result) {
			if (err) return callback(err);
			callback(null, calculatePages(result));
		});
	} else {
		db.list(params, function(err, result) {
			if (err) return callback(err);
			callback(null, calculatePages(result));
		});
	}
}

/*
 * Transform the documents and save
 */
function transform(opts, page, data, callback) {
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
			writer.write("{\n\"page\": " + page + ",");
			writer.write("\n\"docs\":\n");
			output = "output file " + opts.OUTPUT_FILE;

			var ending = through(function write(data) {
				this.queue(data);
			}, function end() {
				this.queue("\n},\n");
				debug("[Page " + page + "] - Completed writing to " + output);
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
			debug("[Page " + page + "] - Processed " + data.documents + " (" + data.total + ") documents, successful " + data.success + ", failed " + data.fail);
		});

		writer.on("writecomplete", function() {
			debug("[Page " + page + "] - Completed writing to " + output);
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

	cloudant = require("cloudant")(opts.COUCH_URL);
	db = cloudant.use(opts.COUCH_DATABASE);

	if (opts.INPUT_FILE) {
		var inputFile = require(opts.INPUT_FILE);
		var startDate = new Date();
		debug("Reading docs from input file");
		debug("[Page 1] - BEGIN " + startDate.toISOString());
		debug("[Page 1] - Docs to process " + inputFile.rows.length);
		transform(opts, 1, inputFile, function(err, result) {
			if (err) return callback(err);
			var endDate = new Date();
			var diff = Math.abs(startDate - endDate);
			debug("[Page 1] - END " + endDate.toISOString() + ", duration " + diff + "ms");
			callback(null, result);
		});
	} else if (opts.COUCH_DESIGN && opts.COUCH_VIEW) {
		debug("Reading docs from view " + "_design/" + opts.COUCH_DESIGN + "/_view/" + opts.COUCH_VIEW);
		var params = JSON.parse(opts.COUCH_VIEW_PARAMS);
		if (params.key || params.keys) {
			db.view(opts.COUCH_DESIGN, opts.COUCH_VIEW, params, function(err, result) {
				if (err) return cb(err);
				var startDate = new Date();
				debug("[Page 1] - BEGIN " + startDate.toISOString());
				debug("[Page 1] - Docs to process " + result.rows.length);
				transform(opts, 1, result, function(err, result) {
					if (err) return cb(err);
					var endDate = new Date();
					var diff = Math.abs(startDate - endDate);
					debug("[Page 1] - END " + endDate.toISOString() + ", duration " + diff + "ms");
					cb(null);
				});
			});
		} else {
			setPagesData(opts.COUCH_DESIGN, opts.COUCH_VIEW, params, opts.COUCH_PAGE_SIZE, function(err, pagesData) {
				if (err) return callback(err);
				debug("Total rows " + pagesData.total_rows);
				debug("Rows to process " + pagesData.rows);
				debug("Number of pages " + pagesData.pages.length);
				var parallelism = opts.COUCH_PARALLELISM;
				if (opts.OUTPUT_FILE) {
					parallelism = 1;
				}
				async.forEachLimit(pagesData.pages, parallelism, function(page, cb) {
					var params = JSON.parse(opts.COUCH_VIEW_PARAMS);
					params.startkey_docid = page.id;
					params.startkey = page.key;
					params.limit = page.limit;
					delete params.skip;
					delete params.endkey;
					delete params.endkey_docid;
					db.view(opts.COUCH_DESIGN, opts.COUCH_VIEW, params, function(err, result) {
						if (err) return cb(err);
						var startDate = new Date();
						debug("[Page " + page.page + "] - BEGIN " + startDate.toISOString());
						debug("[Page " + page.page + "] - startkey " + page.key);
						debug("[Page " + page.page + "] - startkey_docid " + page.id);
						debug("[Page " + page.page + "] - Docs to process " + result.rows.length);
						transform(opts, page.page, result, function(err, result) {
							if (err) return cb(err);
							var endDate = new Date();
							var diff = Math.abs(startDate - endDate);
							debug("[Page " + page.page + "] - END " + endDate.toISOString() + ", duration " + diff + "ms");
							cb(null);
						});
					});
				}, function(err) {
					if (err) return callback(err);
					callback(null);
				});
			});
		}
	} else {
		debug("Reading docs from _all_docs");
		var params = JSON.parse(opts.COUCH_VIEW_PARAMS);
		if (params.key || params.keys) {
			db.list(params, function(err, result) {
				if (err) return cb(err);
				var startDate = new Date();
				debug("[Page 1] - BEGIN " + startDate.toISOString());
				debug("[Page 1] - Docs to process " + result.rows.length);
				transform(opts, 1, result, function(err, result) {
					if (err) return cb(err);
					var endDate = new Date();
					var diff = Math.abs(startDate - endDate);
					debug("[Page 1] - END " + endDate.toISOString() + ", duration " + diff + "ms");
					cb(null);
				});
			});
		} else {
			setPagesData(null, null, params, opts.COUCH_PAGE_SIZE, function(err, pagesData) {
				if (err) return callback(err);
				debug("Total rows " + pagesData.total_rows);
				debug("Rows to process " + pagesData.rows);
				debug("Number of pages " + pagesData.pages.length);
				var parallelism = opts.COUCH_PARALLELISM;
				if (opts.OUTPUT_FILE) {
					parallelism = 1;
				}
				async.forEachLimit(pagesData.pages, parallelism, function(page, cb) {
					var params = JSON.parse(opts.COUCH_VIEW_PARAMS);
					params.startkey_docid = page.id;
					params.startkey = page.key;
					params.limit = page.limit;
					delete params.skip;
					delete params.endkey;
					delete params.endkey_docid;
					db.list(params, function(err, result) {
						if (err) return cb(err);
						var startDate = new Date();
						debug("[Page " + page.page + "] - BEGIN " + startDate.toISOString());
						debug("[Page " + page.page + "] - startkey " + page.key);
						debug("[Page " + page.page + "] - startkey_docid " + page.id);
						debug("[Page " + page.page + "] - Docs to process " + result.rows.length);
						transform(opts, page.page, result, function(err, result) {
							if (err) return cb(err);
							var endDate = new Date();
							var diff = Math.abs(startDate - endDate);
							debug("[Page " + page.page + "] - END " + endDate.toISOString() + ", duration " + diff + "ms");
							cb(null);
						});
					});
				}, function(err) {
					if (err) return callback(err);
					callback(null);
				});
			});
		}
	}
};

module.exports = {
	execute: execute
};
