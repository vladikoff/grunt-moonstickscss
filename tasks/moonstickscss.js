/*
 * grunt-moonstickscss
 *
 *
 * Copyright (c) 2014 Alex Meah
 * Licensed under the MIT license.
 */

'use strict';

var MoonstickSassCompiler = require('moonstick-scss-compiler');
var async = require('async');

module.exports = function (grunt) {

    grunt.registerMultiTask('moonstickscss', 'Compile SCSS on a page by page basis', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            basePath: process.cwd()
        });
        var done = this.async();


        // Iterate over all specified file groups.
        async.each(this.files, function (f, callback) {
            new MoonstickSassCompiler(f.src[0], options)
                .then(function (css) {
                    // Write the destination file.
                    grunt.file.write(f.dest, css);

                    // Print a success message.
                    grunt.log.writeln('File "' + f.dest + '" created.');
                    callback();
                })
                .catch(function (err) {
                    grunt.fail.fatal(err);
                    callback();
                });
        }, done);
    });
};
