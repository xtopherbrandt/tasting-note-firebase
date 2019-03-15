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

let Moment = require( 'moment' );

module.exports = class TastingNoteRichResponseFormatter {


    static getFormattedDate( date ){
        var tastingNoteMoment = new Moment( date );

        return tastingNoteMoment.format("dddd, MMMM Do YYYY");;
    }


    static outputRatingText( rating, ratingMaximum ){
        return `${TastingNoteRichResponseFormatter.bold(rating)} / ${ratingMaximum}`;
    }

    static outputRatingVerbal( rating, ratingMaximum ){
        return `${rating} out of ${ratingMaximum}`;
    }

    static outputStars( rating, ratingMaximum ){
        var stars = '';
        for( var i = 1; i <= rating; i++ ){
            stars += '*';
            stars += '';
        }

        for( var i = rating; i < ratingMaximum; i++){
            stars += '-';
            stars += '';
        }

        return stars;
    }

    static bullet( text ){
        return `*  ${text}`;
    }

    static bold( text ){
        return `**${text}**`;
    }

    static italic( text ){
        return `*${text}*`;
    }

    static newLine(){
        return '  \n';
    }

    //** Tasting Note Specific functions */
    static getTastingNoteCardTitle( tastingNote ){

        return `${tastingNote.label.vintage} ${tastingNote.label.labelName}`;

    }

    static getTastingNoteListItemTitle( tastingNote, numberInList ){

        return `${numberInList}. ${tastingNote.label.vintage} ${tastingNote.label.labelName}`;

    }

    static getTastingNoteCardSubtitle( tastingNote ){
        var formattedDate = TastingNoteRichResponseFormatter.getFormattedDate( tastingNote.date );
        return `${formattedDate}  @  ${tastingNote.location}`;
    }
    
    static getFormattedNoteText( tastingNote ){

        var noteDetails = tastingNote.noteDetails;
        var formattedNoteText = TastingNoteRichResponseFormatter.getRating( tastingNote, TastingNoteRichResponseFormatter.outputRatingText );
        formattedNoteText += TastingNoteRichResponseFormatter.newLine();
        formattedNoteText += TastingNoteRichResponseFormatter.getCompiledNoteDetails( noteDetails );

        return formattedNoteText;
    }

    static getCompiledNoteDetails( noteDetailsArray ){
        var compiledNoteDetails = " ";

        if ( noteDetailsArray ){
            for ( var i = 0; i < noteDetailsArray.length; i++ ){
                compiledNoteDetails += TastingNoteRichResponseFormatter.bullet(noteDetailsArray[ i ]);
                compiledNoteDetails += TastingNoteRichResponseFormatter.newLine();
            }
        }

        return compiledNoteDetails;
    }

    static getTastingNoteRating( tastingNote, outputFunction ){

        var ratingOutput = "";

        if ( tastingNote.userRating ){
            var rating = tastingNote.userRating.value;
            var ratingMaximum = 5;
            ratingOutput = outputFunction( rating, ratingMaximum );
        }

        return ratingOutput;
    }
}