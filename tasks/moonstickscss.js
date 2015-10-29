var Promise = require('bluebird');
var sass = Promise.promisifyAll(require('node-sass'));
var _ = require('lodash');
var extendJson = require('extend-json');
var path = require('path');
var fs = Promise.promisifyAll(require('fs-extra'));
var glob = Promise.promisifyAll(require('glob'));

function getBrands(brandBase) {
    return glob.globAsync(path.join(process.cwd(), brandBase, '*.scss'));
}

function createImport(stylesheet) {
    return '\n@import "' + stylesheet.replace(process.cwd() + '/', '') + '";';
}

function createBrandImport(brandBase, brand) {
    return '@import "' + brand.replace(process.cwd() + '/', '') + '";\n';
}

function getPages(files) {
    return Promise.map(files, function(f) {
        var commonJsonPath = path.join(process.cwd(), f.src[0], '../');
        var pageConfigJson = path.join(process.cwd(), f.src[0]);

        return extendJson(require(pageConfigJson), {
                pointer: '>>',
                path: commonJsonPath
            })
            .then(getComponentsFromSlots)
            .then(function(s) {
                return {
                    dest: f.dest,
                    components: _.uniq(_.flatten(s))
                };
            });
    });
}

function getComponentsFromSlots(page) {
    return Object.keys(page.slots || {}).map(function(slotName) {
        var components = (page.slots[slotName] || {})
            .components || [];

        return components.reduce(function(arr, component) {
            return arr.concat([component.type], (component.components || []).map(function (component) {
                return component.type;
            }));
        }, []);
    });
}

function createBrandBases(opts, brand) {
    return Promise.props({
        baseSassFile: fs.readFileAsync(opts.baseSassFile, 'utf8'),
        baseCommonFile: fs.readFileAsync(opts.baseCommonFile, 'utf8')
    })
    .then(function(bases) {
        return {
            common: createBrandImport(opts.brandBase, brand) + bases.baseCommonFile,
            main: createBrandImport(opts.brandBase, brand) + bases.baseSassFile
        };
    });
}

function getCommonComponents(opts, pages) {
    var seen = {};
    return _.flatten(pages).reduce(function (commonComponents, componentName) {
        if (opts.skipCommon.indexOf(componentName) > -1) {
            return commonComponents;
        }

        if (seen.hasOwnProperty(componentName)) {
            commonComponents.push(componentName);
            return commonComponents;
        }

        seen[componentName] = 1;
        return commonComponents;
    }, []);
}

function extractAndWriteCommonFiles(opts, files, brand, props) {
    var commonComponents = _.uniq(getCommonComponents(opts, props.pages.reduce(function (components, page) {
        return components.concat(page.components);
    }, [])));
    var css = commonComponents.reduce(function (data, stylesheet) {
        return data += createImport(stylesheet);
    }, props.baseFiles.common);

    console.log('Rendering ' + brand + ' common file...');
    return sass.renderAsync({
        data: css,
        sourceMap: opts.map,
        sourceMapEmbed: opts.map,
        sourceMapContents: opts.map,
        sourceComments: opts.map,
        outFile: '/whyisthishere?/',
        includePaths: [path.join(process.cwd(), opts.styleDirectory)]
    })
    .then(function (renderedScss) {
        var commonPath = opts.commonPath || './';

        return fs.outputFileAsync(path.join(files[0].dest, commonPath, '../common.css'), renderedScss.css);
    })
    .then(function removeCommonComponentsFromPages() {
        console.log('Wrote ' + brand + ' common file...\n');
        props.pages = props.pages.map(function (page) {
            return {
                dest: page.dest,
                components: page.components.reduce(function (uniqComponents, component) {
                    if (commonComponents.indexOf(component) === -1) {
                        uniqComponents.push(component);
                    }

                    return uniqComponents;
                }, [])
            };
        });

        return props;
    });
}

function stripProcessCwd(arr) {
    return arr.map(function (item) {
        return item.replace(process.cwd() + '/', '');
    });
}

function resolveScssFiles(opts, pages) {
    var componentsMiniMapBase = path.join(process.cwd(), opts.componentBase);

    return Promise.map(pages, function (page) {
        return glob.globAsync(path.join(componentsMiniMapBase, '{' + page.components.join(',') + '}', 'assets/styles/{' + opts.brand + '/,}*.scss')).then(stripProcessCwd).then(function (results) {
            return {
                dest: page.dest,
                components: results
            };
        });
    });
}

function renderAndWritePages(opts, brandName, props) {
    return Promise.each(props.pages, function(page) {
        var css = page.components.reduce(function(data, stylesheet) {
            return data += createImport(stylesheet);
        }, props.baseFiles.main);

        console.log('Rendering ' + page.dest + ' file...');
        return sass.renderAsync({
            data: css,
            sourceMap: opts.map,
            sourceMapEmbed: opts.map,
            sourceMapContents: opts.map,
            sourceComments: opts.map,
            outFile: '/whyisthishere?/',
            includePaths: [path.join(process.cwd(), opts.styleDirectory)]
        })
        .then(function (renderedScss) {
            console.log('Wrote ' + page.dest + ' file...\n');
            return fs.outputFileAsync(page.dest, renderedScss.css);
        });
    });
}

module.exports = function(grunt) {
    grunt.registerMultiTask('moonstickscss', 'A task for compiling moonsticks assets', function() {
        var opts = this.options();
        var files = this.files;
        var done = this.async();
        var dest = this.data.dest;

        Promise.each(getBrands(opts.brandBase), function renderBrands(brand) {
            var brandName = path.basename(brand, '.scss');
            var brandedFiles = files.slice(0).map(function (_file) {
                var file = _.clone(_file);

                file.dest = file.dest.replace(dest, path.join(dest, brandName));

                return file;
            });

            return Promise.props({
                baseFiles: createBrandBases(opts, brand),
                pages: getPages(brandedFiles).then(resolveScssFiles.bind(null, opts))
            })
            .then(function(props) {
                return extractAndWriteCommonFiles(opts, brandedFiles, brandName, props);
            })
            .then(renderAndWritePages.bind(null, opts, brandName));
        })
        .then(function () {
            done();
        })
        .catch(done);
    });
};
