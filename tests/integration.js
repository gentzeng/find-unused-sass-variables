#!/usr/bin/env node

'use strict';

const fusv = require('..');
const expectedUnused = [
    '$a',
    '$b',
    '$unused',
    '$black',
    '$nestedVar',
    '$nestNestedVar',
    '$enabled-variable'
];

const ignore = ['$ignored-variable'];

(async() => {
    try {
        console.log('Running integration tests...');

        const result = await fusv.find('./', { ignore });

        if (result.unused.length === expectedUnused.length) {
            console.info('Tests passed!');
        } else {
            throw new Error(`Expected ${expectedUnused.length} and got ${result.unused.length}
        Expected: ${expectedUnused.join(', ')}
        Got: ${result.unused.join(', ')}`);
        }
    } catch (error) {
        console.error(error);
    }
})();
