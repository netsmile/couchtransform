var async = require('async');

module.exports = function(couch_url, couch_database, buffer_size, parallelism) {

	var stream = require('stream'),
		buffer = [ ],
		written = 0;

	var cloudant = require('cloudant')(couch_url);
	var db = cloudant.db.use(couch_database);

	// process the writes in bulk as a queue
	var q = async.queue(function(payload, cb) {
		db.bulk(payload, function(err, data) {
			if (err) {
				writer.emit("writeerror", err);
			} else {
				var success = 0;
				var fail = 0;
				data.forEach(function(row) {
					if (row.error) fail++;
					else success++;
				});
				written += payload.docs.length;
				writer.emit("written", {
					documents: payload.docs.length,
					total: written,
					success: success,
					fail: fail
				});
			}
			cb();
		});
	}, parallelism);

	// write the contents of the buffer to CouchDB in blocks of 500
	var processBuffer = function(flush, callback) {

		if(flush || buffer.length>= buffer_size) {
			var toSend = buffer.splice(0, buffer.length);
			buffer = [];
			q.push({docs: toSend});

			// wait until the buffer size falls to a reasonable level
			async.until(

				// wait until the queue length drops to twice the paralellism
				// or until empty
				function() {
					if(flush) {
						return q.idle() && q.length() ==0
					} else {
						return q.length() <= parallelism * 2
					}
				},

				function(cb) {
					setTimeout(cb,100);
				},

				function() {
					if (flush) {
						writer.emit("writecomplete", { total: written });
					}
					callback();
				});


		} else {
			callback();
		}
	}

	var writer = new stream.Transform( { objectMode: true } );

	// take an object
	writer._transform = function (obj, encoding, done) {

		// add to the buffer, if it's not an empty object
		if (Object.keys(obj).length>0) {
			buffer.push(obj);
		}

		// optionally write to the buffer
		this.pause();
		processBuffer(false,  function() {
			done();
		});

	};

	// called when we need to flush everything
	writer._flush = function(done) {
		processBuffer(true, function() {
			done();
		});
	};

	return writer;
};
