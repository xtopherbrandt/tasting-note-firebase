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
const { dialogflow, Image, UpdatePermission, SimpleResponse, Suggestions, List, BasicCard, Table } = require('actions-on-google')

function getInputVintage( conv ){
    return conv.parameters.vintage;
}

function getInputBottleName( conv ){
    return conv.parameters.bottleName;
}

function getTastingDetail( conv ){
    return conv.parameters.tastingDetail;
}

exports.describeBottle = function describeBottle( conv ){

    var vintage = getInputVintage( conv );
    var bottleName = getInputBottleName( conv );

    if ( vintage && bottleName ){
        conv.ask( new SimpleResponse({
            speech: `Nice. A ${vintage} ${bottleName}. Where did you taste it?`,
            text: `A ${vintage} ${bottleName}. Where did you taste it?`
        }))
        
        conv.contexts.set( 'Question_Location', 1 );
        conv.contexts.set( 'Describe_Bottle', 10 );
    }
    else{
        
        conv.ask(new SimpleResponse({
            speech: `Sorry, I didn't get that. What was the vintage and bottle label name?`,
            text: `Sorry, I didn't get that. What was the vintage and bottle label name?`
        }));

        conv.contexts.set( 'Question_Bottle_Description', 1 );
    }

}

exports.tastingDetails = function tastingDetails( conv ){

    var tastingDetail = getTastingDetail( conv );

    if ( tastingDetail ){
        conv.ask( new SimpleResponse({
            speech: `Noted. Any other details?`,
            text: `Noted. Any other details?`
        }))
        
        conv.contexts.set( 'Question_Notes', 1 );
        conv.contexts.set( 'Describe_Bottle', 10 );
    }
    else{
        
        conv.ask(new SimpleResponse({
            speech: `I don't understand. Could you repeat that?`,
            text: `I don't understand. Could you repeat that?`
        }));

        conv.contexts.set( 'Question_Notes', 1 );
    }

}

exports.addTastingNote = function addTastingNote( conv ){
 
    conv.close(new SimpleResponse({
        speech: `Done! Tasting note added.`,
        text: `Done! Tasting note added.`
    }));

}