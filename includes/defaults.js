var defaults = {
	COUCH_URL: "http://localhost:5984",
	COUCH_DATABASE: "test",
	COUCH_DESIGN: null,
	COUCH_VIEW: null,
	COUCH_VIEW_PARAMS: "{\"include_docs\":true}",
	COUCH_TRANSFORM: null,
	COUCH_TRANSFORM_OBJ: null,
	INPUT_FILE: null,
	OUTPUT_FILE: null,
	COUCH_DEST_URL: null,
	COUCH_DEST_DATABASE: null,
	COUCH_PAGE_SIZE: 1000,
	COUCH_BUFFER_SIZE: 500,
	COUCH_PARALLELISM: 1
};

var get = function() {
	return JSON.parse(JSON.stringify(defaults));
};

var merge = function(myopts) {
	if(myopts == null) {
		return get();
	}
	for(var i in defaults) {
		if (typeof myopts[i] == "undefined") {
			myopts[i] = defaults[i];
		}
	}
	return myopts;
}

module.exports = {
	get: get,
	merge: merge
};

