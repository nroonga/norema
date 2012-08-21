var http = require('http');
var express = require('express');
var querystring = require('querystring');
var app = express();
var env = process.env;
var port = env.PORT ? parseInt(env.PORT, 10) : 3000;
var server = http.createServer(app);
var searchNode = env.SEARCH_ENDPOINT;

if (!searchNode) {
  console.error("Environment variable 'SEARCH_ENDPOINT' is not defined.");
  console.error("Example: ");
  console.error("(for development)");
  console.error("    env SEARCH_ENDPOINT=search-norema-00000000000000000000000000.127.0.0.1.xip.io:7575 npm start");
  console.error("(for heroku)");
  console.error("    heroku config:add SEARCH_ENDPOINT=search-norema-00000000000000000000000000.127.0.0.1.xip.io:7575");
  console.error("(for nodejitsu)");
  console.error("    jitsu env set SEARCH_ENDPOINT search-norema-00000000000000000000000000.127.0.0.1.xip.io:7575");
  process.exit(1);
}
// configuration
app.set('views', __dirname + '/../views');
app.use(express.static(__dirname + '/../public'));
app.use(app.router);

app.use(function(error, request, response, next){
  response.status(error.status || 500);
  response.render('error.jade', {message: error.message, query: error.query});
});

// helpers
function search(options, callback) {
  var searchOptions = {
    size: options.size,
    facet: 'path',
    q: options.query,
    start: options.start
  }

  var url = 'http://' + searchNode + '/2011-02-01/search?' + querystring.stringify(searchOptions);
  console.log(url);
  var buffer = '';
  var request = http.get(url, function(response) {
    if (response.statusCode !== 200) {
      var error = new Error('Search server returned ' + response.statusCode);
      error.query = options.query;
      return callback(error);
    }

    response.on('data', function(chunk) {
      buffer += chunk;
    });

    response.on('end', function() {
      var results = JSON.parse(buffer);
      return callback(null, results);
    });
  });

  request.on('error', function(error) {
    return callback(error);
  });

  request.end();
}

function titleToId(title) {
  return title
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function urlForSearch(options) {
  return "/search?"+querystring.stringify(options);
}

// routings
app.get('/', function(request, response){
  return response.render('index.jade', {query: ''});
});

app.get('/search', function(request, response, next) {
  var options = {
    query: request.query.query,
    start: parseInt((request.query.start || '0'), 10),
    size: 100
  };

  console.log('SEARCH', options);
  search(options, function(error, results) {
    if (error) {
      return next(error);
    }
    var numFound = results.hits.found;
    var numReturned = results.hits.hit.length;
    var start = results.hits.start;
    var nextStart = start + options.size;
    var previousStart = start - options.size;
    var nextLink = previousLink = null;

    if (nextStart < numFound) {
      nextLink = urlForSearch({
        query: options.query,
        start: nextStart
      });
    }
    if (previousStart >= 0) {
      previousLink = urlForSearch({
        query: options.query,
        start: previousStart
      });
    }

    var locals = {
      urlForSearch: urlForSearch,
      titleToId: titleToId,
      query: options.query,
      records: results.hits.hit,
      numFound: numFound,
      pathFacets: results.facets.path.constraints,
      from: start + 1,
      to: start + numReturned,
      numShowing: numReturned,
      nextLink: nextLink,
      previousLink: previousLink
    };

    return response.render('search.jade', locals);
  });
});

console.log('Search node is ' + searchNode);
console.log('norema listening at ' + port);
server.listen(port);
