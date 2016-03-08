# CouchTransform

## Introduction



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

Define the name of the CouchDB database to write to by setting the "COUCH_DATABSE" environment variable e.g.

```
  export COUCH_DATABASE="mydatabase"
```

### The name of the database view - default nothing

Define the name of the CouchDB database view to use by setting the "COUCH_VIEW" environment variable e.g.

```
  export COUCH_VIEW="myview"
```

### The database view parameters - default nothing

Define the CouchDB database view parameters to use by setting the "COUCH_VIEW_PARAMS" environment variable e.g.

```
  export COUCH_VIEW_PARAMS_="{\"reduce\":false,\"include_docs\":true,\"startkey\":\"starting key\",\"endkey\":\"ending key\"}"
```

The parameters need to follow the standard guidelines for CouchDB views 
https://wiki.apache.org/couchdb/HTTP_view_API

### Transformation function - default nothing

Define the path of a file containing a transformation function e.g. 

```
  export COUCH_TRANSFORM="/home/myuser/transform.js"
```

The file should: 
* be a javascript file 
* export one function that takes a single doc and returns the transformed version synchronously

(see examples directory). N.B it's best to use full paths for the transform function.



## Running



## Output



## Environment variables

* COUCH_URL - the url of the CouchDB instance (required, or to be supplied on the command line)
* COUCH_DATABASE - the database to deal with (required, or to be supplied on the command line)
* COUCH_DESIGN - the database design document (optional)
* COUCH_VIEW - the database view to filter documents by (optional, if no view is specified the default is to get all documents for the specified database)
* COUCH_VIEW_PARAMS - the database view parameters (optional)
* COUCH_TRANSFORM - the path of a transformation function (optional)


## Command-line parameters

You can now optionally override the environment variables by passing in command-line parameters:

* --url - the url of the CouchDB instance (required, or to be supplied in the environment)
* --db - the database to deal with (required, or to be supplied in the environment)
* --design - the database design document (optional)
* --view - the database view to filter documents by (optional, if no view is specified the default is to get all documents for the specified database)
* --view_params - the database view params (optional)
* --transform - the path of a transformation function (optional)


e.g.

```
    couchtransform --db joseph --design jasmine --view jeremy
```

## Parallelism

Using the `COUCH_PARALLELISM` environment variable or the `--parallelism` command-line option




