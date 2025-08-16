// PgnGame
//    Object : tagProps
//    PgnMove Array: gameMoveList
// PgnMove
//    number: moveNumber
//    string: color
//    string: algMove
//    string: comment
//    PgnMove Array: variation

function PgnGame(master_board) { 
    

    // API
    //
    //---------Variables
    // 
    // allMoves : array of algebraic moves
    //          : Element Composition Either...
    //          : 1. algebraic notation string (correpsonding to one move only)
    //          : 2. array of algebraic notation strings
    //          : Example
    //          : allMoves = [ 'e4',['e5',['d4,Qxd4,Nc3']],'Nf3','Nc6' ]
    //          : So in this example we have 
    //               main line 1.e4 e5 2. Nf3 Nc6
    //               variation 1.e4 d4 2. Qxd4 Nc3
    //
    //
    // whiteMoves : just the white algebraic moves
    // blackMoves : just the black algebraic moves
    //
    // plyCount : current plyCount we are on
    // playInProgress : true/false, are we in the middle of playing a pgn automatically
    // moveDelay : time in ms we wait between moves
    // playStartPly : ply we start playing on
    // playStopPly  : ply we stop playing on
    //
    //
    //-------  Functions
    //
    // loadPgn(pgnText)
    // getFenForPlyCount(ply) -- return fen string for that ply
    // getFenForMove(algebraic_move) -- same as above but you must find
    // getNextMove() -- returns allMoves[plyCount]
    // playMoves(startPly,endPly,moveDelay) -- auto play moves from startPly to endPly

    var board = master_board;
    var plyCount = -1; // always points to the "last" move played, also its one-based
    var totalPlyCount = -1;
    var allMoves = null;
    var whiteMoves = null;
    var blackMoves = null;
    var colorToMove = null;
    var pgnReader = PgnGameReader();
    var pgnViewer = null;
    var pgnViewerMode = -1; // 0 show all, 1 show played, 2 hide, -1 don't use at all
    var pgnGameInfo = null; // struct returned by PgnGameReader, storing just in case needed later
    var appendToHtmlElId = 'gameConsole'; // for the pgnViewer

    return {
        endOfGame        : endOfGame, // return true/false
        movePlayed       : movePlayed,
        getNextMove      : getNextMove,
        getColorToMove   : getColorToMove,
        getPlyCount      : getPlyCount,
        getTotalPlyCount : getTotalPlyCount,
        setDisplayMode   : setDisplayMode,    // -1 don't use, 0 show all, 1 show played so far, 2 hide
        loadPgn          : loadPgn,
    };
    
    function movePlayed( actualMove ) {
        var variation = goOneMoveForward(actualMove);
        pgnViewer.gotoMove(plyCount-1,variation); // this will highlight the move played
        colorToMove = (colorToMove == "White" ? "Black" : "White");
    }
    function endOfGame() { return plyCount > totalPlyCount; }
    function goOneMoveForward() { plyCount++; variation = 0; return variation} // TODO: implement variations
    function getNextMove() { return allMoves[plyCount-1]; }
    function getColorToMove() { return colorToMove; }
    function getPlyCount() { return plyCount; }
    function getTotalPlyCount() { return totalPlyCount; }
    function setDisplayMode( val ) {
        var oldVal = pgnViewerMode;
        pgnViewerMode = val;
        if (pgnViewerMode > -1) {
            if (pgnViewer === null) {
                pgnViewer = new PgnGameViewer(CANVAS_WIDTH,CANVAS_HEIGHT,board.padding,appendToHtmlElId,pgnViewerMode);
            }
            if (oldVal === -1 && pgnGameInfo !== null) {
                pgnViewer.loadPgn(pgnGameInfo.moves);
            }
        }
        pgnViewer.setDisplayMode(val);
    }


    /**
     * Loads a pgn and returns fen to caller. Does not place pieces on board!!
     * @param {pgnText} entire pgn as string
     */
    function loadPgn(pgnText) {
        
        pgnGameInfo = pgnReader.parsePgnText(pgnText);
        plyCount = pgnGameInfo.plyCount;
        var moves = pgnGameInfo.moves;

        if (pgnViewerMode > -1) {
            if (pgnViewer === null) {
                pgnViewer = new PgnGameViewer(CANVAS_WIDTH,CANVAS_HEIGHT,board.padding,appendToHtmlElId,pgnViewerMode);
            }
            pgnViewer.loadPgn(moves);
        }

        totalPlyCount = pgnGameInfo.moves.totalPlyCount;
        allMoves   = pgnGameInfo.moves.allMoves;
        whiteMoves = pgnGameInfo.moves.whiteMoves;
        blackMoves = pgnGameInfo.moves.blackMoves;

        var fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
        for (var i = 0; i < pgnGameInfo.tags.length ;i++) {
          var tagName = pgnGameInfo.tags[i].tag;
          var value   = pgnGameInfo.tags[i].val;
          if (tagName.toLowerCase() === "fen") {
              fen = value;
          }
        }
        var fenVals = ChessUtils.parseFen(fen);
        colorToMove = (fenVals.colorToMove === "w" ? "White" : "Black");
        return fenVals;
    }
}

function PgnGameReader() {

    return {
        parsePgnText : parsePgnText,
    }

    function parsePgnText( pgnText ) {
        
        // var pgnHeaderTagRegExp       = /\[\s*(\w+)\s*"([^"]*)"\s*\]/;
        // var pgnHeaderTagRegExpGlobal = /\[\s*(\w+)\s*"([^"]*)"\s*\]/g;
        // var pgnHeaderBlockRegExp     = /\s*(\[\s*\w+\s*"[^"]*"\s*\]\s*)+/;

        var lines = pgnText.split("\n");
        var tags = [], k=0;
        var moves = [], moveText = "";
        for (var i = 0; i < lines.length ;i++) {
            if (lines[i].trim().charAt(0) !== "[") {
                moveText = moveText.concat(lines[i]);
            } else {
                tags.push(parseTag(lines[i]));
                k++;
            }
        }
        // console.log(moveText);
        moves = parseMoves(moveText);
        var pgnGameInfo = {
            plyCount: 1,
            pgnText: pgnText,
            moveText: moveText,
            tags: tags,
            moves: moves,
        };
        // var plyCount = 1, variation = 0;
       
        // var pgnGame = new PgnGame( pgnText, moveText, tags, moves, plyCount, variation );
        return pgnGameInfo;

        //-----------------------------------------------------------------------------
        function parseMoves(moveText) {

            moveText = moveText.trim();
            console.log("Original moveText: ");
            console.log(moveText);
            moveText = moveText.replace('\n',' '); // remove all newline characters
            
            var allMoves = [];
            var whiteMoves = [];
            var blackMoves = [];
            var moveStr = "";
            var tok = [], moveTok = [];
            var plyCount = 0;

            var result = stripResultsOffMoveText();
            console.log("After result stripping: ");
            console.log(moveText);
            console.log("Result: " + result);
            
            function stripResultsOffMoveText() {
                var results = ['1-0','0-1','1/2-1/2','*'];
                var res = null;
                // Note moveText was already trimmed
                for (var i = 0; i < results.length; i++) {
                    var keepLen = moveText.length-results[i].length;
                    if (results[i].indexOf(moveText.substr(keepLen)) !== -1) {
                        // match found
                        res = results[i];
                        moveText = moveText.slice(0,keepLen);
                        break;
                    }
                }
                return res;
            }

            // TODO: replace all comments with {1},{2},etc and store them in a comments array
            // TODO: replace all variations with (1),(2),etc and store them in a variation array

            tok = moveText.split(/\s*[0-9]+\./); // this will create tokens like tok[0] = "e4 e5", tok[1] = "Nf3 Nc6", tok[2] = "Bb5 {ruy lopez} a6", etc
            for (var i = 0 ; i < tok.length ; i++) {
                if (i === 0) { continue; } // first token is empty so we skip it
                
                // We should now have another array of string tokens.
                // Two of them will be the actual white and black moves.
                // The others will be comments and variations.
                // tok[0] = "e4 e5 (1...d5! exd5 {Center Counter})", tok[1] = "Nf3 Nc6", tok[2] = "Bb5 {ruy lopez} a6"

                // TODO: Now lets get rid of the comments and variations

                // Now tok[i] should have just the actual moves
                var moveTok = tok[i].trim().split(/\s+/);
                
                // Add white move
                plyCount++;
                allMoves.push(moveTok[0]);
                whiteMoves.push(moveTok[0]);

                // Add black move
                if (moveTok.length > 1) {
                   plyCount++;
                   allMoves.push(moveTok[1]);
                   blackMoves.push(moveTok[1]);
                }

                moveStr += "toks["+i+"]: "+tok[i]+"\n";
                moveStr += " ---> W: "+moveTok[0]+"\n";
                moveStr += " ---> B: "+moveTok[1]+"\n";
                moveStr += " ---> B: "+moveTok[2]+"\n";
            }
            console.log(moveStr);
            
            return {
                result: result, // one of ['1-0','0-1','1/2-1/2','*']
                totalPlyCount: plyCount, // this should be same as allMoves.length
                allMoves: allMoves, // these can be indexed by plyCount
                whiteMoves: whiteMoves,
                blackMoves: blackMoves
            };

        }

        function parseTag(tagLine) {
            var pgnHeaderTagRegExpGlobal = /\[\s*(\w+)\s*"([^"]*)"\s*\]/g;
            var tag,val;
            
            parse = pgnHeaderTagRegExpGlobal.exec(tagLine);
            
            // for (var i = 0 ; i < parse.length ;i++) {
            //     console.log("parse["+i+"]: " + parse[i]);
            // }
            tag = parse[1];
            val = parse[2];

            return {
                tag: tag,
                val: val
            };
        }

    };
}

// This object will encapsulate handle the creation and functionality of the html table displaying a pgn
function PgnGameViewer(width,height,boardPadding,appendToHtmlElId,initMode) {

    // JQuery elements that will be created in createViewer()
    var $debugDisplay,
        $moveViewer,
        $divSpacer,
        $table;

    
    var plyCount = 0;
    var variationCount = 0;

    // Higlight the move in the pgn table
    // PGN - not known - being created as moves are being played (creating a pgn from scratch)
    // PGN - known
    //     1. display full pgn as moves are being played (playing through a game)
    //     2. hide unplayed moves (mates in ones for example)
    this.DISPLAY_MODE_NOT_USED = -1;
    this.DISPLAY_MODE_SHOW_ALL = 0;      // example: playing through a predefined game
    this.DISPLAY_MODE_HIDE_UNPLAYED = 1; // example: User playing through a problem with solution
    this.DISPLAY_MODE_HIDE_ALL = 2; // not sure of an example here but seems like it may be desired down the road
    var displayMode = initMode;
    console.log("initMode: " + initMode);

    createViewer(width,height,boardPadding,appendToHtmlElId);

    function createViewer(canvasW,canvasH,boardPadding,appendToHtmlElId) {
        // Display moves in scrollable div using a <table>
        $debugDisplay = $('<div></div>');
        $debugDisplay.attr('id','debugDisplay');
        $moveViewer = $('<div></div>');
        $moveViewer.addClass("moveViewer");
        $divSpacer = $('<div></div>');
        $divSpacer.addClass("moveViewerSpacer");
        $table = $('<table></table>');
        $table.addClass("moveTable");

        $moveViewer.append($table);
        
        $divSpacer.height(boardPadding[0]); // padding top of board
        $moveViewer.height(canvasH-(boardPadding[0]+boardPadding[2]));
        $moveViewer.width(canvasH/2);
        $('#'+appendToHtmlElId).append($divSpacer);
        $('#'+appendToHtmlElId).append($moveViewer);
        $('#'+appendToHtmlElId).append($debugDisplay);

        if (displayMode === this.DISPLAY_MODE_HIDE_ALL) {
          $moveViewer.css( { 'display' : 'none' } );
        }
        if (!debugOn) {
          $debugDisplay.css( { 'display' : 'none' });
        }
    }

    this.setDisplayMode = function(mode) {
        displayMode = mode;
        switch(mode) {
            case this.DISPLAY_MODE_NOT_USED: // intentional no break here
            case this.DISPLAY_MODE_HIDE_ALL:
                $moveViewer.css( { 'display' : 'none' } );
                break;
            case this.DISPLAY_MODE_HIDE_UNPLAYED:
                break;
            case this.DISPLAY_MODE_SHOW_ALL:
                $moveViewer.css( { 'display' : 'block' } );
                console.log("Setting display:block on $moveViewer");
                break;
        }
        console.log("In switch: mode is " + mode );

        // if (displayMode === this.DISPLAY_MODE_HIDE_ALL) {
        //   $moveViewer.css( { 'display' : 'none' } );
        // }
        if (!debugOn) {
          $debugDisplay.css( { 'display' : 'none' });
        }
    }

    this.gotoMove = function( newPlyCount, newVariationCount ) {
        plyCount = newPlyCount;
        variationCount = newVariationCount;
        var curMoveInTableId = "m"+plyCount+"v"+variationCount;
        var prevMoveInTableId = "m"+(plyCount-1)+"v"+variationCount;
        console.log('Removing highlighting from: ' + prevMoveInTableId);
        if (plyCount > 1) {
            $('#'+prevMoveInTableId).removeClass('selectedMove'); // each move in table has id that looks like m1v0, m2v0
        }
        console.log('Adding highlighting to: ' + curMoveInTableId);
        $('#'+curMoveInTableId).addClass('selectedMove');
        $('.moveViewerSpacer').html("Ply Count: " + plyCount);
    }

    this.loadPgn = function(moves) { // pgnGame is an object returned by PgnGameReader
        var whiteMoves = moves.whiteMoves;
        var blackMoves = moves.blackMoves;
        var curPly = 1;
        var curVariation = 0;
        for (var i = 0 ; i < whiteMoves.length+1; i++) {
          var $row = $('<tr></tr>');
          $table.append($row);

          // Add Move moveNumbers
          if (curPly <= moves.totalPlyCount) {
              var $moveNum = $('<th>'+(i+1)+'.</th>');
              $moveNum.addClass("moveNumbers");
              $row.append($moveNum);
          }

          // Add White move
          if (curPly > moves.totalPlyCount) {
              if (moves.result !== "*") {
                  $move = $('<td>'+moves.result+'</td>').addClass('bold'); $row.append($move);
                  $move = $('<td></td>'); $row.append($move); 
              }
              break;
          } else {
              var $move = $('<td>'+whiteMoves[i]+'</td>');
              $move.addClass("whiteMoves");
              $move.attr('id', 'm'+curPly+'v'+curVariation);
              $row.append($move);
          }

          // Add Black move
          if (curPly === moves.totalPlyCount) {
              $move = $('<td>'+(moves.result === "*" ? "" : moves.result)+'</td>').addClass('bold'); $row.append($move);
               break;
          } else {
              $move = $('<td>'+blackMoves[i]+'</td>');
              $move.addClass("blackMoves");
              $move.attr('id', 'm'+(curPly+1)+'v'+curVariation);
              $row.append($move);
          }
          
          curPly += 2;
        }
    }
}

// //------------------------------------------------------------------------------------------------
// var PGN = new Class();

// // Adding static functions to PGN -- any class can call these on the global PGN object
// PGN.extend( {

//     // Copy properties from fromObj to toObj
//     parseGameString: function ( gameString ) {
//         var ii, start, end, move, moveCount, needle, commentStart, commentEnd, isContinuation;
//         var ssRep, ss = gameString, ssComm;

//         // empty variations to comments
//         while ((ssRep = ss.replace(/\((([\?!+#\s]|\$\d+|{[^}]*})*)\)/g, ' $1 ')) !== ss) { ss = ssRep; }
//         ss = ss.replace(/^\s/, ''); // remove white space at front
//         ss = ss.replace(/\s$/, ''); // remove white space at back

//   initVar ();

//   PlyNumber = 0;

//   for (start=0; start<ss.length; start++) {

//     switch (ss.charAt(start)) {

//       case ' ':
//       case '\b':
//       case '\f':
//       case '\n':
//       case '\r':
//       case '\t':
//         break;

//       case '$':
//         commentStart = start;
//         commentEnd = commentStart + 1;
//         while ('0123456789'.indexOf(ss.charAt(commentEnd)) >= 0) {
//           commentEnd++;
//           if (commentEnd >= ss.length) { break; }
//         }
//         if (MoveCommentsVar[CurrentVar][StartPly+PlyNumber]) { MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ' '; }
//         MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += translateNAGs(ss.substring(commentStart, commentEnd).replace(/(^\s*|\s*$)/, ''));
//         start = commentEnd - 1;
//         break;

//       case '!':
//       case '?':
//         commentStart = start;
//         commentEnd = commentStart + 1;
//         while ('!?'.indexOf(ss.charAt(commentEnd)) >= 0) {
//           commentEnd++;
//           if (commentEnd >= ss.length) { break; }
//         }
//         if (MoveCommentsVar[CurrentVar][StartPly+PlyNumber]) { MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ' '; }
//         MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ss.substring(commentStart, commentEnd);
//         start = commentEnd - 1;
//         break;

//       case '{':
//         commentStart = start+1;
//         commentEnd = ss.indexOf('}',start+1);
//         if (commentEnd < 0) {
//           myAlert('error: missing end comment } in game ' + (currentGame+1), true);
//           commentEnd = ss.length;
//         }
//         if (MoveCommentsVar[CurrentVar][StartPly+PlyNumber]) { MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ' '; }
//         ssComm = translateNAGs(ss.substring(commentStart, commentEnd).replace(/(^\s*|\s*$)/, ''));
//         MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ssComm;
//         GameHasComments = GameHasComments || ssComm.replace(/\[%[^\]]*\]\s*/g,'').replace(basicNAGs, '').replace(/^\s+$/,'') !== '';
//         start = commentEnd;
//         break;

//       case '%':
//         // % must be first char of the line
//         if ((start > 0) && (ss.charAt(start-1) != '\n')) { break; }
//         commentStart = start+1;
//         commentEnd = ss.indexOf('\n',start+1);
//         if (commentEnd < 0) { commentEnd = ss.length; }
//         start = commentEnd;
//         break;

//       case ';':
//         commentStart = start+1;
//         commentEnd = ss.indexOf('\n',start+1);
//         if (commentEnd < 0) { commentEnd = ss.length; }
//         if (MoveCommentsVar[CurrentVar][StartPly+PlyNumber]) { MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ' '; }
//         ssComm = translateNAGs(ss.substring(commentStart, commentEnd).replace(/(^\s*|\s*$)/, ''));
//         MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ssComm;
//         GameHasComments = GameHasComments || ssComm.replace(/\[%[^\]]*\]\s*/g,'').replace(basicNAGs, '').replace(/^\s+$/,'') !== '';
//         start = commentEnd;
//         break;

//       case '(':
//         if (isContinuation = (ss.charAt(start+1) == '*')) { start += 1; }
//         MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ' [%pgn4web_variation ' + numberOfVars + '] ';
//         startVar(isContinuation);
//         break;

//       case ')':
//         closeVar();
//         break;

//       case '&': // nullmove "<>" became "&lt;&gt;"
//         if (ss.substr(start, 8) == "&lt;&gt;") {
//           ss = ss.slice(0, start) + "     -- " + ss.slice(start + 8);
//           start += 4;
//           break;
//         }
//         // dont add "break;"

//       default:

//         needle = new Array('1-0', '0-1', '1/2-1/2', '*');
//         for (ii=0; ii<needle.length; ii++) {
//           if (ss.indexOf(needle[ii],start)==start) {
//             if (CurrentVar === 0) { end = ss.length; }
//             else {
//               end = start + needle[ii].length;
//               if (MoveCommentsVar[CurrentVar][StartPly+PlyNumber]) { MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += ' '; }
//               MoveCommentsVar[CurrentVar][StartPly+PlyNumber] += needle[ii];
//             }
//             start = end;
//             break;
//           }
//         }
//         if (start == ss.length) { break; }

//         moveCount = Math.floor((StartPly+PlyNumber)/2)+1;
//         needle = moveCount.toString();
//         if (ss.indexOf(needle,start)==start) {
//           start += needle.length;
//           while (' .\n\r'.indexOf(ss.charAt(start)) != -1) { start++; }
//         }

//         if ((end = start + ss.substr(start).search(/[\s${;!?()]/)) < start) { end = ss.length; }
//         move = ss.substring(start,end);
//         MovesVar[CurrentVar][StartPly+PlyNumber] = CleanMove(move);
//         lastVarWithNoMoves[lastVarWithNoMoves.length - 1] = false;
//         if (ss.charAt(end) == ' ') { start = end; }
//         else { start = end - 1; }
//         if (!MovesVar[CurrentVar][StartPly+PlyNumber].match(/^[\s+#]*$/)) { // to cope with malsformed PGN data
//           PlyNumber++;
//           MoveCommentsVar[CurrentVar][StartPly+PlyNumber] = '';
//         }
//         break;
//     }
//   }

//   if (CurrentVar !== 0) {
//     myAlert("error: ParsePGNGameString ends with CurrentVar " + CurrentVar + " in game " + (currentGame+1), true);
//     while (CurrentVar > 0) { closeVar(); }
//   }

//   StartPlyVar[0] = StartPly;
//   PlyNumberVar[0] = PlyNumber;

//   GameHasComments = GameHasComments || GameHasVariations;

//   lastSynchCurrentVar = -1;
//     },

    
// });

// // var NAGstyle = 'default';
// // var NAG = new Array();
// // NAG[0] = '';
// // NAG[1] = '!'; // 'good move';
// // NAG[2] = '?'; // 'bad move';
// // NAG[3] = '!!'; // 'very good move';
// // NAG[4] = '??'; // 'very bad move';
// // NAG[5] = '!?'; // 'speculative move';
// // NAG[6] = '?!'; // 'questionable move';
// // NAG[7] = 'forced move'; // '[]';
// // NAG[8] = 'singular move'; // '[]';
// // NAG[9] = 'worst move'; // '??';
// // NAG[10] = 'drawish position'; // '=';
// // NAG[11] = 'equal chances, quiet position'; // '=';
// // NAG[12] = 'equal chances, active position'; // '=';
// // NAG[13] = 'unclear position'; // '~~';
// // NAG[14] = 'White has a slight advantage'; // NAG[15] = '+/=';
// // NAG[16] = 'White has a moderate advantage'; // NAG[17] = '+/-';
// // NAG[18] = 'White has a decisive advantage'; // NAG[19] = '+-';
// // NAG[20] = 'White has a crushing advantage'; // NAG[21] = '+-';
// // NAG[22] = 'White is in zugzwang'; // NAG[23] = '(.)';
// // NAG[24] = 'White has a slight space advantage'; // NAG[25] = '()';
// // NAG[26] = 'White has a moderate space advantage'; // NAG[27] = '()';
// // NAG[28] = 'White has a decisive space advantage'; // NAG[29] = '()';
// // NAG[30] = 'White has a slight time (development) advantage'; // NAG[31] = '@';
// // NAG[32] = 'White has a moderate time (development) advantage'; // NAG[33] = '@';
// // NAG[34] = 'White has a decisive time (development) advantage'; // NAG[35] = '@';
// // NAG[36] = 'White has the initiative'; // NAG[37] = '|^';
// // NAG[38] = 'White has a lasting initiative'; // NAG[39] = '|^';
// // NAG[40] = 'White has the attack'; // NAG[41] = '->';
// // NAG[42] = 'White has insufficient compensation for material deficit';
// // NAG[44] = 'White has sufficient compensation for material deficit'; // NAG[45] = '=/~';
// // NAG[46] = 'White has more than adequate compensation for material deficit'; // NAG[47] = '=/~';
// // NAG[48] = 'White has a slight center control advantage'; // NAG[49] = '[+]';
// // NAG[50] = 'White has a moderate center control advantage'; // NAG[51] = '[+]';
// // NAG[52] = 'White has a decisive center control advantage'; // NAG[53] = '[+]';
// // NAG[54] = 'White has a slight kingside control advantage'; // NAG[55] = '>>';
// // NAG[56] = 'White has a moderate kingside control advantage'; // NAG[57] = '>>';
// // NAG[58] = 'White has a decisive kingside control advantage'; // NAG[59] = '>>';
// // NAG[60] = 'White has a slight queenside control advantage'; // NAG[61] = '<<';
// // NAG[62] = 'White has a moderate queenside control advantage'; // NAG[63] = '<<';
// // NAG[64] = 'White has a decisive queenside control advantage'; // NAG[65] = '<<';
// // NAG[66] = 'White has a vulnerable first rank';
// // NAG[68] = 'White has a well protected first rank';
// // NAG[70] = 'White has a poorly protected king';
// // NAG[72] = 'White has a well protected king';
// // NAG[74] = 'White has a poorly placed king';
// // NAG[76] = 'White has a well placed king';
// // NAG[78] = 'White has a very weak pawn structure';
// // NAG[80] = 'White has a moderately weak pawn structure';
// // NAG[82] = 'White has a moderately strong pawn structure';
// // NAG[84] = 'White has a very strong pawn structure';
// // NAG[86] = 'White has poor knight placement';
// // NAG[88] = 'White has good knight placement';
// // NAG[90] = 'White has poor bishop placement';
// // NAG[92] = 'White has good bishop placement';
// // NAG[94] = 'White has poor rook placement';
// // NAG[96] = 'White has good rook placement';
// // NAG[98] = 'White has poor queen placement';
// // NAG[100] = 'White has good queen placement';
// // NAG[102] = 'White has poor piece coordination';
// // NAG[104] = 'White has good piece coordination';
// // NAG[106] = 'White has played the opening very poorly';
// // NAG[108] = 'White has played the opening poorly';
// // NAG[110] = 'White has played the opening well';
// // NAG[112] = 'White has played the opening very well';
// // NAG[114] = 'White has played the middlegame very poorly';
// // NAG[116] = 'White has played the middlegame poorly';
// // NAG[118] = 'White has played the middlegame well';
// // NAG[120] = 'White has played the middlegame very well';
// // NAG[122] = 'White has played the ending very poorly';
// // NAG[124] = 'White has played the ending poorly';
// // NAG[126] = 'White has played the ending well';
// // NAG[128] = 'White has played the ending very well';
// // NAG[130] = 'White has slight counterplay'; // NAG[131] = '<=>';
// // NAG[132] = 'White has moderate counterplay'; // NAG[133] = '<=>';
// // NAG[134] = 'White has decisive counterplay'; // NAG[135] = '<=>';
// // NAG[136] = 'White has moderate time control pressure'; // NAG[137] = '(+)';
// // NAG[138] = 'White has severe time control pressure'; // NAG[139] = '(+)';

// // for (i=14; i<139; i+=2) { NAG[i+1] = NAG[i].replace("White", "Black"); }

// // function translateNAGs(comment) {
// //   var matches = comment.match(/\$+[0-9]+/g);
// //   if (matches) {
// //     for (var ii = 0; ii < matches.length; ii++) {
// //       var nag = matches[ii].substr(1);
// //       if (NAG[nag] !== undefined) {
// //         comment = comment.replace(new RegExp("\\$+" + nag + "(?!\\d)"), NAG[nag]);
// //       }
// //     }
// //   }
// //   return comment;
// // }