# grunt-string-replace [![Build Status](https://travis-ci.org/eruizdechavez/grunt-string-replace.svg)](https://travis-ci.org/eruizdechavez/grunt-string-replace)  [![Node Dependencies](https://david-dm.org/eruizdechavez/grunt-string-replace.svg)](https://david-dm.org/eruizdechavez/grunt-string-replace)

Replaces strings on files by using string or regex patterns. Attempts to be a [String.prototype.replace](http://www.ecma-international.org/ecma-262/5.1/#sec-15.5.4.11) adapter task for your grunt project.

## Getting Started
This plugin requires node `>= 0.8.0`, Grunt `>= 0.4.0` and npm `>= 1.4.15` (latest stable is recommended).

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-string-replace --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```javascript
grunt.loadNpmTasks('grunt-string-replace');
```

*If you're still using grunt v0.3.x it's strongly recommended that [you upgrade](http://gruntjs.com/upgrading-from-0.3-to-0.4), but in case you can't please use [v0.1.1-1](https://github.com/eruizdechavez/grunt-string-replace/tree/0.1.1-1).*

## Configuration

Inside your `Gruntfile.js` file add a section named `string-replace`. This section specifies the files to edit, destinations, patterns and replacements.

### Parameters

#### files ```object```

Defines what files this task will edit. Grunt itself has very powerful [abstractions](http://gruntjs.com/configuring-tasks#files), so it is **highly recommended** you understand the different ways to specify them. Learn more at [Gruntfile Files mapping](http://gruntjs.com/configuring-tasks#files), some options incude compact format, files object format and files array format.

#### options ```object```

Controls how this task operates and should contain key:value pairs, see options below.

##### options.saveUnchanged ```boolean```

By default `true` this flag will instruct `grunt-string-replace` to copy the files on `options.replacements` patters even if there are no replacing matches.

By setting this flag to `false` files that have not changed (no replacements done) will not be saved on the new location. This will speed up the task if there is a large number of files.

##### options.replacements ```array```

This option will hold all your pattern/replacement pairs. A pattern/replacement pair should contain key:value pairs containing:

* pattern ```string``` or ```regex```
* replacement ```string```

```javascript
options: {
  replacements: [{
    pattern: /\/(asdf|qwer)\//ig,
    replacement: '"$1"'
  }, {
    pattern: ',',
    replacement: ';'
  }]
}
```

### Notes

- If the pattern is a string, only the first occurrence will be replaced, as stated on [String.prototype.replace](http://www.ecma-international.org/ecma-262/5.1/#sec-15.5.4.11).
- When using Grunt templates, be aware that some security checks are implemented by LoDash and may alter your content (mainly to avoid XSS). To avoid this, see the advanced example below.


## Examples

### Multiple files and multiple replacements

```javascript
'string-replace': {
  dist: {
    files: {
      'dest/': 'src/**',
      'prod/': ['src/*.js', 'src/*.css'],
    },
    options: {
      replacements: [{
        pattern: /\/(asdf|qwer)\//ig,
        replacement: ''$1''
      }, {
        pattern: ',',
        replacement: ';'
      }]
    }
  }
}
```

### Simple inline content

```javascript
'string-replace': {
  inline: {
    files: {
      'dest/': 'src/**',
    },
    options: {
      replacements: [
        // place files inline example
        {
          pattern: '<script src='js/async.min.js'></script>',
          replacement: '<script><%= grunt.file.read('path/to/source/js/async.min.js') %></script>'
        }
      ]
    }
  }
}
```

### Using files' expand options

For more details, see Grunt's documentation about [dynamic files object](http://gruntjs.com/configuring-tasks#building-the-files-object-dynamically).

```javascript
'string-replace': {
  dist: {
    files: [{
      expand: true,
      cwd: 'src/',
      src: '**/*',
      dest: 'dist/'
    }],
    options: {
      replacements: [{
        pattern: 'hello',
        replacement: 'howdy'
      }]
    }
  }
}
```

### Advanced inline

Since grunt-string-replace is basically a wrapper of [String.prototype.replace](http://www.ecma-international.org/ecma-262/5.1/#sec-15.5.4.11) you can also provide a function as a replacement pattern instead of a string or a template. To get more details about how to use a function as replacement pattern I recommend you to read [Specifying a function as a parameter](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter).

We will be reading file names from HTML comments and use the paths later to fetch the content and insert it inside a resulting HTML. Assuming the following setup:

*src/index.html*

```html
<!-- @import partials/header.html -->
content here
<!-- @import partials/footer.html -->
```

*src/partials/header.html*

```html
<html><head></head><body>
```

*src/partials/footer.html*

```html
</body></html>
```

*Gruntfile.js*

```javascript
'use strict';

module.exports = function (grunt) {
  // Project configuration.
  grunt.initConfig({
    config: {
      src: 'src/*.html'
      dist: 'dist/'
    },
    'string-replace': {
      dist: {
        files: {
          '<%= config.dist %>': '<%= config.src %>'
        },
        options: {
          replacements: [{
            pattern: /<!-- @import (.*?) -->/ig,
            replacement: function (match, p1) {
              return grunt.file.read(grunt.config.get('config.dist') + p1);
            }
          }]
        }
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-string-replace');

  // Default task.
  grunt.registerTask('default', ['string-replace']);
};
```

After executing grunt we get the following:

*dist/index.html*

```html
<html><head></head><body>
content here
</body></html>
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History

1.2.1
  - Update project URLs
  - Update dependencies

1.2.0
  - Add `saveUnchanged` option to control weather unmodified files are saved or not.
  - Add iojs to Travis CI.

1.1.1
  - Add Node.js v0.12 to Travis CI

1.1.0
  - Update dependencies
  - Add new log and debug messages
  - Improved file handling; grunt-string-replace will not copy files that are not modified (no replacements executed). Contributed by [iabw](https://github.com/iabw)

1.0.0
  - Update dependencies
  - Update README.md
  - Well deserved bump to 1.0.0 (its been stable for long enough now)

0.2.8
  - Added log message after file is succesfully created. Contributed by [donaldpipowitch](https://github.com/donaldpipowitch)
  - Do not report error if one of the replacements resolves to a folder

0.2.7
  - External libraries are deprecated on Grunt 0.4.2
    - Remove grunt.util._ as it is not really required
    - Replace grunt.util.async with async

0.2.6
  - Update Getting Started section
  - Fix broken link to Gruntfile's File section (#18)

0.2.5
  - Fix for #16
  - Fix for Travis CI config file
  - Added error handling to finish the task if something did not work as expected instead of just fail silently
  - Updated dev dependencies to latest stable versions

0.2.4
  - Asynchronously loop files. Original idea contributed by [maxnachlinger](https://github.com/maxnachlinger)
  - Inline replacing example on README.md. Contributed by [willfarrell](https://github.com/willfarrell)

0.2.3
  - Removed dependency with grunt-lib-contrib due to deprecation of 'options' method in favor of Grunt's 'options' util.
  - Updated grunt-contrib-jshint version in package.json to 0.3.0
  - Updated grunt-contrib-watch version in package.json to 0.3.1
  - Updated grunt version in package.json to 0.4.1
  - Added Node.js v0.10 to Travis CI config file

0.2.2
  - Added support to be used as npm module. Contributed by [thanpolas](https://github.com/thanpolas).

0.2.1
  - Updated dependencies for Grunt 0.4.0.

0.2.0
  - Added Support for grunt 0.4.0. This version will not support grunt 0.3.x, if you need to use it then ```npm install grunt-string-replace@0.1```.

0.1.1-1
  - Added Clean task (and dev dependency) to remove test generated file before testing.
  - Added Sublime Text project files and test generated file to npm ignore list.

0.1.1
  - Fix dependency with grunt-lib-contrib.

0.1.0-1
  - Fixed a typo on package.json description.
  - Added a note about string pattern behavior.

0.1.0
  - Initial release.

## License
Copyright (c) 2015 Erick Ruiz de Chavez.
Licensed under the MIT license.

[grunt]: http://gruntjs.com/
