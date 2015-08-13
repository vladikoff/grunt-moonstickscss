var Promise = require('bluebird');
var sass = require('node-sass');
var _ = require('lodash');
var extendJson = require('extend-json');
var path = require('path');
var fs = require('fs');
var glob = require('glob');

function getComponentsFromSlots(page) {
    return Object.keys(page.slots || {}).map(function (slotName) {
        return ((page.slots[slotName] || {}).components || []).map(function (component) {
            return [component.type].concat((component.components || []).map(function (component) {
                return component.type;
            }));
        });
    });
}

module.exports = function (grunt) {
    grunt.registerMultiTask('moonstickscss', 'A task for compiling moonsticks assets', function () {
        var opts = this.options();

        function globComponentStylesheets (components) {
            var componentsMiniMap = process.cwd() + '/' + opts.componentBase + '/{' + components.join(',');

            return glob.sync(componentsMiniMap + '}/assets/styles/*.scss')
                .concat(glob.sync(componentsMiniMap + '}/assets/styles/' + opts.brand + '/*.scss'));
        }

        function addStylesheetToSassData (stylesheets) {
            return stylesheets.reduce(function (data, stylesheet) {
                data.push(['@import "', stylesheet.replace(process.cwd() + '/', ''), '";'].join(''));
                return data;
            }, []).join('');
        }

        function prefixBaseFileToSassData (data) {
            return '@import "' + opts.baseSassFile + '";\n' + data;
        }

        function prefixBrandToSassData (data) {
            return '@import "' + opts.brandBase + '/_' + opts.brand + '.scss";\n' + data;
        }

        function renderCssFromData (data) {
            return sass.renderSync({
                data: data,
                sourceMap: opts.map,
                sourceMapEmbed: opts.map,
                sourceMapContents: opts.map,
                sourceComments: opts.map,
                outFile: '/whyisthishere?/',
                includePaths: [path.join(process.cwd(), 'app/assets/styles')]
            });
        }

        Promise.map(this.files, function (f) {
            var commonJsonPath = path.join(process.cwd(), f.src[0], '../');
            var pageConfigJson = path.join(process.cwd(), f.src[0]);

            return extendJson(JSON.parse(fs.readFileSync(pageConfigJson, 'utf8')), {
                pointer: '>>',
                path: commonJsonPath
            }).then(getComponentsFromSlots).then(function (s) {
                return {
                    dest: f.dest,
                    components: _.uniq(_.flatten(s))
                };
            });
        }).then(function (allComponentsFromPage) {
            var pages = allComponentsFromPage.map(function (page) {
                return page.components;
            });
            var dest = allComponentsFromPage.map(function (page) {
                return page.dest;
            });

            var seen = {};
            var common = _.uniq(_.flatten(pages).reduce(function (prev, curr) {
                if (opts.skipCommon.indexOf(curr) > -1) {
                    return prev;
                }

                if (seen.hasOwnProperty(curr)) {
                    prev.push(curr);
                    return prev;
                }

                seen[curr] = 1;
                return prev;
            }, []));

            pages
                .map(function (components) {
                    return components.filter(function (componentName) {
                        return common.indexOf(componentName) === -1;
                    });
                })
                .map(globComponentStylesheets)
                .map(addStylesheetToSassData)
                .map(prefixBaseFileToSassData)
                .map(prefixBrandToSassData)
                .map(renderCssFromData)
                .forEach(function (css, i) {
                    grunt.file.write(dest[i], css.css);
                    grunt.log.writeln('File "' + dest[i] + '" created.');
                });

            [common]
                .map(globComponentStylesheets)
                .map(addStylesheetToSassData)
                .map(prefixBaseFileToSassData)
                .map(prefixBrandToSassData)
                .map(function (data) {
                    return data + fs.readFileSync(path.join(process.cwd(), opts.baseCommonFile));
                })
                .map(renderCssFromData).forEach(function (css) {
                    grunt.file.write(path.join(dest[0], '../common.css'), css.css);
                    grunt.log.writeln('File "' + path.join(dest[0], '../common.css') + '" created.');
                });

        }).catch(function (err) {
            grunt.fail.fatal(err);
        });
    });
};
