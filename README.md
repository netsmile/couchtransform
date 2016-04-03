# CouchTransform

## Introduction

When working with CouchDB there are situations where we want to transform a large set of documents. For example:
* add new fields
* modify existing fields
* delete old fields
* merge data from another source
 
CouchTransform is here to help with these situations. CouchTransform provides a command-line interface and performs the following:
* Read from a CouchDB database view for the documents to process; the view output must have the structure rows.*.doc
* Page through the documents to process
* Use a custom transform function to modify each document
* Write to:
  * a file for review
  * the same CouchDB to create new versions of the documents
  * a separate destination CouchDB to create new documents

## Installation

Requirements
* node.js
* npm

### Using NPM to install as a global command

```
  sudo npm install -g couchtransform
```

## Configuration - Core

These configurations setup the core behavior for CouchTransform.

### The location of the CouchDB instance - default "http://localhost:5984"

Define the location of the CouchDB instance by setting the "COUCH_URL" environment variable e.g. for a hosted Cloudant instance

```
  export COUCH_URL="https://myusername:myPassw0rd@myhost.cloudant.com"
```
or a local CouchDB installation:

```
  export COUCH_URL="http://localhost:5984"
```

### The name of the database - default "test"

Define the name of the CouchDB database to read from by setting the "COUCH_DATABSE" environment variable e.g.

```
  export COUCH_DATABASE="mydatabase"
```

### The name of the database design document - default nothing

Define the name of the CouchDB database design document to use by setting the "COUCH_DESIGN" environment variable e.g.

```
  export COUCH_DESIGN="mydesign"
```

### The name of the database view - default nothing

Define the name of the CouchDB database view to use by setting the "COUCH_VIEW" environment variable e.g.

```
  export COUCH_VIEW="myview"
```

If no database view is specified, all documents from the specified database will be processed using the default view

```
https://couchdburl/databasename/_all_docs?include_docs=true
```

### The database view query parameters - default "{\"include_docs\":true}"

Define the CouchDB database view parameters to use by setting the "COUCH_VIEW_PARAMS" environment variable e.g.

```
  export COUCH_VIEW_PARAMS_="{\"reduce\":false,\"include_docs\":true,\"startkey\":\"starting key\",\"endkey\":\"ending key\"}"
```

The parameters need to follow the standard guidelines for CouchDB views 
https://wiki.apache.org/couchdb/HTTP_view_API

### The custom transformation function - default nothing

Define the path of a file containing a transformation function e.g. 

```
  export COUCH_TRANSFORM="/home/myuser/transform.js"
```

The file should: 
* be a javascript file 
* export one function that takes a single doc and returns the transformed version synchronously

## Configuration - Destination Database

These alternative configurations will set a destination CouchDB database to write to.

### The location of the destination CouchDB instance - default nothing

Define the destination CouchDB instance by setting the "COUCH_DEST_URL" environment variable e.g. for a hosted Cloudant instance

```
  export COUCH_DEST_URL="https://myusername:myPassw0rd@myhost.cloudant.com"
```
or a local CouchDB installation:

```
  export COUCH_URL="http://localhost:5984"
```

### The name of the destination database - default nothing

Define the name of the destination CouchDB database to write to by setting the "COUCH_DEST_DATABSE" environment variable e.g.

```
  export COUCH_DEST_DATABSE="mydatabase"
```

## Configuration - Input and Output Files

These alternative configurations will change where CouchTransform reads data from or writes data to.

### An output file - default nothing

Define the path to a file to write to e.g.

```
  export OUTPUT_FILE="./home/myuser/output.json"
```

Using this option will prevent CouchTransform from saving data back to the database. The output file will be written to in an append mode, so please clear the file out before running CouchTransform to get a clean run. Also when writing to the output file the parallelism will automatically be set to 1 to prevent concurrency errors.

### An input file - default nothing

Define the path to an input file to read from e.g.

```
  export INPUT_FILE_="./home/myuser/input.json"
```

The input file will take precedence over reading from the specified CouchDB database view. The input file must be a JSON file with a structure similar to the output of a CouchDB database view e.g.

```
{
	"total_rows": 4862,
	"offset": 0,
	"rows": [{
		"id": "8b50b1a751f047f4a550b8957ec63652",
		"key": "2015-11-25T02:59:42.000Z",
		"value": 1,
		"doc": {
			"_id": "8b50b1a751f047f4a550b8957ec63652",
			"_rev": "6-7c42933c2a06f93e785ce277bcd79670",
			"field": "value"
	    }
	}]
}
```

## Configuration - Performance Tuning

These optional configurations will change the performance characteristics of CouchTransform.

### The page size - default 1000

Define the page size to use when reading documents from the CouchDB database by setting the "COUCH_PAGE_SIZE" environment variable e.g. 

```
  export COUCH_PAGE_SIZE=1000
```

### The buffer size - default 500

Define the buffer size to use when writing documents to the CouchDB database by setting the "COUCH_BUFFER_SIZE" environment variable e.g.
```
  export COUCH_BUFFER_SIZE=500
```

### The parallelism setting - default 1

Define the parallelism setting that controls how many concurrent processes will be executed when writing documents to the CouchDB database by setting the "COUCH_PARALLELISM" environment variable e.g.
```
  export COUCH_PARALLELISM=1
```

## Running

Configure the options and then execute CouchTransform from the command-line. If no OUTPUT_FILE or COUCH_DEST_URL/COUCH_DEST_DB are specified CouchTransform will try to write directly back to the same CouchDB database that it read from.

### Global command

```
  couchtransform
```

## Output

```
  couchtransform ******************** +0ms
  couchtransform configuration +2ms
  couchtransform {
 "COUCH_URL": "https://****:****@myinstance.cloudant.com",
 "COUCH_DATABASE": "mydatabase",
 "COUCH_DESIGN": "mydesign",
 "COUCH_VIEW": "myview",
 "COUCH_VIEW_PARAMS": "{\"include_docs\":true}",
 "COUCH_TRANSFORM": "/Users/myuser/github/couchtransform/examples/transform.js",
 "INPUT_FILE": null,
 "OUTPUT_FILE": null,
 "COUCH_DEST_URL": null,
 "COUCH_DEST_DATABASE": null,
 "COUCH_PAGE_SIZE": 1000,
 "COUCH_BUFFER_SIZE": 500,
 "COUCH_PARALLELISM": 1
} +2ms
  couchtransform ******************** +0ms
  couchtransform Reading docs from myview +162ms
  couchtransform Total docs to process 1863 +190ms
  couchtransform Starting row 0 +0ms
  couchtransform [Page offset 0] - docs to process 1000 +322ms
  couchtransform [Page offset 0] - Wrote 500 (500) documents +1s
  couchtransform [Page offset 0] - Wrote 500 (1000) documents +998ms
  couchtransform [Page offset 0] - Wrote 0 (1000) documents +75ms
  couchtransform [Page offset 0] - Completed writing to database mydatabase +93ms
  couchtransform [Page offset 4000] - docs to process 863 +2s
  couchtransform [Page offset 4000] - Wrote 500 (500) documents +1s
  couchtransform [Page offset 4000] - Wrote 363 (863) documents +659ms
  couchtransform [Page offset 4000] - Completed writing to database mydatabase +43ms
  couchtransform Transform successful +0ms
```

## Environment variables

* COUCH_URL - the url of the CouchDB instance (required, or to be supplied on the command line)
* COUCH_DATABASE - the CouchDB database to read from (required, or to be supplied on the command line)
* COUCH_DESIGN - the database design document (optional)
* COUCH_VIEW - the database view to filter documents by (optional, if no view is specified the default is to read all documents from the specified database)
* COUCH_VIEW_PARAMS - the database view query parameters (optional, default will set "include_docs:true")
* COUCH_TRANSFORM - the path of the custom transformation function (optional)
* INPUT_FILE - the path to the input file (optional)
* OUTPUT_FILE - the path to the output file (optional)
* COUCH_DEST_URL - the url of an optional CouchDB instance to write to (optional)
* COUCH_DEST_DATABASE - the optional CouchDB database to write to (optional)
* COUCH_PAGE_SIZE - the page size to use when reading documents from the CouchDB database (optional)
* COUCH_BUFFER_SIZE - the buffer size to use when writing documents to the CouchDB database (optional)
* COUCH_PARALLELISM - the parallelism setting that controls how many concurrent processes will be executed when writing documents to the CouchDB database (optional)

## Command-line parameters

You can now optionally override the environment variables by passing in command-line parameters:

* --url - the url of the CouchDB instance (required, or to be supplied by setting the environment variable)
* --db - the CouchDB database to read from (required, or to be supplied by setting the environment variable)
* --design - the database design document (optional)
* --view - the database view to filter documents by (optional, if no view is specified the default is to read all documents from the specified database)
* --view_params - the database view query parameters (optional, default will set "include_docs:true")
* --transform - the path of the custom transformation function (optional)
* --input_file - the path to the input file (optional)
* --output_file - the path to the output file (optional)
* --dest_url - the url of an optional CouchDB instance to write to (optional)
* --dest_db - the optional CouchDB database to write to (optional)
* --page - the page size to use when reading documents from the CouchDB database (optional)
* --buffer - the buffer size to use when writing documents to the CouchDB database (optional)
* --parallelism - the parallelism setting that controls how many concurrent processes will be executed when writing documents to the CouchDB database (optional)

e.g.

```
    couchtransform --db joseph --design jasmine --view jeremy --transform ./examples/transform.js
```






