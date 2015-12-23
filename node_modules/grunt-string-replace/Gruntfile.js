/*
 * grunt-string-replace
 * https://github.com/eruizdechavez/grunt-string-replace
 *
 * Copyright (c) 2015 Erick Ruiz de Chavez
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      },
      lint: ['Gruntfile.js', 'tasks/**/*.js', 'test/**/*.js']
    },

    clean: ['tmp/', 'tmp_baz/'],

    nodeunit: {
      files: ['test/**/*.js']
    },

    watch: {
      files: '<%= jshint.lint %>',
      tasks: ['jshint', 'test']
    },

    copy: {
      fixtures: {
        files: [{
          dest: 'tmp/foo/1.txt',
          src: 'test/fixtures/foo.txt'
        }, {
          dest: 'tmp/foo/2.txt',
          src: 'test/fixtures/foo.txt'
        }, {
          dest: 'tmp/bar/1.txt',
          src: 'test/fixtures/foo.txt'
        }, {
          dest: 'tmp/bar/2.txt',
          src: 'test/fixtures/foo.txt'
        }]
      }
    },

    'string-replace': {
      single_file: {
        files: {
          'tmp/foo.txt': 'test/fixtures/foo.txt',
          'tmp/baz.txt': 'test/fixtures/baz.txt'
        },
        options: {
          replacements: [{
            pattern: '[test:string]',
            replacement: 'replaced!'
          }, {
            pattern: /\[test a:regex \d{3,}\]/,
            replacement: 'replaced!'
          }, {
            pattern: /\[test b:regex \d{3,}\]/g,
            replacement: 'replaced!'
          }, {
            pattern: /\[test c:regex \d{3,}\]/g,
            replacement: 'replaced!'
          }, {
            pattern: /\[test d:regex \d{3,}\]/ig,
            replacement: 'replaced!'
          }]
        }
      },
      mutli_same_path: {
        files: {
          'tmp/foo/': 'tmp/foo/*.txt'
        },
        options: {
          replacements: [{
            pattern: '[test:string]',
            replacement: 'replaced!'
          }, {
            pattern: /\[test a:regex \d{3,}\]/,
            replacement: 'replaced!'
          }, {
            pattern: /\[test b:regex \d{3,}\]/g,
            replacement: 'replaced!'
          }, {
            pattern: /\[test c:regex \d{3,}\]/g,
            replacement: 'replaced!'
          }, {
            pattern: /\[test d:regex \d{3,}\]/ig,
            replacement: 'replaced!'
          }]
        }
      },
      mutli_diff_path: {
        files: {
          'tmp_baz/': 'tmp/bar/*.txt'
        },
        options: {
          replacements: [{
            pattern: '[test:string]',
            replacement: 'replaced!'
          }, {
            pattern: /\[test a:regex \d{3,}\]/,
            replacement: 'replaced!'
          }, {
            pattern: /\[test b:regex \d{3,}\]/g,
            replacement: 'replaced!'
          }, {
            pattern: /\[test c:regex \d{3,}\]/g,
            replacement: 'replaced!'
          }, {
            pattern: /\[test d:regex \d{3,}\]/ig,
            replacement: 'replaced!'
          }]
        }
      }
    }
  });

  // Load nom tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Load local tasks.
  grunt.loadTasks('tasks');

  grunt.registerTask('test', ['clean', 'copy', 'string-replace', 'nodeunit']);
  grunt.registerTask('default', ['jshint', 'test']);
};
