'use strict';

const fs = require('fs').promises;
const path = require('path');
const globby = require('globby');
const escapeRegex = require('escape-string-regexp');
const parse = require('./lib/parse-variable');

const defaultOptions = {
    ignore: []
};

async function findUnusedVars(strDir, opts) {
    const options = Object.assign(defaultOptions, opts);
    const dir = path.isAbsolute(strDir) ? strDir : path.resolve(strDir);

    if (Boolean(options.ignore) && !Array.isArray(options.ignore)) {
        throw new TypeError('`ignore` should be an Array');
    }

    // Trim list of ignored variables
    options.ignore = options.ignore.map(value => value.trim());

    //if (!(fs.existsSync(dir) && fs.statSync(dir).isDirectory())) {
    //    throw new Error(`"${dir}": Not a valid directory!`);
    //}

    // Array of all Sass files
    const sassFiles = await globby('**/*.scss', { cwd: dir, absolute: true, onlyFiles: true });
    //console.log(`sassFiles: ${sassFiles}`);

    // String of all Sass files' content
    let sassFilesString = await sassFiles.reduce(async(sassStr, file) => {
        sassStr += await fs.readFile(file, 'utf8');
        return sassStr;
    }, '');

    //console.log(`sassFilesString: ${sassFilesString}`);

    // Remove jekyll comments
    if (sassFilesString.includes('---')) {
        sassFilesString = sassFilesString.replace(/---/g, '');
    }

    const variables = parse(sassFilesString, options.ignore);

    // Store unused vars from all files and loop through each variable
    const unusedVars = variables.filter(variable => {
        const re = new RegExp(`(${escapeRegex(variable)})\\b(?!-)`, 'g');

        return sassFilesString.match(re).length === 1;
    });

    return {
        unused: unusedVars,
        total: variables.length
    };
}

module.exports = {
    find: findUnusedVars
};
