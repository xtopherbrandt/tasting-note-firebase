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

const Scraper = require( './wine-searcher-scraper');
const LabelProcessor = require( './labelProcessor' );
const functions = require('firebase-functions');
const { dialogflow, Image, UpdatePermission, SimpleResponse, Suggestions, List, BasicCard, Table } = require('actions-on-google')

function getAddNoteContext( conv ){
    return conv.contexts.get( 'add_note' );
}

function getVintageFromContext( conv ){
    var context = getAddNoteContext( conv );
    if ( context ){
        return context.parameters.vintage;
    }
}

function getBottleNameFromContext( conv ){
    var context = getAddNoteContext( conv );
    if ( context ){
        return context.parameters.bottleName;
    }
}

function getTastingLocationFromContext( conv ){
    var context = getAddNoteContext( conv );
    if ( context ){
        return context.parameters.location;
    }
}

function getRatingFromContext( conv ){
    var context = getAddNoteContext( conv );
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

function getRowKeyFromContext( conv ){
    var context = getAddNoteContext( conv );
    if ( context ){
        return context.parameters.rowKey;
    }
}

function startLabelLookup( conv ){
    
    var vintage = getVintageFromContext( conv );
    var bottleName = getBottleNameFromContext( conv );

    var scraper = new Scraper();
    var labelQuery = `${vintage} ${bottleName}`;
   
    console.log( `Looking up: ${labelQuery}` );

    return LabelProcessor.findLabel( vintage, bottleName ).then( labels => {

        console.log( `  Found ${labels.length} labels in local storage.`);

        if ( labels && labels.length == 0 ){
            return scraper.wineLabelQuery( labelQuery ).then( labels => {
                LabelProcessor.addLabel( labels[0] );
                labelLookupCompletion( labels, conv, labelQuery );
        
            }).catch(( err ) => {
                console.log ( `exception caught; lookup resolved: ${labelLookupResolved}; responses remaining: ${labelResponsesRemaining}`);
                console.log( err );
                console.log('Could not scape the wine from wine searcher' );
                var responseText = `Sorry, I couldn't find any information on a ${labelQuery}`
                return new Promise( (resolve, reject) => {
                    setBadLabelInfoResponse( conv, responseText );
                    resolve();
                })
                
            });
        }
        else{
            return new Promise( (resolve, reject) => {
                labelLookupCompletion(labels, conv, labelQuery);
                resolve();
            });
            
        }

    });
}

function labelLookupCompletion(labels, conv, labelQuery) {

    if (labels && labels.length > 0) {
        resolveWwithGoodLabelInfo(labels, conv);
    }
    else{
        resolveWithBadLabelInfo(labelQuery, conv);
    }
}

function resolveWithBadLabelInfo(labelQuery, conv) {
    console.log(`Sorry, I couldn't find any information on a ${labelQuery}`);
    var responseText = `Sorry, I couldn't find any information on a ${labelQuery}`;
    setBadLabelInfoResponse(conv, responseText);
}

function resolveWwithGoodLabelInfo(labels, conv) {
    var label = labels[0];
    console.log(label.toJSON());
    setGoodLabelInfoResponse(conv, label);
}

function setGoodLabelInfoResponse( conv, label ){
    
    conv.ask( new SimpleResponse({
        speech: `Nice. Where did you taste it?`,
        text: `Where did you taste it?`
    }));

    conv.ask( new BasicCard({
        title: label.labelName,
        subtitle: label.vintage,
        image: getImage( label.imageUrl, `Bottle Image` ),
        text: label.getFormattedText()
    }));

    conv.contexts.set( 'Question_Location', 1 );
    conv.contexts.set( 'Describe_Bottle', 10 );
}

function getImage( url, altText ){
    return new Image({
        url: url,
        alt: altText
    });
}

function setBadLabelInfoResponse( conv, responseText ){
                
    conv.ask(new SimpleResponse({
        speech: responseText,
        text: responseText
    }));

    conv.contexts.set( 'Question_Bottle_Description', 1 );
}

function addNoteDetail( conv, detail ){

}

exports.describeBottle = function describeBottle( conv ){

    console.info( 'Describe Bottle' );
    
    var vintage = getVintageFromContext( conv );
    var bottleName = getBottleNameFromContext( conv );

    if ( vintage && bottleName ){
        return startLabelLookup( conv );
    }
    else{
        var responseText = `Sorry, I didn't get that. What was the vintage and bottle label name?`;
        setBadLabelInfoResponse( conv, responseText );
    }
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


exports.removeLabelFromSystem = function removeLabelFromSystem( conv ){
    console.log( 'Remove Label From System' );

    var rowKey = getRowKeyFromContext( conv );

    if ( rowKey ){
        LabelProcessor.removeLabelFromSystem( rowKey );
    }

  
    conv.close(new SimpleResponse({
        speech: `Ok.`,
        text: `Ok.`
    }));
}