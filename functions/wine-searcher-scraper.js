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


const jsdom = require( 'jsdom' );
const { JSDOM } = jsdom;
const Label = require('./label.js');

module.exports = class WineSearcherScraper {


    constructor ( context ){
        this.url = 'https://www.wine-searcher.com/find/';
        this.callContext = context;
    }
    
    wineLabelQuery( queryString ){

        var getUri = `${this.url}${queryString}`;
        
        this.callContext.log( `Wine-Searcher uri: ${getUri}`);

        var jsDompromise = JSDOM.fromURL( getUri);

        jsDompromise.then( dom => this.queryPromiseFulfilled( dom ) );

        return new Promise((resolve, reject) => {this.resolve = resolve;} );

    }

    queryPromiseFulfilled( dom ) { 
        const { window } = dom.window;
        const $ = require( 'jQuery' )(window);
        var wine = {};
        wine.varietal = this.getGrape( $ );
        wine.producer = this.getProducer( $ );
        wine.locale = this.getRegion( $ );
        wine.vintage = this.getVintage( $ );
        wine.labelName = this.getLabelName( $ );
        wine.imageUrl = this.getLabelImageUrl( $ );
        wine.criticsScore = this.getCriticScore( $ );
        wine.style = this.getStyle( $ );
        wine.averagePrice = this.getAveragePrice( $ );
        wine.communityScore = 0;
        wine.foodPairing = this.getFoodPairing( $ );
        wine.attribution = window.location.href;
        this.callContext.log( wine );

        this.label = this.createLabel( wine );
        this.resolve( this.label );
    }

    getProducer( $ ){        
        return $("span.icon-producer" ).next().children("a").text();
    }

    getGrape( $ ){
        return $("span.icon-grape" ).next().children("a").text();
    }

    getRegion( $ ){
        var regionText = $("span.icon-region" ).next().children("a").text();
        return this.separateRegion( regionText );
    }

    getVintage( $ ){
        return $("#top_header" ).children("[itemprop='model']").text();
    }

    getLabelName( $ ){
        var labelName

        labelName = $("#top_header" ).children("[itemprop='name']").text().split(',')[0];

        if ( !labelName ){
            labelName = $("#top_header" ).text().split(',')[0].trim();
        }

        return labelName;
    }

    getLabelImageUrl( $ ){
        return $( "#imgThumb" ).attr("src");
    }

    getCriticScore( $ ){
        return $("span[itemprop='ratingValue']").text();
    }

    getStyle( $ ){
        return $("div.icon-style").next().children("a").text();
    }

    getFoodPairing( $ ){
        return $("div.icon-food").next().children("span.sidepanel-text").children("a").text();
    }

    getAveragePrice( $ ){
        var priceText = $("span.icon-avgp").next().children("b").text();
        return priceText.replace(/\s/g,'');
    }

    separateRegion( wineRegion ){
        var splitRegion = {};
        var regionParts = wineRegion.split( "\n");

        var index = regionParts.length - 2;

        splitRegion.country = regionParts[ index-- ];
        
        if ( index >= 0 ){
            splitRegion.region = regionParts[ index-- ];
        }

        if ( index > 0 ){
            splitRegion.subRegion = regionParts[ index-- ];
        }

        if ( index == 0 ){
            splitRegion.appellation = regionParts[ index-- ];
        }

        return splitRegion;
    }

    createLabel( wine ){
        
        var label = new Label( this.callContext );
        
        label.setLabelParameters( wine.vintage, wine.varietal, wine.producer, wine.labelName, '', wine.imageUrl, wine.locale.country, wine.locale.region, wine.locale.subRegion, wine.locale.appellation,'', wine.style, wine.averagePrice, wine.criticsScore, wine.communityScore, wine.foodPairing );

        return label;
    }

    processRequestError( error ){
        this.callContext.log( `An error occured while attempting to contact Snooth. ${error}` );
    }
}
