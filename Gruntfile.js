'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
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
                    'dist/maplace.js': ['src/maplace.js'],
                    './index.html': ['index.tpl'],
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
                files: ['*.js', 'src/*.js', 'index.tpl', 'javascripts/*.js', 'stylesheets/*.css'],
                tasks: ['default'],
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

    // Build task.
    grunt.registerTask('default', ['string-replace', 'uglify']);
};
