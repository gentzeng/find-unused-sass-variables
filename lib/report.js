'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function printReportToFile(unusedList, pathToReport, reportType = '') {
    const report = createReport(unusedList, reportType);
    const file = path.resolve(pathToReport);

    fs.writeFileSync(file, report, err => {
        if (err) {
            throw err;
        }
    });
}

function printReportToConsole(unusedList) {
    const report = createReportString(unusedList, 'console');

    console.log(report);
}

function createReport(unusedList, reportType) {
    if (reportType === 'json') {
        return createReportJson(unusedList);
    }

    if (reportType === 'sonar') {
        return createReportSonar(unusedList);
    }

    return createReportString(unusedList, 'file');
}

function createReportSonar(unusedList) {
    const unusedListSonar = { issues: [] };
    const engineId = 'find_unused_sass_variable';
    const ruleId = 'unused_sass_variable';
    const type = 'CODE_SMELL';
    const severity = 'MINOR';
    const effortMinutes = 5;

    unusedList.forEach(unusedVarInfo => {
        const issue = {};
        const primaryLocation = {};
        const textRange = {};

        issue.engineId = engineId;
        issue.ruleId = ruleId;
        issue.type = type;
        issue.severity = severity;
        issue.effortMinutes = effortMinutes;
        issue.primaryLocation = primaryLocation;
        primaryLocation.filePath = unusedVarInfo.file;
        primaryLocation.message = createVariableMessage(unusedVarInfo.name, 'raw');
        primaryLocation.textRange = textRange;

        textRange.startLine = unusedVarInfo.line;
        textRange.startColumn = unusedVarInfo.column;
        textRange.endLine = unusedVarInfo.lineEnd;
        textRange.endColumn = unusedVarInfo.columnEnd;

        unusedListSonar.issues.push(issue);
    });
    return createReportJson(unusedListSonar);
}

function createReportJson(unusedList) {
    return JSON.stringify(unusedList);
}

function createReportString(unusedList, mode = 'file') {
    let currentFile = '';
    const currentDirectory = process.cwd();
    let report = '';
    unusedList.forEach(unusedVarInfo => {
        if (currentFile !== unusedVarInfo.file) {
            currentFile = unusedVarInfo.file;
            const fileRelativePath = path.relative(currentDirectory, currentFile);

            report += '\n';
            report += (mode === 'console') ? `${chalk.underline(fileRelativePath)}` : `${fileRelativePath}`;
            report += '\n';
        }

        report += ` ${unusedVarInfo.line}:${unusedVarInfo.column}\t`;
        report += createVariableMessage(unusedVarInfo.name, mode);
        report += '\n';
    });

    return report;
}

function createVariableMessage(name, mode = 'file') {
    let message = 'Variable ';
    message += (mode === 'chalked') ? `${chalk.bold(name)}` : `${name}`;
    message += ' is not being used!';

    return message;
}

module.exports = {
    printReportToConsole,
    printReportToFile
};
