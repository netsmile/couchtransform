var x = function(doc) {
	delete doc["new_field"];

	return doc;
}

module.exports = x;