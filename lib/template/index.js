'use strict';

// Use Sanctuary as S and Fluture as Future - include types
const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});


const tagger = require ('../../lib/tagger');

// todo This is now obsolete since updating the form of the placeholders. I've decided to extract templates from
// todo mad-lib books, so this probably will just be deleted at some point instead of updating it.

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
        const rest = S.fromMaybe ([]) (S.drop (taken.length) (tags)); // Drop to get the rest
        const term = S.fromMaybe (['.', '.']) (S.head (rest)); // Get the terminator
        // Append it to the current sentence
        const sentence = S.append (term) (taken);
        // Append sentence to the accumulator and continue
        return tags.length === 0 ? acc : split (S.append (sentence) (acc)) (S.fromMaybe ([]) (S.drop (1) (rest)));
    };

    const tags = tagger.getTags (paragraph);
    const sentences = split ([]) (tags);
    //console.log (`sentences: ${sentences}`);

    return S.pipe ([
        S.map (S.map (xform)),
        S.map (S.joinWith (' '))
    ]) (sentences);
};

//
// const text = 'Look, those portions of the president\'s track records on race are very well-known, his line of his rapist from his campaign launch event. His call for a total and complete shutdown of Muslims entering the U.S. His smear of a, quote, Mexican federal judge who was born in Indiana. His s-hole countries insult and, of course, the shameful event known shorthand as Charlottesville, which is the tarnishing the name of a great city. ';
//
// const sentences = toSentences (text);
//
// console.log (sentences);

