#!/usr/bin/env node

'use strict';

const path = require('path');
const commander = require('commander');
const chalk = require('chalk');
const { version } = require('./package.json');
const fusv = require('.');
const report = require('./lib/report');

commander
    .usage('[options] <folders...>')
    .version(version, '-v, --version')
    .option('-i, --ignore <ignoredVars>', 'ignore variables, comma separated')
    .option('-o, --output-file <file path>', 'path of file to write a report')
    .option('-f, --formatter <format>', 'the output formatter: string, json, sonar (sonar generic issue format for SonarScanner)', 'string')
    .option('-s, --exit-success', 'exit succesfully, even if unused sass variables are found\n(useful for sonar reports if fusv is used before a linter)')
    .parse(process.argv);

function main(args) {
    const ignore = commander.ignore ? commander.ignore.split(',') : [];

    console.log('Looking for unused variables');

    let unusedList = [];

    args.forEach(arg => {
        const dir = path.resolve(arg);

        console.log(`Finding unused variables in "${chalk.cyan.bold(dir)}"...`);

        // eslint-disable-next-line unicorn/no-array-callback-reference
        const unusedVars = fusv.find(dir, { ignore });

        unusedVars.unusedInfo.printSummary();
        unusedVars.unusedInfo.printReportToConsole();

        unusedList = unusedList.concat(unusedVars.unusedInfo);
    });

    if (commander.outputFile) {
        report.printReportToFile(unusedList, commander.outputFile,
            commander.formatter);
    }

    if (unusedList.length === 0) {
        console.log('No unused variables found!');
        process.exit(0);
    }

    if (commander.exitSuccess) {
        process.exit(0);
    }

    process.exit(1);
}

const args = commander.args.filter(arg => typeof arg === 'string');

if (args.length > 0) {
    main(args);
} else {
    commander.help();
}
