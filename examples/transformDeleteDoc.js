var x = function(doc) {
	// Exclude Couch DB design docs from being deleted
	if (doc._id && doc._id.indexOf("_design") < 0) {
		doc._deleted = true;
	}
	
	return doc;
}

module.exports = x;