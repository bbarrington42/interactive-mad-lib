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


const isPOS = pos => word => {
    const tags = tagger.tag(lexer.lex(word));
    let prefix = '?';
    switch(pos) {
        case 'verb':
            prefix = 'VB';
            break;

        case 'adverb':
            prefix = 'RB';
            break;

        case 'adjective':
            prefix = 'JJ';
            break;

        case 'noun':
            prefix = 'NN';
            break;

        default:
            return '?';
    }

    return S.any (elem => elem[1].startsWith(prefix)) (tags);
};

module.exports = {
    isPOS
};
