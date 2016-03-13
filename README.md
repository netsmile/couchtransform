# CouchTransform

## Introduction

When working with CouchDB there are situations where we want to transform a large set of documents. For example:
* add new fields
* modify existing fields
* delete old fields
* merge data from another source
 
CouchTransform is here to help with these situations. CouchTransform provides a command-line interface and performs the following:
* Read from a CouchDB database view for the documents to process, view output must have the structure rows.*.doc
* Use a custom transform function to modify each document
* Write to:
  * a file for review
  * the same CouchDB to create new versions of the documents
  * a separate destination CouchDB to create new documents

## Installation

Requirements
* node.js
* npm

```
  sudo npm install -g couchtransform
```

## Configuration

CouchTransform's configuration parameters are stored in environment variables.

### The location of CouchDB - default "http://localhost:5984"

Simply set the "COUCH_URL" environment variable e.g. for a hosted Cloudant database

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

### The output file - default nothing

Define the path to a file to write to e.g.

```
  export OUTPUT_FILE="./home/myuser/output.json"
```

## Running

Configure the options and then execute CouchTransform from the command-line. If no OUTPUT_FILE or COUCH_DEST_URL/COUCH_DEST_DB are specified CouchTransform will try to write directly back to the same CouchDB database that it read from.

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
 "OUTPUT_FILE": null,
 "COUCH_DEST_URL": null,
 "COUCH_DEST_DATABASE": null,
 "COUCH_BUFFER_SIZE": 500,
 "COUCH_PARALLELISM": 1
} +2ms
  couchtransform ******************** +0ms
  couchtransform Wrote 500 (500) documents +2s
  couchtransform Wrote 500 (1000) documents +1s
  couchtransform Wrote 183 (1183) documents +895ms
  couchtransform Completed writing to database mydatabase +79ms
  couchtransform Transform successful +0ms
```

## Environment variables

* COUCH_URL - the url of the CouchDB instance (required, or to be supplied on the command line)
* COUCH_DATABASE - the CouchDB database to read from (required, or to be supplied on the command line)
* COUCH_DESIGN - the database design document (optional)
* COUCH_VIEW - the database view to filter documents by (optional, if no view is specified the default is to read all documents from the specified database)
* COUCH_VIEW_PARAMS - the database view query parameters (optional, default will set "include_docs:true")
* COUCH_TRANSFORM - the path of the custom transformation function (optional)
* OUTPUT_FILE - the path to the output file (optional)
* COUCH_DEST_URL - the url of an optional CouchDB instance to write to (optional)
* COUCH_DEST_DATABASE - the optional CouchDB database to write to (optional)

## Command-line parameters

You can now optionally override the environment variables by passing in command-line parameters:

* --url - the url of the CouchDB instance (required, or to be supplied on the command line)
* --db - the CouchDB database to read from (required, or to be supplied on the command line)
* --design - the database design document (optional)
* --view - the database view to filter documents by (optional, if no view is specified the default is to read all documents from the specified database)
* --view_params - the database view query parameters (optional, default will set "include_docs:true")
* --transform - the path of the custom transformation function (optional)
* --output_file - the path to the output file (optional)
* --dest_url - the url of an optional CouchDB instance to write to (optional)
* --dest_db - the optional CouchDB database to write to (optional)

e.g.

```
    couchtransform --db joseph --design jasmine --view jeremy --transform ./examples/transform.js
```






