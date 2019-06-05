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
var serviceAccount = require('./serviceAccountKey.json');
const Label = require('./label.js');

const client = algoliasearch('4UGMV9KS0C', 'f591a817b19de8c74a8b3ed05e236486');
const index = client.initIndex('dev_LabelName');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://csvread-d149c.firebaseio.com'
});

const firestore = admin.firestore();

exports.findLabel = function findLabel ( vintage, labelName ){

    var algoliIndexSearch = index.search( { query: labelName } )
        .then( response => {
            var labelHits = [];

            labelHits = response.hits.filter( vintageCheck, vintage );

            return labelHits.map( hitToLabel );
        })
        .catch(err => {
            console.log('Error getting documents', err);
        });

        return algoliIndexSearch;

}
  
exports.addLabel = function addLabel ( label ){
    let documentRef = firestore.collection('labels').doc();

    documentRef.create( label.toJSON() ).then((res) => {
      console.log(`Label added: ${label.labelName}`);
      addIndex( label );
    }).catch((err) => {
      console.log(`Failed to create document: ${err}`);
    });
}

function addIndex( label ){
    index.addObject( label )
        .then( response => {
            console.log( `Label added to search index. Object ID: ${response.objectID}`);
        })
        .catch( err => {
            console.log( `Error adding index for label : ${label.labelName} \n error: ${err}`);
        });
}

function vintageCheck( label ){
    return ( label.Vintage == this );
}

function hitToLabel( hit ){
    return new Label( 
        hit.Vintage, 
        hit.Blend, 
        hit.PartitionKey, 
        hit.LabelName, 
        hit.ProprietaryName, 
        hit.ImageUrl, 
        hit.country, 
        hit.region, 
        hit.subRegion, 
        hit.appellation,
        hit.RowKey, 
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
