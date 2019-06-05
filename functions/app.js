/**
Copyright (C) 2019 Christopher Brandt

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

Contact Info: xtopher.brandt at gmail
*/

'use strict';
 
const functions = require('firebase-functions');
const { dialogflow, Image, UpdatePermission, SimpleResponse, Suggestions, BasicCard, Button } = require('actions-on-google')
const moment = require( 'moment' );
const addTastingNote = require( './addTastingNote.js' );
const {google} = require('googleapis');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const app = dialogflow({debug: true});

const admin = require('firebase-admin');


app.intent('Default Welcome Intent', welcome );
app.intent('Default Fallback Intent', fallback );

app.intent('What Can You Do', help );

app.intent('Describe Bottle', addTastingNote.describeBottle );
app.intent('Tasting Details', addTastingNote.tastingDetails );
app.intent('Tasting Note Confirmation', addTastingNote.tastingNoteConfirmation );
app.intent('Tasting Details More', addTastingNote.tastingDetails );
app.intent('Tasting Note Confirmation - yes', addTastingNote.addTastingNote );

const welcomeSuggestions = [
    'Add a Note'
]

function welcome(conv) {

    console.log( 'Welcome' );

    var dayPartName = getDayPartName();

    conv.ask(new SimpleResponse({
        speech: `Good ${dayPartName}. How can I help you?`,
        text: `Good ${dayPartName}. How can I help you? V2019.1`
    }));
    
    conv.ask(new Suggestions(welcomeSuggestions));
}

function getDayPartName(){
    var hour = moment().utcOffset(-8, false ).hour();

    if ( hour > 2 && hour < 12 ) {
        return 'morning';
    }
    if ( hour >= 12 && hour < 18 ){
        return 'afternoon';
    }
    if ( hour >= 18 || hour <= 2 ){
        return 'evening'
    }
}

function fallback(conv) {
    
    console.log( 'Fallback' );

    conv.ask(new SimpleResponse({
        speech: `Sorry, I didn't catch that.`,
        text: `Here's a little help...`
    }));
        
    conv.ask( new BasicCard({
        title: `Smart Cellar`,
        subtitle: `Assistant Help`,
        text: `All you can do right now is **Add a Note**`
    }))

    conv.ask(new Suggestions(welcomeSuggestions));
    conv.contexts.set( 'Root', 1 );
}

function help(conv) {
    
    console.log( 'Help' );

    conv.ask(new SimpleResponse({
        speech: `All you can do right now is Add a Note. What would you like to do?`,
        text: `Here's a little help...`
    }));
    
    conv.ask( new BasicCard({
        title: `Smart Cellar`,
        subtitle: `Assistant Help`,
        text: `All you can do right now is **Add a Note**`
    }))

    conv.ask(new Suggestions(welcomeSuggestions));
    conv.contexts.set( 'Root', 1 );
}
/*
app.catch( (conv, e) => {
    console.error( `An unhandled exception was caught:\n ${e}` );
    conv.close( 'Oops. Something went really sideways. Kind of like someone switching my chardonnay with gasoline. Yuck. Give me minute to wash out my mouth, then try again.' );
  });
*/
module.exports = app;
