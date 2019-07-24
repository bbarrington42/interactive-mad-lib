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
function elicitPosSlot() {
    this.handler.state = states.POSSELECTMODE;
    const template = this.attributes.template;

    // Default to noun for lack of anything better
    // todo If 'nextPlaceholder' returns Nothing, then we should prompt to have the filled out template read back here!
    const pos = S.fromMaybe ('noun') (nextPlaceholder (template));

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
            // todo Confirm POS and either reprompt or update template and get the next POS
            // todo If the template is filled out, :tell it to the player(s) and repeat or exit.

            // For now, assume the value is the intended POS. Just ask for a confirmation.
            this.handler.state = states.POSCONFIRMMODE;


            this.emit (':ask', `OK, I understood your selection is ${pos}. Is this correct?`, `Is ${pos} correct?`);
        },

        // 'ConfirmPosSlot': function () {
        //     console.log (`ConfirmPosSlot: ${JSON.stringify (this.event)}`);
        //     const pos = this.event.request.intent.slots.pos.value;
        //     console.log (`Received: ${pos}`);
        //     // todo Hard-code the response
        //     this.attributes['pos'] = pos;
        //     this.handler.state = states.STARTMODE;
        //     this.emit (':tell', `OK, Thanks, I understood your selection is ${pos}`);
        // },

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
        }
    });


exports.madLib = function (event, context) {
    console.log (`REQUEST++++${JSON.stringify (event)}`);

    const alexa = Alexa.handler (event, context);

    alexa.appId = APP_ID;

    alexa.registerHandlers (NewSessionHandler, startModeHandlers, posSelectModeHandlers, posConfirmModeHandlers);

    alexa.execute ();

};

