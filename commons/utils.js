var Class = function() { // constructor function
	var klass = function() {
	    this.init.apply(this,arguments);
	};

	klass.prototype.init = function() {};

	// Shortcut to access prototype
	klass.fn = klass.prototype;

	// Shortcut to access class
	klass.fn.parent = klass;

	// Adding class properties
	klass.extend = function(obj) {
        var extended = obj.extended;
        for (var i in obj) {
        	klass[i] = obj[i];
        }
        if (extended) extended(klass); // call obj's extended function if it exists
	};

	// Adding instance properties
	klass.include = function(obj) {
        var included = obj.included;
        for (var i in obj) {
        	klass.fn[i] = obj[i]; // notice we are adding to klass's prototype
        }
        if (included) included(klass); // call obj's included function if it exists
	};

	return klass;
}

//------------------------------------------------------------------------------------------------
var ObjectUtils = new Class();

// Adding static functions to ObjectUtils -- any class can call these on the global Utils object
ObjectUtils.extend( {

    // Copy properties from fromObj to toObj
    copyProps: function ( fromObj, toObj ) {
        for (var prop in fromObj) {
            if( fromObj.hasOwnProperty( prop ) ) {
                toObj[prop] = fromObj[prop];
            } 
        }
    },

    
});

//------------------------------------------------------------------------------------------------
var ArrayUtils = new Class();

ArrayUtils.extend( {

    // Convert an array of values to a string
    arr2str: function ( arr ) {
        var str = "[ ";
        for (prop in arr) {
        	str += arr[prop] + ",";
        }
        str += "]";
        return str;

    },

    // Convert an array of values to a string
    isequal: function ( arr1, arr2 ) {
        var res = true;
        if (arr1.length !== arr2.length) { res = false; }
        else {
            for (var i = 0; res === true, i < arr1 ; i++) {
                res = (arr1[i] === arr2[i]);
            } 
        }
        return res;
    },
});

//------------------------------------------------------------------------------------------------
var HtmlUtils = new Class();

HtmlUtils.extend( {

    // Convert a string to html
    str2html: function (str) {
    	// var res = str.replace(/blue/g,"red");
      var html = str.replace(/\n/g,"<br />");
    	return html;
    },

    // Dynamically load a js or css file
    loadjscssfile: function (filename, filetype) {
        if (filetype=="js") { //if filename is a external JavaScript file
            var fileref=document.createElement('script')
            fileref.setAttribute("type","text/javascript")
            fileref.setAttribute("src", filename)
        }
        else if (filetype=="css") { //if filename is an external CSS file
            var fileref=document.createElement("link")
            fileref.setAttribute("rel", "stylesheet")
            fileref.setAttribute("type", "text/css")
            fileref.setAttribute("href", filename)
        }
        if (typeof fileref!="undefined") {
            document.getElementsByTagName("head")[0].appendChild(fileref)
        }
    },

});

//------------------------------------------------------------------------------------------------
var ChessUtils = new Class();

ChessUtils.extend( {

    // Return a random algebraic square in string form ("a2","h8","e4",etc...)
    genRandomAlgebraicSquare: function (skipRanks,skipFiles,skipSquares,confineToColorShade,atkGrid) {
    	// Inputs: skipRanks: an array of numbers from [1-8]
    	//         skipFiles: an array of strings from ["a","b",..."h"]
    	//         skipSquares: an array of squares in algebraic notation ["a3","h8","e4",...]
    	var letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
        // var numbers = [8, 7, 6, 5, 4, 3, 2, 1];
        var numbers = [1, 2, 3, 4, 5, 6, 7, 8];
        if ((typeof skipRanks !== 'undefined') && skipRanks !== null) {
        	// Before splice
        	// console.log("Before row splice -- numbers: " + ArrayUtils.arr2str(numbers));
        	for( var i = 0 ; i < skipRanks.length; i++) {
        		var idx = numbers.indexOf(skipRanks[i]);
        		numbers.splice(idx,1);
        	}
        	// console.log("After row splice -- numbers: " + ArrayUtils.arr2str(numbers));
        }
        if ((typeof skipFiles !== 'undefined') && skipFiles !== null) {
        	for( var i = 0 ; i < skipFiles.length; i++) {
        		var idx = letters.indexOf(skipFiles[i]);
        		letters.splice(idx,1);
        	}
        }

        var goodSquareFound = false;
        while(!goodSquareFound) {
        	goodSquareFound = true;
            var let = letters[Math.floor((Math.random()*letters.length))]; // Generate random index between 0 - letters.length
            var num = numbers[Math.floor((Math.random()*numbers.length))]; // Generate random index between 0 - numbers.length
            if ((typeof skipSquares !== 'undefined') && skipSquares !== null) {
            	for (var i = 0 ; i < skipSquares.length; i++) {
	            	if ((let+num) === skipSquares[i]) {
	            		console.log("skipSquare match detected");
	            		goodSquareFound = false;
	            		break;
	            	}
	            }
            }
            if (!goodSquareFound) { continue; }

            if ((typeof confineToColorShade !== 'undefined') && confineToColorShade !== null) {
                // if letter index is even then light squares are on even rows
                // if letter index is odd then light squares are on odd rows
                console.log("Inside genRandomAlgebraicSquare, confineToColorShade: " + confineToColorShade);
                var letters1 = ["a", "b", "c", "d", "e", "f", "g", "h"]; // recreated because original letters was possibly spliced
                var numbers1 = [1, 2, 3, 4, 5, 6, 7, 8]; // recreated because original numbers was possibly spliced
                var lidx = letters1.indexOf(let);
                var nidx = numbers1.indexOf(num);
                if ((lidx+nidx)%2 === 0) { // this is dark
                	if (confineToColorShade === "light") { goodSquareFound = false; }
                } else {
                	if (confineToColorShade === "dark") { goodSquareFound = false; }
                }
                console.log("After Check, [lidx,nidx]: ["+lidx+","+nidx+"], sq: "+(let+num)+", goodSquareFound: " + goodSquareFound);
            }
            if (!goodSquareFound) { continue; }

            if ((typeof atkGrid !== 'undefined') && atkGrid !== null) {
            	// Make sure no squares are being attacked -- this is for placing kings not in check
            	console.log("Checking for king in check detection...");
            	console.log("---------- King Check Attack Grid: ----------");
                ChessUtils.displayAttackGrid(atkGrid);
            	var letters2 = ["a", "b", "c", "d", "e", "f", "g", "h"]; // recreated because original letters was possibly spliced
                var numbers2 = [1, 2, 3, 4, 5, 6, 7, 8]; // recreated because original numbers was possibly spliced
                var row = 8 - parseInt(num);
                var col = letters2.indexOf(let);
                console.log("Looking on [row,col]: ["+row+","+col+"] for algSquare: " + (let+num));
                console.log("atkGrid[row,col]: " + atkGrid[row][col]);
                if (atkGrid[row][col] >= 1) { goodSquareFound = false; console.log("Placing King in Check Detected on: " + (let+num)); }
            }
        }


        return (let+num);
    },

    // Returns the algebraic notation used to describe 'pieceType'
    pieceType2alg: function( pieceType ) {
       switch(pieceType.toLowerCase()) {
           case "pawn":
               c = ""; break;
           case "knight":
               c = "N"; break;
           case "bishop":
               c = "B"; break;
           case "rook":
               c = "R"; break;
           case "queen":
               c = "Q"; break;
           case "king":
               c = "K"; break;
       }

       return c;
   },

   // Returns the pieceType for algebraic notation used to describe it.
    alg2PieceType: function( alg ) {
       switch(alg.toUpperCase()) {
           case "":
               c = "Pawn"; break;
           case "N":
               c = "Knight"; break;
           case "B":
               c = "Bishop"; break;
           case "R":
               c = "Rook"; break;
           case "Q":
               c = "Queen"; break;
           case "K":
               c = "King"; break;
       }

       return c;
   },

   // Create 8x8 empty attack grid initialized to zero
   createEmptyAttackGrid: function() {
   	   var grid,row,col;
       grid = new Array(8);
	   for (col = 0; col < 8; col++) {
	       grid[col] = new Array(8);
	   }
       for (col = 0; col < 8 ; col++) {
           for (row = 0; row < 8 ; row++) {
                grid[row][col] = 0;
           }
       }
       return grid;
   },

   displayAttackGrid: function(grid) {
   	   var row,col;
       var str = "";
       for (row = 0; row < 8 ; row++) {
           for (col = 0; col < 8 ; col++) {
                str += (grid[row][col] + " ");
           }
           str += "\n";
       }
       console.log(str);
       return str;

   },

   attackGridToString: function(grid) {
       var row,col;
       var str = "";
       for (row = 0; row < 8 ; row++) {
           for (col = 0; col < 8 ; col++) {
                str += (grid[row][col] + " ");
           }
           str += "\n";
       }
       return str;

   },

   parseFen: function(fen) {
    // http://chessprogramming.wikispaces.com/Forsyth-Edwards+Notation#FEN%20Syntax
      // 1. Piece placement
      // 2. Who's move?
      // 3. Castling Options
      // 4. en passant square candidates
      // 5. Number of moves towards 50-move draw rule
      // 6. Total number of moves
      var delim = " ";
      var tok = fen.split(delim);

      var fenVals = {
          fen                      : fen,
          position                 : tok[0],
          colorToMove              : tok[1],
          castlingOptions          : tok[2],
          enPassantCandidates      : tok[3],
          movesTowardFiftyMoveDraw : tok[4],
          totalMoves               : tok[5]
      };
      return fenVals;
   },

   displayChessPositionInAscii: function(squares) {

   },

});