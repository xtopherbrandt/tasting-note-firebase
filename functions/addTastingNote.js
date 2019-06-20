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

function getTastingLocationFromContext( conv ){
    var context = getContext( conv );
    if ( context ){
        return context.parameters.location;
    }
}

function getRatingFromContext( conv ){
    var context = getContext( conv );
    if ( context ){
        return context.parameters.rating;
    }
}

function getTastingDetailFromCurrentRequest( conv ){
    return conv.parameters.tastingDetail;
}

function addTastingDetailToConversationStore( conv, detail ){
    if ( conv.data.tastingDetails ){
        conv.data.tastingDetails.push( detail );
    }
    else{
        conv.data.tastingDetails = [detail];
    }
}

function getTastingDetailsFromConversationStore( conv ){
    return conv.data.tastingDetails;
}

function getTastingDetailsAsCommaSeparatedList( conv ){
    var detailArray = getTastingDetailsFromConversationStore( conv );
    var listText = '';

    detailArray.reduce( ( listText, curr )=>{
        listText += curr;
        listText += ', ';
    })

    return listText;
}

function addNoteDetail( conv, detail ){

}

exports.tastingDetails = function tastingDetails( conv ){

    var tastingDetail = getTastingDetailFromCurrentRequest( conv );

    if ( tastingDetail ){
        conv.ask( new SimpleResponse({
            speech: `Noted. Any other details?`,
            text: `Noted. Any other details?`
        }))
        
        addTastingDetailToConversationStore( conv, tastingDetail );
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

exports.tastingNoteConfirmation = function tastingNoteConfirmation( conv ){

    var vintage = getVintageFromContext( conv );
    var bottleName = getBottleNameFromContext( conv );
    var location = getTastingLocationFromContext( conv );
    var rating = getRatingFromContext( conv );
    var details = getTastingDetailsFromConversationStore( conv );

    var response = `Awesome! Here's the note I'll add. It is a ${vintage} ${bottleName} that you tasted at ${location} and gave it ${rating} stars. You noted: ${details} . Is this correct?`;

    conv.close(new SimpleResponse({
        speech: response,
        text: response
    }));

}

exports.addTastingNote = function addTastingNote( conv ){
 
    conv.close(new SimpleResponse({
        speech: `Done! Tasting note added.`,
        text: `Done! Tasting note added.`
    }));

}

