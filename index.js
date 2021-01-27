'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const escapeRegex = require('escape-string-regexp');
const parse = require('./lib/parse-variable');
const report = require('./lib/report');

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

    // Build sassFilesString as concatenation of all sassFiles
    // Get all variables and their origin information
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

        sassVarInfo[i] = parse(strSass, options.ignore, file);

        variables = [].concat(...sassVarInfo);
        sassFilesString += strSass;
    });

    // Get unused variables by filtering single occuring variables in in sassFilesString
    const unusedVars = variables.filter(variable => {
        const re = new RegExp(`(${escapeRegex(variable.name)})\\b(?!-)`, 'g');

        return sassFilesString.match(re).length === 1;
    });

    // Set properties of unusedVars
    unusedVars.total = variables.length;
    unusedVars.totalUnusedVars = unusedVars.map(({ name }) => name).length;

    // Set functions of unusedVars
    unusedVars.printSummary = function() {
        console.log(`${chalk.cyan.bold(this.total)} total variables.`);
        console.log(`${chalk.cyan.bold(this.totalUnusedVars)} total unused variables.`);
    };

    unusedVars.printReportToConsole = function() {
        report.printReportToConsole(this);
    };

    unusedVars.printReportToFile = function(pathToReport, reportType = '') {
        report.printReportToFile(this, pathToReport, reportType);
    };

    // Unused and total for backwards compatibility
    return {
        totalUnusedVars: unusedVars.totalUnusedVars,
        total: unusedVars.total,
        unusedInfo: unusedVars,
        unused: unusedVars.map(({ name }) => name)
    };
}

module.exports = {
    find: findUnusedVars
};
