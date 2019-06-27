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

function getIntentOptionsContext( conv ){
    return conv.contexts.get( 'actions_intent_option' );
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

function getKeyFromContext( conv ){
    var context = getIntentOptionsContext( conv );
    if ( context ){
        return context.parameters.OPTION;
    }
}

function startLabelLookup( conv ){
        
    var vintage = getVintageFromContext( conv );
    var bottleName = getBottleNameFromContext( conv );

    var scraper = new Scraper();
    var labelQuery = `${vintage} ${bottleName}`;
   
    console.log( `Looking up: ${labelQuery}` );

    var promises = [];

    promises.push( scraper.wineLabelQuery( labelQuery ) );
    promises.push( LabelProcessor.findLabel( vintage, bottleName ) );

    return Promise.all( promises ).then( labels => { 
        var allLabels = flattenArray( labels );
        console.log( `   Found ${allLabels.length} labels`);
        labelLookupCompletion( conv, allLabels );

    }, reason => {
        console.log ( `Look up failed` );
        console.log( reason );
        var responseText = `Sorry, I couldn't find any information on a ${labelQuery}`
        setBadLabelInfoResponse( conv, responseText );
    });
}

function flattenArray( arr ){
    return arr.reduce((acc, val) => acc.concat(val), []);
}

function startLabelKeyLookup( conv ){
    
    var key = getKeyFromContext( conv );
   
    console.log( `Looking up: ${key}` );

    return LabelProcessor.findLabelByKey( key ).then( labels => {

        console.log( `  Found ${labels.length} labels in local storage.`);

        if ( labels && labels.length == 0 ){
            var responseText = `Hmmm. My bad, I can't actually find the details for that label.`;
            setBadLabelInfoResponse( conv, responseText );
        }
        else{
            labelLookupCompletion( conv, labels );
        }

    });
}

function labelLookupCompletion( conv, labels ) {

    if (labels && labels.length > 0) {
        resolveWwithGoodLabelInfo( conv, labels );
    }
    else{
        resolveWithBadLabelInfo( conv );
    }
}

function resolveWithBadLabelInfo( conv ) {
    console.log(`Sorry, I couldn't find any information on that label.`);
    var responseText = `Sorry, I couldn't find any information on that label`;
    setBadLabelInfoResponse(conv, responseText);
}

function resolveWwithGoodLabelInfo( conv, labels ) {
    setGoodLabelInfoResponse( conv, labels );
}

function setGoodLabelInfoResponse( conv, labels ){
    var contextName = identifyContext( conv );
    
    switch (contextName){
        case 'add_note' :{
            addNoteContextResponse( conv, labels );
            break;
        }
        case 'tell_me_about' :{
            tellMeAboutContextResponse( conv, labels );
            break;
        }
    }
}

function createLabelList( labels ){
    return new List({
        title: 'Bottle Labels Found',
        items: createLabelListItems( labels )
    });
}

function createLabelListItems( labels ){
    return labels.filter( ( item ) => {
        return item.key ? true : false;
    }).reduce( ( items, item, i ) => { 
        const keyName = `${item.key}`;
        items[keyName] = {
                synonyms: [
                    item.labelName,
                    i
                ],
                title: item.getLabelCardTitle(),
                description: `${item.blend} ${item.getUnformattedRegion()}`,
                image: new Image({
                    url : item.imageUrl,
                    alt : 'bottle lable picture'
                }) 
        };
        return items;
    }, {});
}

function addNoteContextResponse( conv, labels ){
    
    conv.ask( new SimpleResponse({
        speech: `Nice. Where did you taste it?`,
        text: `Where did you taste it?`
    }));

    conv.ask( createAddNoteCard( labels[0] ) );

    conv.contexts.set( 'Question_Location', 1 );
    conv.contexts.set( 'Describe_Bottle', 10 );
}

function createAddNoteCard( label ){
    return new BasicCard({
        title: label.labelName,
        subtitle: label.vintage,
        image: getImage( label.imageUrl, `Bottle Image` ),
        text: label.getFormattedText()
    })
}

function createTellMeAboutCard( label ){
    return new BasicCard({
        title: label.labelName,
        subtitle: label.vintage,
        image: getImage( label.imageUrl, `Bottle Image` ),
        text: label.getFormattedText()
    })
}

function tellMeAboutContextResponse( conv, labels ){

    if (labels.length == 1){
           
        conv.ask( new SimpleResponse({
            speech: `Here's what I found. Would you like to check another?`,
            text: `Here's what I found. Would you like to check another?`
        }));

        conv.ask( createTellMeAboutCard( labels[0] ) );
            
        conv.contexts.set( 'Question_Lookup_Another', 1 );
        conv.contexts.set( 'Describe_Bottle', 10 );
    }
    else{
 
        conv.ask( new SimpleResponse({
            speech: `Here's what I found. Which one would you like to review?`,
            text: `Here's what I found. Which one would you like to review?`
        }));

        conv.ask( createLabelList( labels ) );
            
        conv.contexts.set( 'Describe_Bottle', 10 );
        conv.contexts.set( 'Question_Bottle_Description', 1 );
    }
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

exports.select = function selectBottle( conv ){

    console.info( 'Select Bottle' );
    
    var key = getKeyFromContext( conv );

    if ( key ){
       return startLabelKeyLookup( conv )
    }
    else{
        var responseText = `Sorry, I didn't get that. Which bottle?`;
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