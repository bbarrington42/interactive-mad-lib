'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const pos = require ('pos');

const lexer = new pos.Lexer ();
const tagger = new pos.Tagger ();

const getTags = text => tagger.tag (lexer.lex (text));


// If the submitted word is a part of speech identified in the codes, then this returns true. Otherwise, false.
// It ensures that only one part of speech is submitted.
// Codes is an array of strings. Each string is a code as returned by the lexer, i.e. 'NN', 'RB', etc.
const isPOS = codes => word => {
    const tags = getTags (word);
    return tags.length > 1 ? false : S.maybe (false) (arr => codes.includes (arr[1])) (S.head (tags));
};

module.exports = {
    isPOS,
    getTags
};

