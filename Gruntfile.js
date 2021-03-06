/*
 * grunt-moonstickscss
 *
 *
 * Copyright (c) 2014 Alex Meah
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js', 'tasks/*.js', '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Before generating any new files, remove any previously-created files.
        clean: {
            tests: ['tmp']
        },

        // Configuration to be run (and then tested).
        moonstickscss: {
            options: {
                baseSassFile: 'test/fixtures/css/global.scss',
                baseCommonFile: 'test/fixtures/css/common.scss',
                styleDirectory: '',
                commonPath: '/'
            },
            laterooms: {
                options: {
                    brand: 'test',
                    brandBase: 'test/fixtures/css/brands',
                    componentBase: 'test/fixtures/components',
                    skipCommon: ['roomAvailability'],
                    map: false
                },
                expand: true,
                cwd: 'test/fixtures/pages',
                src: [
                    '**/*.json', '!**/common/*'
                ],
                ext: '.css',
                dest: 'tmp'
            }
        },

        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        }
    });

    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', [
        'clean', 'moonstickscss', 'nodeunit'
    ]);

    // By default, lint and run all tests.
    grunt.registerTask('default', [
        'jshint', 'test'
    ]);

};
