#!/usr/bin/env node

'use strict';

const path = require('path');
const commander = require('commander');
const chalk = require('chalk');
const { version } = require('./package.json');
const fusv = require('.');

commander
    .usage('[options] <folders...>')
    .version(version, '-v, --version')
    .option('-i, --ignore <ignoredVars>', 'ignore variables, comma separated')
    .parse(process.argv);

async function main(args) {
    const ignore = commander.ignore ? commander.ignore.split(',') : [];

    console.log('Looking for unused variables');

    let unusedList = [];

    await Promise.all(args.map(async arg => {
        const dir = path.resolve(arg);

        console.log(`Finding unused variables in "${chalk.cyan.bold(dir)}"...`);

        // eslint-disable-next-line unicorn/no-array-callback-reference
        const unusedVars = await fusv.find(dir, { ignore });

        console.log(`${chalk.cyan.bold(unusedVars.total)} total variables.`);

        unusedVars.unused.forEach(unusedVar => {
            console.log(`Variable ${chalk.bold(unusedVar)} is not being used!`);
        });

        unusedList = unusedList.concat(unusedVars.unused);
        return unusedList;
    }));

    if (unusedList.length === 0) {
        console.log('No unused variables found!');
        process.exit(0);
    }

    process.exit(1);
}

(async() => {
    try {
        const args = commander.args.filter(arg => typeof arg === 'string');

        if (args.length > 0) {
            await main(args);
        } else {
            commander.help();
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
})();
