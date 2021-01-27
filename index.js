'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const escapeRegex = require('escape-string-regexp');
const parse = require('./lib/parse-variable');

const defaultOptions = {
    ignore: []
};

function findUnusedVars(strDir, opts) {
    const options = Object.assign(defaultOptions, opts);
    const dir = path.isAbsolute(strDir) ? strDir : path.resolve(strDir);

    if (Boolean(options.ignore) && !Array.isArray(options.ignore)) {
        throw new TypeError('`ignore` should be an Array');
    }

    // Trim list of ignored variables
    options.ignore = options.ignore.map(val => val.trim());

    if (!(fs.existsSync(dir) && fs.statSync(dir).isDirectory())) {
        throw new Error(`"${dir}": Not a valid directory!`);
    }

    // Array of all Sass files
    const sassFiles = glob.sync(path.join(dir, '**/*.scss'));

    // Get per file:
    //      path relatively to given sass file directory
    //      linesCumulated: sum of all files before and including
    //      the currently examined file
    const currentDirectory = process.cwd();
    let variables = [];
    const sassVarInfo = [];
    let strSass = '';
    let sassFilesString = '';
    sassFiles.forEach((file, i) => {
        strSass = fs.readFileSync(file, 'utf8');

        // remove jekyl comments
        if (strSass.includes('---')) {
            strSass = strSass.replace(/---/g, '');
        }

        const fileRelativePath = path.relative(currentDirectory, file);
        sassVarInfo[i] = parse(strSass, options.ignore, fileRelativePath);

        variables = [].concat(...sassVarInfo);
        sassFilesString += strSass;
    });

    // Filter the unused variables from 'variables' by checking
    // the number of occurences in sassFilesString
    const unusedVars = [];
    const unusedVarsOrigin = variables.filter(variable => {
        const re = new RegExp(`(${escapeRegex(variable.name)})\\b(?!-)`, 'g');

        if (sassFilesString.match(re).length === 1) {
            unusedVars.push(variable.name);

            return true;
        }

        return false;
    });

    return {
        totalUnusedVars: unusedVarsOrigin.length,
        total: variables.length,
        unusedOrigin: unusedVarsOrigin,
        // for backwards compatibility of API
        unused: unusedVars
    };
}

module.exports = {
    find: findUnusedVars
};
