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


/*
 'pos' is an object with the following form (using plural noun as an example):
 {
 text: 'plural noun',
 codes: ['NNS']
 }
 */
// Note that this is lenient in that if ANY single word in the input text matches the targeted part of speech,
// then this will return true. Note also that only a single word should be passed as an argument, so we could try to
// restrict and accept calls with only a single word argument.
// todo May need to make this more strict
const isPOS = codes => word => {
    const tags = getTags (word);
    //console.log(`text: ${word}, tags: ${tags}`);

    return S.any (elem => codes.includes (elem[1])) (tags);
};

module.exports = {
    isPOS,
    getTags
};

