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
            src: ['Gruntfile.js', 'src/*.js', 'website/javascripts/app.js']
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
        'jscs': {
			main: 'src/*.js',
            options: {
                config: '.jscsrc'
            }
		},
        'copy': {
            webfiles: {
                expand: true,
                flatten: true,
                cwd: 'website',
                dest: '',
                src: ['favicon.ico', 'humans.txt', 'robots.txt'],
                filter: 'isFile'
            }
        },
        'string-replace': {
            'script': {
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
            'web': {
                files: {
                    './index.html': ['website/index.html']
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
                        pattern: /<!-- @import (.*?) -->/ig,
                        replacement: function (match, p1) {
                            return grunt.file.read('website/' + p1);
                        }
                    },{
                        pattern: /@LOCATIONS/g,
                        replacement: function () {
                            return grunt.file.read('website/data/points.js')
                                .replace(new RegExp('<', 'g'), '&lt;')
                                .replace(new RegExp('>', 'g'), '&gt;');
                        }
                    }]
                }
            },
            'web-dev': {
                files: {
                    './index.html': ['website/index.html']
                },
                options: {
                    replacements: [{
                        pattern: /@VERSION/g,
                        replacement: '<%= pkg.version %>'
                    },{
                        pattern: /<!-- @import (.*?) -->/ig,
                        replacement: function (match, p1) {
                            return grunt.file.read('website/' + p1);
                        }
                    }]
                }
            }
        },
        'watch': {
            all: {
                files: ['./*.js', 'src/*.js', 'website/index.html', 'website/javascripts/*.js',
                    'website/stylesheets/*.css', 'website/partials/**/*.html'],
                tasks: ['all-dev'],
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
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-string-replace');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jscs');

    // Tasks.
    grunt.registerTask('default', ['all']);
    grunt.registerTask('build', ['jshint', 'string-replace:script', 'uglify']);
    grunt.registerTask('all', ['build', 'string-replace:web', 'copy']);
    grunt.registerTask('all-dev', ['build', 'string-replace:web-dev', 'copy']);
    grunt.registerTask('test', ['build']);
};
