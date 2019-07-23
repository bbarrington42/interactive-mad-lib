'use strict';

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
            // todo Here we would generate the template and begin by asking for the first POS to fulfill the template
            // For now, we'll just assume a verb is the first POS
            const updatedIntent = {
                name: 'PosSelectIntent',
                slots: ['pos'],
                confirmationStatus: 'NONE'
            };
            this.emit (':elicitSlot', 'pos', 'Please select a verb', 'Try choosing a verb', updatedIntent);
        },

        'AMAZON.NoIntent': function () {
            console.log (`NoIntent: ${JSON.stringify (this.event)}`);
            this.emit (':tell', 'Ok, see you next time!');
        },

        'PosSelectIntent': function () {
            console.log (`PosSelectIntent: ${JSON.stringify (this.event)}`);
            this.handler.state = states.POSSELECTMODE;
            const intent = this.event.request.intent;
            // todo hard-coded to verb for now
            this.emit (':elicitSlot', 'pos', 'Please select a verb', 'Please select a verb', intent);
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

        'ConfirmPosSlot': function () {
            console.log (`ConfirmPosSlot: ${JSON.stringify (this.event)}`);
            const pos = this.event.request.intent.slots.pos.value;
            console.log (`Received: ${pos}`);
            // todo Hard-code the response
            this.attributes['pos'] = pos;
            this.handler.state = states.STARTMODE;
            this.emit (':tell', `OK, Thanks, I understood your selection is ${pos}`);
        },

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

