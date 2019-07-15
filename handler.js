'use strict';


const Alexa = require('alexa-sdk');


// -----------------------------------------------------

const states = {
    STARTMODE: '_STARTMODE',
    POSSELECTMODE: '_POSSELECTMODE'
};

/* INTENT HANDLERS */

const NewSessionHandler = {
    'NewSession': function () {
        this.handler.state = states.STARTMODE;
        this.emit(':tell', 'Welcome to the interactive mad lib generator.')
    }
};

const startModeHandlers =
    Alexa.CreateStateHandler(states.STARTMODE, {
        'NewSession': function () {
            this.handler.state = states.POSSELECTMODE;
            this.emit(':ask', 'Please give me a verb.')
        },

        'SessionEndedRequest': function () {
            console.log('Session ended');
            this.emit(':tell', 'Your session has ended');
        },

        'Unhandled': function () {
            console.error(`Unhandled: ${this.handler.state}`);
            const message = "Sorry, I didn't quite get that one";
            this.emit(':tell', message);
        }
    });

const posSelectModeHandlers =
    Alexa.CreateStateHandler(states.POSSELECTMODE, {

        'PosSelectIntent': function () {
            const pos = this.event.request.intent.slots.pos.value;
            console.log(`Received: ${pos}`);
            // todo Hard-code the response
            this.attributes['pos'] = pos;
            this.handler.state = states.STARTMODE;
            this.emit(':tell', `OK, Thanks, I understood your selection is ${pos}.`)
        },

        'Unhandled': function () {
            console.error(`Unhandled: ${this.handler.state}`);
            const message = "Sorry, I didn't quite get that one";
            this.emit(':tell', message);
        }
    });


exports.madLib = function (event, context) {
    console.log(`REQUEST++++${JSON.stringify(event)}`);

    const alexa = Alexa.handler(event, context);

    alexa.registerHandlers(NewSessionHandler, startModeHandlers, posSelectModeHandlers);

    alexa.execute();

};

