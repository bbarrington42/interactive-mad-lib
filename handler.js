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

            const pos = S.maybeToNullable (nextPlaceholder (template));

            this.handler.state = states.POSSELECTMODE;
            this.attributes['template'] = S.maybeToNullable (template);

            /*
             export interface Intent {
             'name': string;
             'slots'?: {
             [key: string]: Slot;
             };
             'confirmationStatus': IntentConfirmationStatus;
             }

             export interface Slot {
             'name': string;
             'value'?: string;
             'confirmationStatus': SlotConfirmationStatus;
             'resolutions'?: slu.entityresolution.Resolutions;
             }
             */


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
            console.log (`Received: ${pos}`);
            // todo Confirm POS and either reprompt or update template and get the next POS
            // todo If the template is filled out, :tell it to the player(s) and repeat or exit.
            console.log (`attributes: ${JSON.stringify(this.attributes)}`);
            this.emit (':tell', `OK, Thanks, I understood your selection is ${pos}`);
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


exports.madLib = function (event, context) {
    console.log (`REQUEST++++${JSON.stringify (event)}`);

    const alexa = Alexa.handler (event, context);

    alexa.appId = APP_ID;

    alexa.registerHandlers (NewSessionHandler, startModeHandlers, posSelectModeHandlers);

    alexa.execute ();

};

