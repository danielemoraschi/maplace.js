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
                    },{
                        pattern: /\/\/@GA/g,
                        replacement: [
                            "var _gaq = _gaq || [];",
                            "_gaq.push(['_setAccount', 'UA-3593281-30']);",
                            "_gaq.push(['_trackPageview']);",
                            "_gaq.push(['_trackPageLoadTime']);",
                            "(function() {",
                                "var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;",
                                "ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';",
                                "var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);",
                            "})();"
                        ].join(' ')
                    },{
                        pattern: /@LOCATIONS/g,
                        replacement: function () {
                            return grunt.file.read('data/points.js')
                                .replace(new RegExp('<', 'g'), '&lt;')
                                .replace(new RegExp('>', 'g'), '&gt;');
                        }
                    }]
                }
            },
            versionIndexDev: {
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
                files: ['**/*.js', 'src/*.js'],
                tasks: ['build'],
                options: {
                    spawn: false,
                    debounceDelay: 250
                },
            },
            web: {
                files: ['**/*.js', 'src/*.js', 'index.tpl', 'javascripts/*.js',
                    'stylesheets/*.css'],
                tasks: ['web-dev'],
                options: {
                    spawn: false,
                    debounceDelay: 250
                },
            }
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
    grunt.registerTask('web-dev', ['build', 'string-replace:versionIndexDev']);
    grunt.registerTask('test', ['build']);
};
