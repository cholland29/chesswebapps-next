function pieceManager(spriteCache) {

    var spriteCache = spriteCache;

    var whitePieceSet, whitePiecesUsed;
    var blackPieceSet, blackPiecesUsed;

    // indices into piece sets that correspond to correct piece -- works for both black and white sets
    var QUEEN_ROOK   = 0;
    var QUEEN_KNIGHT = 1;
    var QUEEN_BISHOP = 2;
    var QUEEN        = 3;
    var KING         = 4;
    var KING_BISHOP  = 5;
    var KING_KNIGHT  = 6;
    var KING_ROOK    = 7;

    return {
    	reset          : reset,
    	isPiece        : isPiece,
        createPiece    : createPiece,
        initPieces     : initPieces,
        getPiece       : getPiece,
        returnPiece    : returnPiece,
        getUnusedPiece : getUnusedPiece,
    	getWhitePieces : getWhitePieces,
    	getBlackPieces : getBlackPieces,
        getWhitePiecesUsed : getWhitePiecesUsed,
        getBlackPiecesUsed : getBlackPiecesUsed,
        getRandomPiece : getRandomPiece,
        areMatchingPieces : areMatchingPieces,
    };

    // ----------------------------------------------------------------------
    // These will be public
    function isPawn(piece)   { return piece.isPawn();   }
    function isBishop(piece) { return piece.isBishop(); }
    function isRook(piece)   { return piece.isRook();   }
    function isKnight(piece) { return piece.isKnight(); }
    function isQueen(piece)  { return piece.isQueen();  }
    function isKing(piece)   { return piece.isKing();   }

    function isPiece(piece,type) { return piece.name.toLowerCase() === type; }
    function reset() {
	    for (var i = 0 ; i < whitePiecesUsed.length; i++) {
            whitePiecesUsed[i] = 0;
            blackPiecesUsed[i] = 0;
            whitePieceSet[i].hasMoved = false;
            blackPieceSet[i].hasMoved = false;
        }
    }
    function getWhitePieces() { return whitePieceSet; }
    function getBlackPieces() { return blackPieceSet; }
    function getWhitePiecesUsed() { return whitePiecesUsed; } // just for debugging
    function getBlackPiecesUsed() { return blackPiecesUsed; } // just for debugging

    function initPieces() { // This must be called only after resources have been loaded

        // Sprite images have already been loaded. Lets initialize the spriteCache now.
        sprite = spriteCache.defineSprite("WhiteRook",0,0);
        sprite = spriteCache.defineSprite("WhiteQueen",1,0);
        sprite = spriteCache.defineSprite("WhitePawn",2,0);
        sprite = spriteCache.defineSprite("WhiteKnight",3,0);
        sprite = spriteCache.defineSprite("WhiteKing",0,1);
        sprite = spriteCache.defineSprite("WhiteBishop",1,1);
        sprite = spriteCache.defineSprite("BlackRook",2,1);
        sprite = spriteCache.defineSprite("BlackQueen",3,1);
        sprite = spriteCache.defineSprite("BlackPawn",0,2);
        sprite = spriteCache.defineSprite("BlackKnight",1,2);
        sprite = spriteCache.defineSprite("BlackKing",2,2);
        sprite = spriteCache.defineSprite("BlackBishop",3,2);

        createPieceSets();
    }

    function areMatchingPieces( pce1, pce2 ) {
        // Returns true if pce1 and pce2 are matching rooks, knights, or bishops (of the same color)
        var s1, s2;
        if (pce1.name.toLowerCase() !== pce2.name.toLowerCase()) { console.log("areMatchingPieces: failed because name mismatch"); return false; }
        if (pce1.isWhite !== pce2.isWhite) { console.log("areMatchingPieces: failed because color mismatch"); return false; }
        if (pce1.square !== null && !pce1.square.equals(pce2.square)) { console.log("areMatchingPieces: failed because square mismatch"); return false; }
        return true;
        // if (pce1.name.toLowerCase() == "rook") {
        //     if (pce1.isWhite) {
        //         s1 = [7,0], s2 = [7,7];
        //     } else {
        //         s1 = [0,0], s2 = [0,7]; 
        //     }
        //     return pce1.startingSquare[0] === 
        // } else if (pce1.name.toLowerCase() == "bishop") {

        // } else if (pce1.name.toLowerCase() == "knight") {
        // }
        // if (pce1.startingSquare[0] === s1[0] && pce2.startingSquare[0] === s2[0]) {
        //     if (pce1.startingSquare[1] === s1[1]) {
        //         return pce2.startingSquare[1] === s2[1];
        //     } else if (pce1.startingSquare[1] === s2[1]) {
        //         return pce2.startingSquare[1] === s1[1];
        //     } else {
        //         return false;
        //     }
        // }
    }
    // Returns a piece that is not tracked. Just a random piece to be used for whatever.
    function createPiece(color,type) {
        return new Piece(color,type ,spriteCache.getSprite(color+type), null);
    }
    function getPiece(color,side,type) {
        var isWhite = color.toLowerCase() === "white";
        var kingSide = side.toLowerCase() === "kingside";
        var pieceSet = (isWhite ? whitePieceSet : blackPieceSet);
        var loc;
        switch(type.toLowerCase()) {
            case "rook"   : loc = (kingSide ? KING_ROOK : QUEEN_ROOK); break;                
            case "bishop" : loc = (kingSide ? KING_BISHOP : QUEEN_BISHOP); break; 
            case "knight" : loc = (kingSide ? KING_KNIGHT : QUEEN_KNIGHT); break; 
            case "queen"  : loc = QUEEN; break; 
            case "king"   : loc = KING; break;
        }
        return pieceSet[loc];
    }
    function getUnusedPiece(color,type) {
        var team,used,whiteSelected,pce=null;
        whiteSelected = color.toLowerCase() === "white";
        team = (whiteSelected ? whitePieceSet : blackPieceSet);
        used = (whiteSelected ? whitePiecesUsed : blackPiecesUsed);
        for (var i = 0 ; i < team.length ; i++) {
            if (used[i] === 0 && team[i].name.toLowerCase() === type.toLowerCase()) {
                used[i] = 1;
                pce = team[i];
                break;
            }
        }
        return pce;
    }
    function returnPiece(pce) {
        var team,used;
        console.log("returnPiece called");

        if (pce.startingSquare === null) { return; } // returning an untracked piece so we are done
        
        team = (pce.isWhite ? whitePieceSet : blackPieceSet);
        used = (pce.isWhite ? whitePiecesUsed : blackPiecesUsed);
        for (var i = 0 ; i < team.length ; i++) {
            if (used[i] === 1 && team[i].name.toLowerCase() === pce.name.toLowerCase() && 
                ArrayUtils.isequal(pce.startingSquare,team[i].startingSquare)) {
                used[i] = 0;
                break;
            }
        }
        pce.square = null;
    }
    function getRandomPiece(color) {
    	var team, pieceIdx, whiteSelected;
    	if (color === undefined) {
    		whiteSelected = Math.floor((Math.random()*2)) === 0;
    	} else if (color.toLowerCase() === "white") {
    		whiteSelected = true;
    	} else if (color.toLowerCase() === "black") {
    		whiteSelected = false;
    	}
    	team = (whiteSelected ? whitePieceSet : blackPieceSet);
    	used = (whiteSelected ? whitePiecesUsed : blackPiecesUsed);
    	pieceIdx = Math.floor((Math.random()*team.length));
    	while (used[pieceIdx] > 0) {
    		pieceIdx = Math.floor((Math.random()*team.length));
    	}
    	used[pieceIdx] = 1;
    	return team[pieceIdx];
    }
    // function validSquareFor(square,piece) {
        
    //     // Pawns cannot be on first or last rank
    //     if (isPiece(piece,"pawn")) {
    //     	if (square.row === 0 || square.row === 7) { return false; }
    //     }
    //     // Bishops must be on opposite colors
    //     if (isPiece(piece,"bishop")) {
    // 	    var pieceColor = (piece.isWhite ? "white" : "black");
    // 	    var pieceOnBoardInfo = board.findPieceOnBoard(pieceColor,"Bishop");
    //         if (pieceOnBoardInfo !== null) {
    //         	if (pieceOnBoardInfo.square.color === square.color) {
    //         		return false;
    //         	}
    //         }
    //     }

    //     // Kings can't be in check

    //     return true;
    // }

    // ----------------------------------------------------------------------
    // These will be private
    function createPieceSets() {
    	whitePiecesUsed = new Array(16);
        blackPiecesUsed = new Array(16);
        for (var i = 0 ; i < whitePiecesUsed.length; i++) {
            whitePiecesUsed[i] = 0;
            blackPiecesUsed[i] = 0;
        }
        whitePieceSet = new Array(16);
        whitePieceSet[0]  = new Piece("White","Rook"  ,spriteCache.getSprite("WhiteRook"),   [7,0]);
        whitePieceSet[1]  = new Piece("White","Knight",spriteCache.getSprite("WhiteKnight"), [7,1]);
        whitePieceSet[2]  = new Piece("White","Bishop",spriteCache.getSprite("WhiteBishop"), [7,2]);
        whitePieceSet[3]  = new Piece("White","King"  ,spriteCache.getSprite("WhiteKing"),   [7,3]);
        whitePieceSet[4]  = new Piece("White","Queen" ,spriteCache.getSprite("WhiteQueen"),  [7,4]);
        whitePieceSet[5]  = new Piece("White","Bishop",spriteCache.getSprite("WhiteBishop"), [7,5]);
        whitePieceSet[6]  = new Piece("White","Knight",spriteCache.getSprite("WhiteKnight"), [7,6]);
        whitePieceSet[7]  = new Piece("White","Rook"  ,spriteCache.getSprite("WhiteRook"),   [7,7]);
        whitePieceSet[8]  = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,0]);
        whitePieceSet[9]  = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,1]);
        whitePieceSet[10] = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,2]);
        whitePieceSet[11] = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,3]);
        whitePieceSet[12] = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,4]);
        whitePieceSet[14] = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,5]);
        whitePieceSet[13] = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,6]);
        whitePieceSet[15] = new Piece("White","Pawn"  ,spriteCache.getSprite("WhitePawn"),   [6,7]);

        blackPieceSet = new Array(16);
        blackPieceSet[0]  = new Piece("Black","Rook"  ,spriteCache.getSprite("BlackRook"),   [0,0]);
        blackPieceSet[1]  = new Piece("Black","Knight",spriteCache.getSprite("BlackKnight"), [0,1]);
        blackPieceSet[2]  = new Piece("Black","Bishop",spriteCache.getSprite("BlackBishop"), [0,2]);
        blackPieceSet[3]  = new Piece("Black","King"  ,spriteCache.getSprite("BlackKing"),   [0,3]);
        blackPieceSet[4]  = new Piece("Black","Queen" ,spriteCache.getSprite("BlackQueen"),  [0,4]);
        blackPieceSet[5]  = new Piece("Black","Bishop",spriteCache.getSprite("BlackBishop"), [0,5]);
        blackPieceSet[6]  = new Piece("Black","Knight",spriteCache.getSprite("BlackKnight"), [0,6]);
        blackPieceSet[7]  = new Piece("Black","Rook"  ,spriteCache.getSprite("BlackRook"),   [0,7]);
        blackPieceSet[8]  = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,0]);
        blackPieceSet[9]  = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,1]);
        blackPieceSet[10] = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,2]);
        blackPieceSet[11] = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,3]);
        blackPieceSet[12] = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,4]);
        blackPieceSet[14] = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,5]);
        blackPieceSet[13] = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,6]);
        blackPieceSet[15] = new Piece("Black","Pawn"  ,spriteCache.getSprite("BlackPawn"),   [1,7]);
    }
}