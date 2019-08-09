'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});


const {selectTemplate, nextPlaceholder, updateNextPlaceholder} = require ('./lib/session-state');

const {isPOS} = require ('./lib/tagger');

const Alexa = require ('alexa-sdk');
const APP_ID = 'amzn1.ask.skill.81ca916f-affa-45e2-a213-029ebe407dec';

// -----------------------------------------------------

const states = {
    STARTMODE: '_STARTMODE',
    POSSELECTMODE: '_POSSELECTMODE',
    POSCONFIRMMODE: '_POSCONFIRMMODE'
};

// Helpers
// NOTE: This CANNOT be declared using fat arrow notation as it would not be possible to bind the 'this' pointer
// This MUST be bound in order to work properly.
function elicitPosSlot() {
    this.handler.state = states.POSSELECTMODE;
    const template = this.attributes.template;

    const maybePos = nextPlaceholder (template);
    if (S.isNothing (maybePos)) {
        this.handler.state = states.STARTMODE;
        this.emit (':ask', `Your completed mad-lib is: ${template}. Would you like to play again?`, 'Please answer yes or no');
    } else {

        const pos = S.maybeToNullable (maybePos);

        // Save the intended POS
        this.attributes['pos'] = pos;

        const updatedIntent = {
            name: 'PosSelectIntent',
            slots: {
                pos: {
                    name: 'pos',
                    value: `'${pos}'`,
                    confirmationStatus: 'NONE'
                }
            },
            confirmationStatus: 'NONE'
        };

        const prep = pos.startsWith('a') ? 'an' : 'a';

        this.emit (':elicitSlot', 'pos', `Please select ${prep} ${pos}`, `Try choosing ${prep} ${pos}`, updatedIntent);
    }
}


/* INTENT HANDLERS */

const newSessionHandler = {
    'NewSession': function () {
        this.handler.state = states.STARTMODE;
        this.emit (':ask', 'Welcome to the interactive mad lib generator. Would you like to play?');
    }
};

const startModeHandlers =
    Alexa.CreateStateHandler (states.STARTMODE, {
        'AMAZON.YesIntent': function () {
            console.log (`YesIntent: ${JSON.stringify (this.event)}`);

            const template = selectTemplate ();

            this.attributes['template'] = template;

            elicitPosSlot.bind (this) ();
        },

        'AMAZON.NoIntent': function () {
            console.log (`NoIntent: ${JSON.stringify (this.event)}`);
            this.emit (':tell', 'Ok, see you next time!');
        },

        'SessionEndedRequest': function () {
            console.log ('Session ended');
            this.emit (':tell', 'Your session has ended');
        },

        'Unhandled': function () {
            console.error (`Unhandled: ${this.handler.state}`);
            const message = 'Sorry, I don\'t know what to do now';
            this.emit (':ask', message, 'Please try again');
        }
    });

const posSelectModeHandlers =
    Alexa.CreateStateHandler (states.POSSELECTMODE, {

        'PosSelectIntent': function () {
            console.log (`PosSelectIntent: ${JSON.stringify (this.event)}`);
            const pos = this.event.request.intent.slots.pos.value;
            // todo 'pos' will contain an object (text & lexer code)
            const intendedPos = this.attributes.pos;
            this.attributes['selectedPos'] = pos;
            console.log (`Received: ${pos}`);
            console.log (`attributes: ${JSON.stringify (this.attributes)}`);

            if (!isPOS (intendedPos) (pos)) {
                this.emit (':elicitSlot', 'pos',
                    `${pos} does not appear to be a ${intendedPos}. Please select another ${intendedPos}`,
                    `Please select a ${intendedPos}`, this.event.request.intent);
            } else {
                this.handler.state = states.POSCONFIRMMODE;

                this.emit (':ask', `You selected ${pos}. Is this correct?`, `Is ${pos} correct?`);
            }
        },

        'SessionEndedRequest': function () {
            console.log ('Session ended');
            this.emit (':tell', 'Your session has ended');
        },

        'Unhandled': function () {
            console.error (`Unhandled: ${this.handler.state}`);
            const message = 'Sorry, I don\'t know what to do now';
            this.emit (':tell', message);
        }

    });

const posConfirmModeHandlers =
    Alexa.CreateStateHandler (states.POSCONFIRMMODE, {
        'AMAZON.YesIntent': function () {
            console.log (`${JSON.stringify (this.event)}`);
            // Update the template with the selected POS
            const pos = this.attributes.selectedPos;
            const template = this.attributes.template;
            this.attributes.template = updateNextPlaceholder (template) (pos);

            // Go for the next POS
            elicitPosSlot.bind (this) ();
        },

        'AMAZON.NoIntent': function () {
            console.log (`${JSON.stringify (this.event)}`);

            // Try again
            elicitPosSlot.bind (this) ();
        },

        'SessionEndedRequest': function () {
            console.log ('Session ended');
            this.emit (':tell', 'Your session has ended');
        },

        'Unhandled': function () {
            console.error (`Unhandled: ${this.handler.state}`);
            const message = 'Sorry, I don\'t know what to do now';
            this.emit (':tell', message);
        }
    });


exports.madLib = function (event, context) {
    console.log (`REQUEST++++${JSON.stringify (event)}`);

    const alexa = Alexa.handler (event, context);

    alexa.appId = APP_ID;

    alexa.registerHandlers (newSessionHandler, startModeHandlers, posSelectModeHandlers, posConfirmModeHandlers);

    alexa.execute ();

};

