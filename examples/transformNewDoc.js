var x = function(doc) {
	delete doc["_rev"];
	doc.new_field = "something new";

	return doc;
}

module.exports = x;