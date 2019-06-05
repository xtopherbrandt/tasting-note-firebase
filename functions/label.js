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
    constructor( vintage, blend, producer, labelName, proprietaryName, imageUrl, country, region, subRegion, appellation, key, style, averagePrice, criticsScore, communityScore, foodPairing ){
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

    toJSON(){
        return {
            rowKey: ( this.key ? this.key : uuidv4() ),
            vintage: ( this.vintage ? this.vintage : '' ),
            blend: ( this.blend ? this.blend : '' ), // either the predominant grape varietal in the blend or the name of the pre-defined blend (Red Bordeaux, Burgundy...)
            partitionKey: ( this.producer ? this.producer : '' ),
            labelName: ( this.labelName ? this.labelName : '' ),
            proprietaryName: ( this.proprietaryName ? this.proprietaryName : '' ),
            imageUrl: ( this.imageUrl ? this.imageUrl : '' ),
            country: ( this.country ? this.country : '' ),
            region: ( this.region ? this.region : '' ),
            subRegion: ( this.subRegion ? this.subRegion : '' ),
            appellation: ( this.appellation ? this.appellation : '' ),
            style: ( this.style ? this.style : '' ),
            averagePrice: ( this.averagePrice ? this.averagePrice : '' ),
            criticsScore: ( this.criticsScore ? this.criticsScore : '' ),
            communityScore: ( this.communityScore ? this.communityScore : '' ),
            foodPairing: ( this.foodPairing ? this.foodPairing : '' )
        };
    }
}