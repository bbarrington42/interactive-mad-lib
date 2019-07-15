'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');


// Simple state model for a mad lib session
// Allowed placeholders are ${verb}, ${adjective}, ${noun}, ${adverb}
let template = ''; // Text with placeholders. When all placeholders have been resolved, this is the result.
const posRegex = /\$\{(verb|adjective|adverb|noun)\}/;

// Given the current template, return the next placeholder as a Just. The value is the type of the placeholder (verb, etc.)
// If the template contains no more placeholders, Nothing is returned.
const nextPlaceholder = template => {
    const matchResult = S.match (posRegex) (template);
    return S.join (S.chain (obj => S.head (obj.groups)) (matchResult));
};

// Given the current template and a value, update the next placeholder with the value.
// Returns the updated template. If no placeholder is found, the template is returned unchanged.
const updateNext = template => value => {
    const startIndex = template.indexOf ('${');
    const endIndex = template.indexOf ('}');
    if (-1 === startIndex || -1 === endIndex) return template;

    const prefix = template.slice (0, startIndex);
    const suffix = template.slice (endIndex + 1);
    return prefix + value + suffix;
};


// testing
const testTemplate1 = 'Now is the ${noun} for all ${adjective} ${noun} to blah, blah, blah... ';
const testTemplate2 = 'This template contains no placeholders';
const testTemplate3 = 'This template contains one placeholder ${adjective}';

console.log (nextPlaceholder (testTemplate3));

console.log (updateNext (testTemplate2) ('dog'));
