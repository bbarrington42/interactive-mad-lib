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

const getTags = text => tagger.tag(lexer.lex(text));

const isPOS = pos => word => {
    const tags = getTags(word);

    const prefix = pos === 'verb' ? 'VB' : pos === 'adverb' ? 'RB' : pos === 'adjective' ? 'JJ' : pos === 'noun' ? 'NN' : '?';

    return S.any (elem => elem[1].startsWith(prefix)) (tags);
};

module.exports = {
    isPOS,
    getTags
};


