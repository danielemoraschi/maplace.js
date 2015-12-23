/*
 * grunt-string-replace
 * https://github.com/eruizdechavez/grunt-string-replace
 *
 * Copyright (c) 2015 Erick Ruiz de Chavez
 * Licensed under the MIT license.
 */

var grunt = require('grunt'),
  string_replace = require('../tasks/lib/string-replace').init(grunt);

var Replacement = function(pattern, replacement) {
    return {
      pattern: pattern || '',
      replacement: replacement || ''
    };
  };

exports['string-replace'] = {
  'normalize_replacements': function(test) {
    test.expect(2);

    var replacements = [], i = 0;

    for (; i < 10; i++) {
      replacements.push(new Replacement());
    }

    var normalized = string_replace.normalize_replacements(replacements);
    test.equal(Array.isArray(normalized), true, 'normalized should be an array');

    var total = normalized.reduce(function(subtotal, item) {
      return subtotal + item.length;
    }, 0);
    test.equal(total, 20, 'normalized should have n * 2 items');

    test.done();
  },

  'multi_str_replace': function(test) {
    test.expect(1);
    test.equal(string_replace.multi_str_replace('ASDF QWER', [
      ['ASDF', 'Hello'],
      [/qwer/i, 'World']
    ]), 'Hello World', 'should replace a set of replacements');
    test.done();
  },

  'replace single file': function(test) {
    test.expect(1);

    var expected = grunt.file.read('test/fixtures/bar.txt'),
      actual = grunt.file.read('tmp/foo.txt');

    test.equal(actual, expected, 'should execute replacements and save a new file');
    test.done();
  },

  'replace multi, same path': function(test) {
    test.expect(2);

    var expected = grunt.file.read('test/fixtures/bar.txt'),
      actual1 = grunt.file.read('tmp/foo/1.txt'),
      actual2 = grunt.file.read('tmp/foo/2.txt');

    test.equal(actual1, expected, 'should execute replacements and replace src (1)');
    test.equal(actual2, expected, 'should execute replacements and replace src (2)');
    test.done();
  },

  'replace multi, diff path': function(test) {
    test.expect(2);

    var expected = grunt.file.read('test/fixtures/bar.txt'),
      actual1 = grunt.file.read('tmp_baz/tmp/bar/1.txt'),
      actual2 = grunt.file.read('tmp_baz/tmp/bar/2.txt');

    test.equal(actual1, expected, 'should execute replacements and save the file the new path (follows dest as base path and src as file path/name');
    test.equal(actual2, expected, 'should execute replacements and save the file the new path (follows dest as base path and src as file path/name');
    test.done();
  }
};
