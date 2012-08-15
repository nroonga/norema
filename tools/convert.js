#!/usr/bin/env node

var fs = require('fs');
var jsdom = require('jsdom');
var async = require('async');

var json = fs.readFileSync('all.json');
var doc = JSON.parse(json);
var jquery = fs.readFileSync("./jquery-1.7.2.min.js").toString();

function htmlToText(html, callback) {
  jsdom.env({
    html: '<html><body>' + html + '</body></html>',
    src: [jquery],
    done: function(error, window) {
      if (error) {
        return callback(error);
      } else {
        var $ = window.jQuery;
        var text = $('body').text();
        return callback(null, text);
      }
    }
  });
}

function titleToId(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parse(doc, context) {
  var item = {};

  var title = doc.textRaw;
  context = context || {};
  context.items = context.items || [];
  context.path = context.path || [];

  if (title) {
    context.title = title;
  }

  if (doc.desc) {
    item.desc = doc.desc;
    item.title = context.title;
    item.id = titleToId(context.title);
    console.log([item.id, item.title]);
    item.path = context.path.map(function(item) {
      return item.title;
    }).filter(function(title) {
      return title;
    });
    context.items.push(item);
  }

  context.path.push(item);
  for (var type in doc) {
    console.log("TYPE", type);
    if (doc[type] instanceof Array) {
      doc[type].forEach(function(subdoc) {
        parse(subdoc, context);
      });
    }
  }
  context.path.pop(item);

  return context.items;
}

function toSdf(records) {
  var version = (new Date()).getTime();

  return records.map(function(record, index) {
    //console.log(index, record.path, record.title);
    return {
      type: 'add',
      id: 'doc_' + index,
      version: version,
      lang: 'en',
      fields: record
    };
  });
}

// returns record with record.text added, which is scraped from record.desc
function addTextField(record, callback) {
  htmlToText(record.desc, function(error, text) {
    var recordWithText = {};
    for (var field in record) {
      recordWithText[field] = record[field];
    }
    recordWithText.text = text;
    return callback(error, recordWithText);
  });
}

var records = parse(doc);

async.map(records, addTextField, function(error, results) {
    var sdf = toSdf(results);
    var sdfJson = JSON.stringify(sdf);
    fs.writeFileSync('all.json.sdf', sdfJson);
  }
);

