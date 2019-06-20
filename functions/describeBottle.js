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

const contexts = [ 'add_note', 'tell_me_about' ];

function getContext( conv ){
    var contextName = identifyContext( conv );
    return conv.contexts.get( contextName );
}

function identifyContext( conv ){
    var contextsFound = contexts.filter( contextFilter, conv );
    if ( contextsFound && contextsFound[0] ){
        return contextsFound[0];
    }
    else{
        return '';
    }
}

function contextFilter( contextName ){
    return this.contexts.get( contextName ) ? true : false;
}

function getVintageFromContext( conv ){
    var context = getContext( conv );
    if ( context ){
        return context.parameters.vintage;
    }
}

function getBottleNameFromContext( conv ){
    var context = getContext( conv );
    if ( context ){
        return context.parameters.bottleName;
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

function setGoodLabelInfoResponse( conv, label){
    var contextName = identifyContext( conv );
    
    switch (contextName){
        case 'add_note' :{
            addNoteContextResponse( conv, label );
            break;
        }
        case 'tell_me_about' :{
            tellMeAboutContextResponse( conv, label );
            break;
        }
    }
}

function addNoteContextResponse( conv, label ){
    
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
 
function tellMeAboutContextResponse( conv, label ){
    
    conv.ask( new SimpleResponse({
        speech: `Here's what I found. Would you like to check another?`,
        text: `Here's what I found. Would you like to check another?`
    }));

    conv.ask( new BasicCard({
        title: label.labelName,
        subtitle: label.vintage,
        image: getImage( label.imageUrl, `Bottle Image` ),
        text: label.getFormattedText()
    }));

    conv.contexts.set( 'Question_Lookup_Another', 1 );
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

function getRowKeyFromContext( conv ){
    var context = getContext( conv );
    if ( context ){
        return context.parameters.rowKey;
    }
}


exports.start = function describeBottle( conv ){

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