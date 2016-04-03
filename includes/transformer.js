var stream = require("stream");

module.exports = function(func) {
	var transformer = new stream.Transform( { objectMode: true } );

	transformer._transform = function (obj, encoding, done) {
		// transform using custom function
		if(typeof func == "function") {
			obj = func(obj);
		}

		// pass object to next stream handler
		this.push(obj);
		done();
	};

	return transformer;
}