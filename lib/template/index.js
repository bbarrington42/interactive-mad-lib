'use strict';

// Use Sanctuary as S and Fluture as Future - include types
const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

const tagger = require ('../../lib/tagger');

const makeTemplate = text => {
    const lift = prefix =>
        'VB' === prefix ? S.Just ('${verb}') :
            'RB' === prefix ? S.Just ('${adverb}') :
                'JJ' === prefix ? S.Just ('${adjective}') :
                    'NN' === prefix ? S.Just ('${noun}') : S.Nothing;

    const xform = tag => {
        const prefix = tag[1].substring (0, 2);
        return S.fromMaybe (tag[0]) (lift (prefix));
    };

    const tags = tagger.getTags (text);
    //console.log(tags);

    const xformed = S.map (xform) (tags);

    return xformed.join(' ');
};


// const text = 'Now is the time for all good men to come to the aid of their country';
//
// const template = makeTemplate (text);
//
// console.log (template);

