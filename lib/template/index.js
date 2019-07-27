'use strict';

// Use Sanctuary as S and Fluture as Future - include types
const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});


const tagger = require ('../../lib/tagger');


const xform = tag => {
    const lift = prefix =>
        'VB' === prefix ? S.Just ('${verb}') :
            'RB' === prefix ? S.Just ('${adverb}') :
                'JJ' === prefix ? S.Just ('${adjective}') :
                    'NN' === prefix ? S.Just ('${noun}') : S.Nothing;

    const prefix = tag[1].substring (0, 2);
    // If recognized, return the appropriate ${...} placeholder. Otherwise, default to the original text.
    return S.fromMaybe (tag[0]) (lift (prefix));
};

const makeTemplate = text => {

    const tags = tagger.getTags (text);
    //console.log(tags);

    const xformed = S.map (xform) (tags);

    return xformed.join (' ');
};

const toSentences = paragraph => {
    const split = acc => tags => {
        const taken = S.takeWhile (tag => tag[1] !== '.') (tags); // Take up to the sentence terminator
        const rest = S.fromMaybe ([]) (S.drop (taken.length) (tags)); // Drop it
        const term = S.fromMaybe (['.', '.']) (S.head (rest)); // Get the terminator
        // Append to the accumulator and continue
        return tags.length === 0 ? acc : split (S.append (S.append (term) (taken)) (acc)) (S.fromMaybe ([]) (S.drop (1) (rest)));
    };
    const tags = tagger.getTags (paragraph);
    const sentences = split ([]) (tags);

    return S.map (S.joinWith (' ')) (S.map (S.map (xform)) (sentences));
};

//
// const text = 'Ya\'ll, now is the time for all good men to come, to the aid of their country. Or not? Maybe';
//
// const sentences = S.joinWith ('\n') (toSentences (text));
//
// console.log (sentences);

