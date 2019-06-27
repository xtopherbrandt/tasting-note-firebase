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

var admin = require('firebase-admin');
const algoliasearch = require('algoliasearch');
var serviceAccount = require('./TastingNote-7b5f997b651b.json');
const Label = require('./label.js');

const client = algoliasearch('4UGMV9KS0C', 'f591a817b19de8c74a8b3ed05e236486');
const index = client.initIndex('dev_LabelName');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://csvread-d149c.firebaseio.com'
});

const firestore = admin.firestore();

exports.findLabel = function findLabel ( vintage, labelName ){

    console.log ( `  in Algolia`);
    
    return index.search( { query: labelName } )
        .then( response => {
            var labelHits = [];

            labelHits = response.hits.filter( vintageCheck, vintage );

            return labelHits.map( hitToLabel );
        })
        .catch(err => {
            console.log('Error getting documents', err);
            return [];
        });
}


exports.findLabelByKey = ( key ) => {

    console.log ( `  in Algolia`);
    
    return index.search( { query: key } )
        .then( response => {
            var labelResponse = [];

            switch ( response.hits.length ){
                case 0 :{
                    console.log( `Label key not found : ${key}` );
                    break;
                }
                case 1 :{
                    labelResponse.push( hitToLabel( response.hits[0] ) );
                    break;
                }
                default :{
                    console.log( `Multiple hits for : ${key}. Returning the first` );
                    labelResponse.push( hitToLabel( response.hits[0] ) );
                    break;
                }
            }
 
            return labelResponse;
        })
        .catch(err => {
            console.log('Error getting documents', err);
            return [];
        });
}
  
exports.addLabel = function addLabel ( label ){
    let documentRef = firestore.collection('labels').doc();

    if ( label.isValid() ){
        documentRef.create( label.toJSON() ).then((res) => {
            console.log(`Label added: ${label.labelName} RowKey: ${label.key}`);
            addIndex( label );
          }).catch((err) => {
            console.log(`Failed to create document: ${err}`);
          });
    }
}

function addIndex( label ){
    index.addObject( label )
        .then( response => {
            console.log( `Label added to search index. Object ID: ${response.objectID} RowKey: ${label.key}`);
        })
        .catch( err => {
            console.log( `Error adding index for label : ${label.labelName} \n error: ${err}`);
        });
}

exports.removeLabelFromSystem = function removeLabel ( rowKey ){
    console.log( `Removing label row key: ${rowKey}`);
    deleteLabelIndicesByRowKey( rowKey )
        .then( () => {
            console.log( `Label index successfully deleted.` );
            deleteLabelDocument( rowKey ).then(() => {
                console.log('Label successfully deleted.');
              });;
        });
}

function deleteLabelIndicesByRowKey( rowKey ){
    return index.search( {query: rowKey} )
        .then( response => {
            response.hits.map( deleteIndexHitObject );
        });
}

function deleteIndexHitObject( hit ){
    console.log( `Deleting index object ${hit.objectID}` );
    return index.deleteObject( hit.objectID );
}

function deleteLabelDocument( rowKey ){
    var labelsRef = firestore.collection( 'labels' );
    return labelsRef.where( 'rowKey', '==', rowKey ).get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }
        
            snapshot.forEach(doc => {
                console.log(`Deleting : ${doc.id} => ${doc.data()}`);
                doc.ref.delete();
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
}

function vintageCheck( label ){
    return ( label.vintage == this );
}

function hitToLabel( hit ){
    return new Label( 
        hit.vintage, 
        hit.blend, 
        hit.partitionKey, 
        hit.labelName, 
        hit.proprietaryName, 
        hit.imageUrl, 
        hit.country, 
        hit.region, 
        hit.subRegion, 
        hit.appellation,
        hit.rowKey, 
        hit.style, 
        hit.averagePrice, 
        hit.criticsScore, 
        hit.communityScore, 
        hit.foodPairing );
}

function lookupLabelByVintageAndKey( vintage, rowKey ){
    var labelsRef = firestore.collection( 'labels' );
    var queryRef = labelsRef.where( 'vintage', '==', vintage ).where( 'rowKey', '==', rowKey ).get()
        .then(snapshot => {
            if (snapshot.empty) {
            console.log('No matching documents.');
            return;
            }
        
            snapshot.forEach(doc => {
            console.log(doc.id, '=>', doc.data());
            });
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });
    
        return queryRef;
}
