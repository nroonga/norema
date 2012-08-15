var http = require('http');
var express = require('express');
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
function search(query, callback) {
  var url = 'http://' + searchNode + '/2011-02-01/search?size=100&facet=path&q=' + encodeURIComponent(query);
  var buffer = '';
  var request = http.get(url, function(response) {
    if (response.statusCode !== 200) {
      var error = new Error('Search server returned ' + response.statusCode);
      error.query = query;
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

// routings
app.get('/', function(request, response){
  return response.render('index.jade', {query: ''});
});

app.get('/search', function(request, response, next) {
  var query = request.query.query;

  console.log('QUERY <' + query + '>');
  search(query, function(error, results) {
    if (error) {
      return next(error);
    }
    var locals = {
      query: query,
      records: results.hits.hit,
      num_found: results.hits.found,
      path_facets: results.facets.path.constraints,
      from: results.hits.start + 1,
      to: results.hits.start + results.hits.hit.length,
      num_showing: results.hits.hit.length
    };

    return response.render('search.jade', locals);
  });
});

console.log('Search node is ' + searchNode);
console.log('norema listening at ' + port);
server.listen(port);
