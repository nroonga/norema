var http = require('http');
var express = require('express');
var app = express();
var env = process.env;
var port = env.PORT ? parseInt(env.PORT, 10) : 3000;
var server = http.createServer(app);
var searchNode = env.NOREMA_SEARCH_NODE;

if (!searchNode) {
  console.error("Environment variable 'NOREMA_SEARCH_NODE' is not defined.");
  console.error("Example: ");
  console.error("  env NOREMA_SEARCH_NODE=search-norema-00000000000000000000000000.127.0.0.1.xip.io:7575 npm start");
  console.error("or, for nodejitsu deployment,");
  console.error("  jitsu env set NOREMA_SEARCH_NODE search-norema-00000000000000000000000000.127.0.0.1.xip.io:7575");
  process.exit(1);
}
// configuration
app.set('views', __dirname + '/../views');
app.use(express.static(__dirname + '/../public'));

// helpers
function search(query, callback) {
  var url = 'http://' + searchNode + '/2011-02-01/search?q=' + encodeURIComponent(query);
  var buffer = '';
  var request = http.get(url, function(response) {
    if (response.statusCode !== 200) {
      var error = new Error('Search server returned ' + response.statusCode);
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
    return callback(error)
  });

  request.end();
};

// routings
app.get('/', function(request, response){
  var query = request.query.query;
  if (query) {
    console.log('QUERY <' + query + '>');
    search(query, function(error, results) {
      if (error) {
        // FIXME
        return response.send(500, 'ERROR' + error);
      }
      var records = results.hits.hit;

      return response.render('search.jade',
        {records: records, query: query}
      );
    });
  } else {
    return response.render('index.jade',
      {query: ''}
    );
  }
});

console.log('Search node is ' + searchNode);
console.log('norema listening at ' + port);
server.listen(port);
