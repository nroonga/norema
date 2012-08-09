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

function parse(doc, context) {
  var item = {};

  title = doc.textRaw;
  context = context || {};
  context.items = context.items || [];

  if (title) {
    context.title = title;
  }

  if (doc.desc) {
    item.desc = doc.desc;
    item.title = context.title;
    context.items.push(item);
  }

  for (var section in doc) {
    if (doc[section] instanceof Array) {
      doc[section].forEach(function(subdoc) {
        parse(subdoc, context);
      });
    }
  }

  return context.items;
}

function toSdf(records) {
  var version = (new Date()).getTime();

  return records.map(function(record, index) {
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

