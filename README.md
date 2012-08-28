# norema - Node Reference Manual Search

## About norema

[norema][] is a web service to search [node.js][] documentation.
You can search node [API documentation](http://nodejs.org/api/) with [norema][].

[norema][] can be deployed onto PaaS services, such as heroku.

[norema][] uses [Groonga CloudSearch][], which is an [Amazon CloudSearch][] compatible implementation, as its search back-end.

## About Groonga CloudSearch, the key technology behind norema

[norema][] is also built to be a living sample application of [Groonga CloudSearch][].
The full source code of [norema][] is available on [Github][norema-dev].
You can see how to build and deploy full text search powered web applications, on cloud.
With [Groonga CloudSearch], you can own your private search server with Amazon CloudSearch compatible APIs.

Installing Groonga CloudSearch on Ubuntu box is fairly simple.
You will have working Groonga CloudSearch server in several minutes.


## How norema works?

The search front-end is working on [heroku][], which is built with [express][].
The search back-end is [Groonga CloudSearch][] and running on a VPS.

The search requests from users are processed as follows:

1. A search query is posted to the front-end via web UI.
2. The query is translated into the Amazon CloudSearch style API request. (Some options are added. Pagination and facet selector is also considered.)
3. The request sent to the back-end, [Groonga CloudSearch][].
4. Search is executed.
5. The search result is returned to the front-end as a JSON document.
6. Render the search result and back to the user.

Indexing and configuring Groonga CloudSearch is needed to be done beforehand. It will be described later.


## How to norema

This section describes how to setup [norema][] on your environment step-by-step.

You will be able to deploy your [norema][] copy on the cloud when you finished this section.

### Prerequisites

In this document, we assume that you

* are working on some \*NIX environment, such as Mac OS X and Linux.
* have an Ubuntu 12.04 (Precise Pangolin) box to be a Groonga CloudSearch server which is accessible from [heroku][] (i.e. it has a global IP address and the access is not restricted).
* are familiar with git, github, node.js and heroku.
* have node.js configured on your workstation.
* have heroku account.

### Back-end

#### Setup Groonga CloudSearch on a VPS

First of all, add [groonga][]'s apt repository on your system, which provides Groonga CloudSearch packages.

Note: In this document, the prompt of Groonga CloudSearch server will be omitted so as to be copy and paste friendly.
When you need to run some commands on your workstation, the prompt will be written explicitly as 'workstation$'.

Edit `/etc/apt.sources.d/groonga.list`:

    sudo vi /etc/apt/sources.list.d/groonga.list

Write the file as follows:

    deb http://packages.groonga.org/ubuntu/ precise universe
    deb-src http://packages.groonga.org/ubuntu/ precise universe

Then, install GPG keys:

    sudo apt-get update
    sudo apt-get -y --allow-unauthenticated install groonga-keyring
    sudo apt-get update

Now we're ready to install Groonga CloudSearch. Install `gcs` package:

    sudo apt-get install -y gcs

That's all for the installation.

Check if Groonga Cloud is installed successfully:

    gcs --version

If Groonga CloudSearch server successfully installed, you should see the version of Groonga CloudSearch.

See details in [Install instructions of Groonga CloudSearch](http://gcs.groonga.org/docs/install/#ubuntu).

#### Create and configure norema search domain

In advance of indexing documents, we need to create a `search domain`.

Amazon CloudSearch API groups search target documents.
Each group is searched separately.
The group is called as search domain.
Search domain is corresponding to table in RDBMS.
A search domain has documents like a table in RDBMS has records.

Use `gcs-create-domain` command to create a search domain.
This is the Groonga CloudSearch version of `cs-create-domain` command line utility.

Create search domain whose name is `norema`.
We need to do this as the `gcs` user.

    sudo -u gcs -H gcs-create-domain --domain-name norema

Then, configure index fields.
This defines the schema of the search domain.
See the detail of configuring index fields at [Amazon CloudSearch document](http://docs.amazonwebservices.com/cloudsearch/latest/developerguide/configureindexfields.html).

norema uses the following configurations:

<table>
<tr>
  <th>name</th>
  <th>type</th>
  <th>options</th>
  <th>usage</th>
</tr>

<tr>
  <td>title</td>
  <td>text</td>
  <td>search, result</td>
  <td>The title of the section in plain text.</td>
</tr>

<tr>
  <td>desc</td>
  <td>text</td>
  <td>search, result</td>
  <td>The HTML fragments of the documentation.</td>
</tr>

<tr>
  <td>text</td>
  <td>text</td>
  <td>search, result</td>
  <td>The plain text version of desc. Used for search.</td>
</tr>

<tr>
  <td>path</td>
  <td>literal</td>
  <td>search, result</td>
  <td>The path to the document. Used to show breadcrumbs on search result.</td>
</tr>

<tr>
  <td>path_facet</td>
  <td>literal</td>
  <td>facet</td>
  <td>The path to the document. Contains same data as path, but used for faceting.</td>
</tr>

<tr>
  <td>type</td>
  <td>literal</td>
  <td>result</td>
  <td>The type of the section.</td>
</tr>

<tr>
  <td>index</td>
  <td>uint</td>
  <td>search, result</td>
  <td>The appearing order of the section in the entire documents.</td>
</tr>
</table>

In order to apply the configuration, you need run the following commands:

    sudo -u gcs -H gcs-configure-fields --domain-name norema --name title --type text --option result
    sudo -u gcs -H gcs-configure-fields --domain-name norema --name desc --type text --option result
    sudo -u gcs -H gcs-configure-fields --domain-name norema --name text --type text --option result
    sudo -u gcs -H gcs-configure-fields --domain-name norema --name path --type literal --option result
    sudo -u gcs -H gcs-configure-fields --domain-name norema --name path --type literal --option search
    sudo -u gcs -H gcs-configure-fields --domain-name norema --name path_facet --type literal --option facet
    sudo -u gcs -H gcs-configure-fields --domain-name norema --name type --type literal --option result
    sudo -u gcs -H gcs-configure-fields --domain-name norema --name index --type uint

You can check the domain configuration by `gcs-describe-domain` command.

    sudo -u gcs -H gcs-describe-domain

You will see something like this if the configuration is done correctly:

    === Domain Summary ===
    Domain Name: norema
    Document Service endpoint: doc-norema-xxxxxxxxxxxxxxxxxxxxxxxxxx.127.0.0.1.xip.io:7575
    Search Service endpoint: search-norema-xxxxxxxxxxxxxxxxxxxxxxxxxx.127.0.0.1.xip.io:7575
    SearchInstanceType: null
    SearchPartitionCount: 0
    SearchInstanceCount: 0
    Searchable Documents: 0
    Current configuration changes require a call to IndexDocuments: No
    
    === Domain Configuration ===
    
    Fields:
    =======
    desc Active text (Search Result)
    index Active uint (Search Result)
    path Active literal (Search Result)
    path_facet Active literal (Facet)
    text Active text (Search Result)
    title Active text (Search Result)
    type Active literal (Result)
    ======================
    *Note: the hostname and the port number is detected from the default options. If you run the service with your favorite host name and port number, then use it instead of default information.


#### Index documents

Here, we are ready to index the documents.
The documents should be written in SDF format to index.
See details about SDF in the section [Creating SDF Batches in Amazon CloudSearch](http://docs.amazonwebservices.com/cloudsearch/latest/developerguide/creatingsdf.html) of the Amazon CloudSearch Developer Guide.

[Node.js][] provides its document in JSON format.
We convert it into the SDF (SDF is also written as JSON. A bit confusing...).

The converter is bundled with [norema][norema-dev]. Let's clone `norema` project on your workstation.

    workstation$ git clone git://github.com/nroonga/norema.git

Directory `norema` will be created. Enter the directory:

    workstation$ cd norema


Then, install the packages required for norema by using `npm` command:

    workstation$ npm install

Fetch Node.js documentation (of JSON version):

    workstation$ wget http://nodejs.org/docs/latest/api/all.json

Convert into SDF:

    workstation$ ./tools/convert.js

Now you have `all.sdf.json`.
Copy it onto your Groonga CloudSearch server by `scp` (or anything you like):

    workstation$ scp all.sdf.json [your Groonga CloudSearch Server]:

And index it on the Groonga CloudSearch server (Note that you must run as user `gcs`):

    sudo -u gcs -H gcs-post-sdf --domain-name norema --source all.sdf.json

If indexed successfully, you will see something like this:

    Processing: /home/dara/all.sdf.json
    Detected source format for all.sdf.json as json
    Status: success
    Added: 892
    Deleted: 0

Now we are ready to search the documents.


#### Test the search by hand

Before proceeding on the frontend configuration, let us confirm the index works correctly by issuing search request by `curl` command.

In order to issue the request, we have to know the `endpoints` of the search domain.

We can have `endpoint` addresses by using `gcs-describe-domain` command on the Groonga CloudSeach server.

    sudo -u gcs -H gcs-describe-domain

`Document Service endpoint` and `Search Service endpoint` are unique endpoints for the domain.

These endpoints should be like the followings, where `domain-id` is a random string:

    Document Service endpoint: doc-norema-[domain-id].127.0.0.1.xip.io:7575
    Search Service endpoint: search-norema-[domain-id].127.0.0.1.xip.io:7575

These addresses are using [xip.io][http://xip.io], which provides wildcard DNS, and directed to the `localhost` (`127.0.0.1`).

In order to issue request to the endpoints from the other machines,
you need replace `127.0.0.1` with the globally accessible IP address of the server.

For example, when the IP address of your Groonga CloudSearch server `192.0.2.1`,
globally accessible endpoints are the followings:

    Document Service endpoint: doc-norema-[domain-id].192.0.2.1.xip.io:7575
    Search Service endpoint: search-norema-[domain-id].192.0.2.1.xip.io:7575

The URL to search `console` from the `norema` domain is `http://search-norema-[domain-id].[gcs-server-ip].xip.io:7575/2011-02-01/search?q=console`.

You can obtain the result by issuing GET request to the URL (Note that you need to replace `192.0.2.1` with your Groonga CloudSearch server's IP):

    curl "http://search-norema-[domain-id].192.0.2.1.xip.io:7575/2011-02-01/search?q=console"

The response will be like this:

    {"rank":"-text_relevance","match-expr":"(label 'console')","hits":{"found":172,"start":0,"hit":[{"id":"doc_3"},{"id":"doc_10"},{"id":"doc_11"},{"id":"doc_12"},{"id":"doc_13"},{"id":"doc_14"},{"id":"doc_17"},{"id":"doc_21"},{"id":"doc_22"},{"id":"doc_23"}]},"info":{"rid":"000000000000000000000000000000000000000000000000000000000000000","time-ms":19,"cpu-time-ms":0}}

Now your search back-end is fully configured. Move on the front-end.

### Front-end

#### Try norema front-end locally

Work on your workstation, in `norema` directory, which is the directory `norema` project cloned.

You can run norema app locally by the followings:

    workstation$ env SEARCH_ENDPOINT=search-norema-[domain-id].[gcs-server-ip].xip.io:7575 nom start

Now norema server will listen at the port `3000`.

You will see norema server working on `http://localhost:3000/` with your browser.
Try it.


#### Deploy to heroku

Then, let's deploy the front-end onto the cloud.
You need to have working heroku configuration to proceed.

Create heroku project:

    workstation$ heroku create

Configure search endpoint:

    workstation$ heroku config:add SEARCH_ENDPOINT=search-norema-[domain-id].[gcs-server-ip].xip.io:7575

And deploy the code:

    workstation$ git push heroku master

That's all! Try on your browser:

    workstation$ heroku open


## Conclusion

norema is a web service to search [Node.js][] documents.
It is build on the top of [Groonga CloudSearch][] and running in the cloud.
The installation of norema is explained step by step.
You can learn how [Groonga CloudSearch][] applications is built.

  [node.js]: http://nodejs.org/
  [Groonga CloudSearch]: http://gcs.github.com/
  [Amazon CloudSearch]: http://aws.amazon.com/en/cloudsearch/
  [heroku]: http://www.heroku.com/
  [Node.js]: http://nodejs.org/
  [norema]: http://norema.herokuapp.com/
  [norema-dev]: https://github.com/nroonga/norema
  [express.js]: http://expressjs.com/
  [Groonga CloudSearch]: http://gcs.groonga.org/
