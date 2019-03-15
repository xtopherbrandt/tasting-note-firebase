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

const uuidv4 = require('uuid/v4');
const ResponseFormatter = require( './responseFormatter');

module.exports = class Label {
    constructor( ){

        //** FIX ME */
        this.context = null;
        this.tableService = null

    }

    setLabelParameters ( vintage, blend, producer, labelName, proprietaryName, imageUrl, country, region, subRegion, appellation, key, style, averagePrice, criticsScore, communityScore, foodPairing ) {
        this.key = key
        this.vintage = vintage;
        this.blend = blend; // either the predominant grape varietal in the blend or the name of the pre-defined blend (Red Bordeaux, Burgundy...)
        this.producer = producer;
        this.labelName = labelName;
        this.proprietaryName = proprietaryName;
        this.imageUrl = imageUrl;
        this.country = country;
        this.region = region;
        this.subRegion = subRegion;
        this.appellation = appellation;
        this.style = style;
        this.averagePrice = averagePrice;
        this.criticsScore = criticsScore;
        this.communityScore = communityScore;
        this.foodPairing = foodPairing;
    }

    static LoadTableRecord( record, label ){
        label.key = record.RowKey._;
        label.vintage = record.Vintage._;
        label.blend = record.Blend._;
        label.producer = record.PartitionKey._;
        label.labelName = record.LabelName._;
        if ( 'ImageUrl' in record ){
            label.imageUrl = record.ImageUrl._;
        }
        if ( 'country' in record ){
            label.country = record.country._;
        }
        if ( 'region' in record ){
            label.region = record.region._;
        }
        if ( 'subRegion' in record ){
            label.subRegion = record.subRegion._;
        }
        if ( 'appellation' in record ){
            label.appellation = record.appellation._;
        }
        if ( 'style' in record ){
            label.style = record.style._;
        }
        if ( 'averagePrice' in record ){
            label.averagePrice = record.averagePrice._;
        }
        if ( 'criticsScore' in record ){
            label.criticsScore = record.criticsScore._;
        }
        if ( 'communityScore' in record ){
            label.communityScore = record.communityScore._;
        }
        if ( 'foodPairing' in record ){
            label.foodPairing = record.foodPairing._;
        }
    }

    updateTo( otherLabel ){
        this.imageUrl = otherLabel.imageUrl;
        this.criticsScore = otherLabel.criticsScore;
        this.communityScore = otherLabel.communityScore;
        this.foodPairing = otherLabel.foodPairing;
        this.averagePrice = otherLabel.averagePrice;
        this.attribution = otherLabel.attribution;
        
        if (!this.blend) { this.blend = otherLabel.blend; }
        if (!this.country ) { this.country = otherLabel.country; }
        if (!this.region) {this.region = otherLabel.region; }
        if (!this.subRegion) {this.subRegion = otherLabel.subRegion; }
        if (!this.appellation) {this.appellation = otherLabel.appellation; }
        if (!this.style) {this.style = otherLabel.style; }

        this.updateThisLabel();
    }

    isValid( ){
        if( this.producer && this.labelName ){
            return true;
        }
    
        return false;
    }

    equivalentTo( otherLabel ){
        if ( !otherLabel ) return false;
        if ( !this.isValid() ) return false; 
        if ( this.vintage != otherLabel.vintage ) return false;
        if ( this.producer != otherLabel.producer ) return false;
        if ( this.labelName != otherLabel.labelName ) return false;
        
        return true;
    }

    beginFindByKey( producer, key ){
        this.producer = producer;
        this.key = key;

        return this.beginFind();
    }

    beginFind(){
        var query = this.constructQuery( );

        return this.beginQuery( query ).then( result => { 

            if ( result.entries.length > 0 ){
                Label.LoadTableRecord( result.entries[0], this );

                if ( console ){
                    console.log( `Found ${result.entries.length} label(s). Using key: ${this.key}` );
                }

                return true;
            }
            else{
                return false;
            }
        });

    }

    constructQuery(){
        if ( this.key ){
            return this.constructQueryWithKey();
        }
        else{
            return this.constructQueryWithoutKey();
        }
    }

    constructQueryWithoutKey( ) {
        return new azure.TableQuery().where( 'PartitionKey eq ?', this.producer ).and( 'Vintage eq ?', this.vintage ).and( 'LabelName eq ?', this.labelName );
    }     

    constructQueryWithKey( ) {
        return new azure.TableQuery().where( 'PartitionKey eq ?', this.producer ).and( 'RowKey eq ?', this.key );
    }     

    static ConstructQueryForAll( ) {
        return new azure.TableQuery();
    }

    beginQuery( query ){
        return new Promise( ( resolve, reject ) => {
            this.tableService.queryEntities( 'Label', query, null, ( error, result ) => {
                if ( error ){
                    reject( error );
                }
                else{
                    resolve( result );
                }
            });
        });

    }

    addIfUnknown(){
        return this.beginFind().then( labelFound => { 
            if ( !labelFound ) {
                 this.addThisLabel(); 
            }

            return this;
        });
    }

    addThisLabel(){
        if ( this.context ){        
            this.context.bindings.labelOutputTable = [];
            this.key = uuidv4();

            this.context.bindings.labelOutputTable.push( this.getLabelEntity() );
        }    
    }

    getLabelEntity(){
        return {
            PartitionKey: this.producer,
            RowKey: this.key,
            Vintage: this.vintage,
            LabelName: this.labelName,
            ImageUrl: this.imageUrl,
            Blend: this.blend,
            ProprietaryName: this.proprietaryName,
            country: this.country,
            region: this.region,
            subRegion: this.subRegion,
            appellation: this.appellation,
            style: this.style,
            averagePrice: this.averagePrice,
            criticsScore: this.criticsScore,
            communityScore: this.communityScore,
            foodPairing: this.foodPairing,
            attribution: this.attribution,
        };
    }

    updateThisLabel(){

        var labelEntityUpdate = this.getLabelEntity();

        this.tableService.mergeEntity( 'Label', labelEntityUpdate, (error, result) => this.processUpdateLabelEntityResponse( this.context, error, result ) );

    }

    processUpdateLabelEntityResponse( context, error, result ){

        if ( !error ){
            if ( console ){
                console.log( `Updated label for: ${this.vintage} ${this.labelName}`);
            }
        }
        else{
            if ( console ){
                console.error( `Error updating label for: ${this.vintage} ${this.labelName}. Error: ${error}`);
            }
        }
    }
    
    static beginGetAll( context ){
        var query = Label.ConstructQueryForAll();

        return Label.GetAllLabels( context, query ).then( result => { 

            if ( result.entries.length > 0 ){
                return Label.LoadASetOfLabels( context, result.entries );
            }
            else{
                return [];
            }
        });

    }

    static GetAllLabels( context, query ){
        return new Promise(( resolve, reject ) => {
            
            var tableService = azure.createTableService();

            tableService.queryEntities( "Label", query, null, ( error, result ) => {
                if ( result ){
                    resolve ( result );
                }
                else{
                    reject( error );
                }
            });
        });
    }

    static LoadASetOfLabels( context, records ){
        var labelSet = [];
        for ( var i = 0; i < records.length; i++ ){
            var record =  records[i];
            var label = new Label( context );
            Label.LoadTableRecord( record, label );
            labelSet.push( label );
        }
        return labelSet;
    }

    //** Response Formatting */
    getLabelCardTitle(){

        return `${this.vintage} ${this.labelName}`;

    }

    getLabelListItemTitle( numberInList ){

        return `${numberInList}. ${this.vintage} ${this.labelName}`;

    }

    getLabelCardSubtitle( ){
        return `${this.blend}`;
    }
    
    getFormattedText( ){

        var formattedText = '';

        formattedText += this.getFormattedProducer();
        formattedText += this.getFormattedProprietaryName();
        formattedText += this.getFormattedStyle();
        formattedText += this.getFormattedFoodPairing();
        formattedText += this.getFormattedRegion();
        formattedText += this.getFormattedUSPrice();
        formattedText += this.getFormattedScores();
 
        return formattedText;
    }
    
    getFormattedProducer(){
        var formattedText = '';

        if ( this.producer ){
            formattedText = ResponseFormatter.bold( `Producer :` );
            formattedText += ` ${this.producer}`;
            formattedText += ResponseFormatter.newLine();
        }
    
        return formattedText;
    }
    
    getFormattedProprietaryName(){
        var formattedText = '';
        
        if ( this.proprietaryName ){
            formattedText = ResponseFormatter.bold( `Proprietary Name :` );
            formattedText += ` ${this.proprietaryName}`;
            formattedText += ResponseFormatter.newLine();
        }
    
        return formattedText;
    }
    
    getFormattedStyle(){
        var formattedText = '';
        
        if ( this.style ){
            formattedText = ResponseFormatter.bold( `Style :` );
            formattedText += ` ${this.style}`;
            formattedText += ResponseFormatter.newLine();
        }
    
        return formattedText;
    }
    
    getFormattedFoodPairing(){
        var formattedText = '';
        
        if ( this.foodPairing ){
            formattedText = ResponseFormatter.bold( `Food Pairing :` );
            formattedText += ` ${this.foodPairing}`;
            formattedText += ResponseFormatter.newLine();
        }
    
        return formattedText;
    }
    
    getFormattedRegion(){
        var formattedText = '';
        var partAdded = false;

        if ( this.country || this.region || this.subRegion || this.appellation ){
            formattedText = ResponseFormatter.bold( `Region :` );
            formattedText += ` `;
        }

        if ( this.country ){
            formattedText += `${this.country}`;
            partAdded = true;
        }

        if ( this.region ){
            formattedText += this.getRegionSeparator( partAdded );
            formattedText += `${this.region}`;
            partAdded = true;
        }
        
        if ( this.subRegion ){
            formattedText += this.getRegionSeparator( partAdded );
            formattedText += `${this.subRegion}`;
            partAdded = true;
        }
        
        if ( this.appellation ){
            formattedText += this.getRegionSeparator( partAdded );
            formattedText += `${this.appellation}`;
            partAdded = true;
        }

        if ( this.country || this.region || this.subRegion || this.appellation ){
            formattedText += ResponseFormatter.newLine();
        }
    
        return formattedText;
    }

    getRegionSeparator( partAdded ){
        if ( partAdded ){
            return ` - `;
        }
        else{
            return ``;
        }
    }
    
    getFormattedUSPrice(){
        var formattedText = '';
        
        if ( this.averagePrice ){
            formattedText = ResponseFormatter.bold( `Average Price : US$` );
            formattedText += `${this.averagePrice}`;
            formattedText += ResponseFormatter.newLine();
        }
    
        return formattedText;
    }
        
    getFormattedScores(){
        var formattedText = '';
        
        if ( this.criticsScore || this.communityScore ){
            formattedText = ResponseFormatter.bold( `Scores :` );
            formattedText += ` `;
        }

        if ( this.criticsScore ){
            formattedText += ResponseFormatter.italic( `Critics :` );
            formattedText += ` ${this.getCriticRating( ResponseFormatter.outputRatingText )}`;
        }

        if ( this.communityScore ){
            formattedText += ResponseFormatter.italic( `Community :` );
            formattedText += ` ${this.getCommunityRating( ResponseFormatter.outputRatingText )}`;
        }

        if ( this.criticsScore || this.communityScore ){
            formattedText += ResponseFormatter.newLine();
        }
    
        return formattedText;
    }

    getCriticRating( outputFunction ){

        var ratingOutput = "";

        if ( this.criticsScore ){
            var rating = this.criticsScore;
            var ratingMaximum = 100;
            ratingOutput = outputFunction( rating, ratingMaximum );
        }

        return ratingOutput;
    }
    
    getCommunityRating( outputFunction ){

        var ratingOutput = "";

        if ( this.communityScore ){
            var rating = this.communityScore;
            var ratingMaximum = 100;
            ratingOutput = outputFunction( rating, ratingMaximum );
        }

        return ratingOutput;
    }
}