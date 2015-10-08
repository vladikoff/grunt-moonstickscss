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
    setUp: function (done) {
        // setup here if necessary
        done();
    },
    all_custom_options: function (test) {
        test.expect(2);

        var actual = grunt.file.read('tmp/test.css');
        var expected = grunt.file.read('test/expected.scss');
        test.equal(actual, expected, 'should compile the fixtures using custom options.');

       var actualCommon = grunt.file.read('tmp/common.css');
       var expectedCommon = grunt.file.read('test/expected-common.scss');
       test.equal(actualCommon, expectedCommon, 'should compile the fixtures using custom options.');

        test.done();
    }
};
