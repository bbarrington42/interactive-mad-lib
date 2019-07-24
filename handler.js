'use strict';

const {create, env} = require ('sanctuary');

const {env: flutureEnv} = require ('fluture-sanctuary-types');

const S = create ({
    checkTypes: process.env.NODE_ENV !== 'production',
    env: env.concat (flutureEnv)
});

const Future = require ('fluture');

const {selectTemplate, nextPlaceholder, updateNextPlaceholder} = require ('./lib/session-state');

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
// todo Add custom messaging
// todo Try to use 'Alexa' as 'this' so this does not require being called after 'bind'
function elicitPosSlot() {
    this.handler.state = states.POSSELECTMODE;
    const template = this.attributes.template;

    const maybePos = nextPlaceholder (template);
    if (S.isNothing (maybePos)) {
        this.handler.state = states.STARTMODE;
        this.emit (':ask', `Your completed mad-lib is: ${template}. Would you like to play again?`, 'Please answer Yes or No');
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

        this.emit (':elicitSlot', 'pos', `'Please select a ${pos}'`, `'Try choosing a ${pos}'`, updatedIntent);
    }
}


/* INTENT HANDLERS */

const NewSessionHandler = {
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
            const message = 'Sorry, unhandled start mode';
            this.emit (':ask', message, 'Please try again');
        }
    });

const posSelectModeHandlers =
    Alexa.CreateStateHandler (states.POSSELECTMODE, {

        'PosSelectIntent': function () {
            console.log (`PosSelectIntent: ${JSON.stringify (this.event)}`);
            const pos = this.event.request.intent.slots.pos.value;
            const intendedPos = this.attributes.pos;
            this.attributes['selectedPos'] = pos;
            console.log (`Received: ${pos}`);
            console.log (`attributes: ${JSON.stringify (this.attributes)}`);

            // todo Validate that 'intendedPos' is indeed the required POS. If not, re-solicit
            // For now, just assume the value is the intended POS. Ask for a confirmation.
            this.handler.state = states.POSCONFIRMMODE;
            
            this.emit (':ask', `OK, I understood your selection is ${pos}. Is this correct?`, `Is ${pos} correct?`);
        },

        'SessionEndedRequest': function () {
            console.log ('Session ended');
            this.emit (':tell', 'Your session has ended');
        },

        'Unhandled': function () {
            console.error (`Unhandled: ${this.handler.state}`);
            const message = 'Sorry, unhandled piece of speech mode';
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

        'Unhandled': function () {
            console.error (`Unhandled: ${this.handler.state}`);
            const message = 'Sorry, unhandled confirmation';
            this.emit (':tell', message);
        }
    });


exports.madLib = function (event, context) {
    console.log (`REQUEST++++${JSON.stringify (event)}`);

    const alexa = Alexa.handler (event, context);

    alexa.appId = APP_ID;

    alexa.registerHandlers (NewSessionHandler, startModeHandlers, posSelectModeHandlers, posConfirmModeHandlers);

    alexa.execute ();

};

