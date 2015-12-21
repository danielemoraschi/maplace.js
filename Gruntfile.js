'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        'uglify': {
            my_target: {
                files: {
                    'dist/maplace.js': ['src/maplace-versioned.js']
                }
            }
        },
        'string-replace': {
            version: {
                files: {
                    'src/': ['maplace-versioned.js'],
                    './': ['index.html'],
                },
                options: {
                    replacements: [{
                        pattern: /@VERSION/g,
                        replacement: '<%= pkg.version %>'
                    }]
                }
            }
        },
        pkg: grunt.file.readJSON('package.json'),
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-string-replace');

    // Build task.
    grunt.registerTask('default', ['uglify', 'string-replace']);
};
