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

const posRegex = /\$\{([a-z]+)\}/;

// Given the current template, return the next placeholder as a Just. The value is the type of the placeholder (verb, etc.)
// If the template contains no more placeholders, Nothing is returned.
const nextPlaceholder = template => {
    const matchResult = S.match (posRegex) (template);
    return S.join(S.chain(obj => S.head(obj.groups)) (matchResult));
};


// testing
const testTemplate1 = 'Now is the ${noun} for all ${adjective} ${noun} to blah, blah, blah... ';
const testTemplate2 = 'This template contains no placeholders';

console.log(nextPlaceholder(testTemplate2));
