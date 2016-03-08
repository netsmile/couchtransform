var defaults = {
	COUCH_URL: "http://localhost:5984",
	COUCH_DATABASE: "test",
	COUCH_DESIGN: null,
	COUCH_VIEW: null,
	COUCH_VIEW_PARAMS: null,
	COUCH_TRANSFORM: null,
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

