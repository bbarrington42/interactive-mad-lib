'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');


/*
 CD      number
 JJR     comparative adjective
 JJS     superlative adjective
 NNP     proper noun
 NNPS    plural proper noun
 NNS     plural noun
 RBR     comparative adverb
 RBS     superlative adverb
 VBD     past tense verb
 VBG     verb ending in -ing

 */


// Simple state model for a mad lib session
// Placeholders are of the following form (using plural noun as an example): ${plural noun:[NNS]}
const posRegex = /\${([\w\s]+)\s*:\s*([A-Z]+(\s*,\s*[A-Z]+)*)}/;

// Given the current template, return the next placeholder as a Just({text, codes}), where text is what is used to
// elicit the value from the player and codes are the accepted codes from the lexer.
// If the template contains no more placeholders, Nothing is returned.
const nextPlaceholder = template => {
    const matchResult = S.match (posRegex) (template);

    // 'groups' will be a Maybe of an array of Maybes
    const groups = S.chain (obj => S.take(2) (obj.groups)) (matchResult);

    // OK to map the Maybes to Nullables since the regex ensures that the entries exist
    return S.map(array => {
        const text = S.maybeToNullable(array[0]);
        const codes = S.maybeToNullable(S.map(S.splitOnRegex(/\s*,\s*/g)) (array[1]));
        return {text, codes};
    }) (groups);
};

// Given the current template and a value, update the next placeholder with the value.
// If no placeholder is found, the template is returned unchanged.
const updateNextPlaceholder = template => value => {
    const startIndex = template.indexOf ('${');
    const endIndex = template.indexOf ('}');
    if (-1 === startIndex || -1 === endIndex) return template;

    const prefix = template.slice (0, startIndex);
    const suffix = template.slice (endIndex + 1);
    return prefix + value + suffix;
};

// Choose a template randomly.
const {templates} = require ('../template/inventory');
const selectTemplate = () => {
    const getRandomInt = limit => Math.floor (Math.random () * Math.floor (limit));

    return templates[getRandomInt (templates.length)];
};

module.exports = {
    nextPlaceholder,
    updateNextPlaceholder,
    selectTemplate
};


// const t = selectTemplate ();
//
// console.log (t);
//
// console.log (nextPlaceholder (t));
//
// console.log(updateNextPlaceholder(t)('run'));


