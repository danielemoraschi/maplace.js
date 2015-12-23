module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        'jshint': {
            options: {
                curly: true,
                eqeqeq: true,
                eqnull: true,
                browser: true,
                laxbreak: true,
                '-W030': false,
                globals: {
                    jQuery: true
                },
            },
            src: ['Gruntfile.js', 'src/*.js', 'javascripts/app.js']
        },
        'uglify': {
            my_target: {
                files: {
                    'dist/maplace.min.js': ['dist/maplace.js']
                }
            },
            options: {
                preserveComments: /(?:^!|@(?:license|preserve))/
            }
        },
        'string-replace': {
            version: {
                files: {
                    'dist/maplace.js': ['src/maplace.js']
                },
                options: {
                    replacements: [{
                        pattern: /@VERSION/g,
                        replacement: '<%= pkg.version %>'
                    }]
                }
            },
            versionIndex: {
                files: {
                    './index.html': ['index.tpl']
                },
                options: {
                    replacements: [{
                        pattern: /@VERSION/g,
                        replacement: '<%= pkg.version %>'
                    }]
                }
            }
        },
        'watch': {
            scripts: {
                files: ['**/*.js', 'src/*.js', 'index.tpl', 'javascripts/*.js',
                    'stylesheets/*.css'],
                tasks: ['build'],
                options: {
                    spawn: false,
                    debounceDelay: 250
                },
            },
        },
        pkg: grunt.file.readJSON('package.json')
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Tasks.
    grunt.registerTask('build', ['jshint', 'string-replace:version', 'uglify']);
    grunt.registerTask('web', ['build', 'string-replace:versionIndex']);
    grunt.registerTask('test', ['build']);
};
