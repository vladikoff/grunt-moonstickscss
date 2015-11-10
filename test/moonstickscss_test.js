'use strict';

var grunt = require('grunt');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports.moonstickscss = {
    setUp: function(done) {
        // setup here if necessary
        done();
    },
    all_custom_options: function(test) {
        test.expect(4);

        var actual_abrand = grunt.file
            .read('tmp/abrand/test.css');
        var expected_abrand = grunt.file
            .read('test/expected/abrand.scss');
        test.equal(actual_abrand, expected_abrand, 'should compile the fixtures using custom options.');

        var actual_another = grunt.file
            .read('tmp/another/test.css');
        var expected_another = grunt.file
            .read('test/expected/another.scss');
        test.equal(actual_another, expected_another, 'should compile the fixtures using custom options.');

        var actualCommon_abrand = grunt.file
            .read('tmp/abrand/common.css');
        var expectedCommon_abrand = grunt.file
            .read('test/expected/abrand-common.scss');
        test.equal(actualCommon_abrand, expectedCommon_abrand, 'should compile the fixtures using custom options.');

        var actualCommon_another = grunt.file
            .read('tmp/another/common.css');
        var expectedCommon_another = grunt.file
            .read('test/expected/another-common.scss');
        test.equal(actualCommon_another, expectedCommon_another, 'should compile the fixtures using custom options.');

        test.done();
    }
};
