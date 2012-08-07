#!/usr/bin/env ruby

require 'json'
require 'nokogiri'

doc = JSON.parse(File.read('all.json'))

def parse(doc, depth=0, context={}, &block)
  item = {}
  puts
  puts
  title = doc['textRaw']
  context[:items] ||= []
  if title
    context[:title] = doc['textRaw']
    puts "-" * depth + ' ' + title
    puts " " * depth + " STABILITY: %s (%s)" % [doc['stability'], doc['stabilityText']] if doc['stability']
  end

  item[:desc] = doc['desc']
  item[:title] = context[:title]
  item[:text] = Nokogiri(item[:desc]).text().gsub(/\s+/, ' ').strip
  item[:depth] = depth
  if item[:desc]
    context[:items] << item
  end

  p [:keys, doc.keys]
  doc.each do |key, value|
    if value.is_a?(Array)
      value.each do |item|
        parse(item, depth+1, context, &block)
      end
    end
  end

  context[:items]
end

items = parse(doc)

batch = []
id = 0
version = Time.now.to_i
items.each do |item|
  batch << {
    type: 'add',
    id: 'doc_%d' % id,
    version: version,
    lang: 'en',
    fields: item
  }
  id += 1
end

File.write('node.sdf', batch.to_json)
