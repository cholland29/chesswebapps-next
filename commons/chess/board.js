function Board(canvas,squareSize,padding,OnResourcesLoaded) {

    var SQUARE_SIZE  = squareSize,     // in pixels
        BOARD_WIDTH  = SQUARE_SIZE * 8,
        BOARD_HEIGHT = SQUARE_SIZE * 8,
        LIGHT_COLOR_IDX = 0,
        DARK_COLOR_IDX  = 1,
        colors = ["white","gray"],
        letters = ["a", "b", "c", "d", "e", "f", "g", "h"],
        numbers = [8, 7, 6, 5, 4, 3, 2, 1],
        squares,
        watk, // white team attack grid
        batk, // black team attack grid
        draw_board_coords = "outside", // inside or none
        board_flipped = false,
        arrows = [],                   // stores arrows the user has made
        padding_top = padding[0],
        padding_right = padding[1],
        padding_bottom = padding[2],
        padding_left = padding[3],
        canvasutils = new CanvasUtils();

    // Text Attribute Vars (for drawMessage)
    this.fillOrStroke = "stroke";
    this.fontStyle = "normal";
    this.fontWeight = "normal";
    this.textSize = "20";
    this.textFont = "monospace";
    this.textColor = "#FF0000";

    this.theCanvas = canvas;
    this.context = this.theCanvas.getContext("2d");
    this.highlightColor = "#44FF1F"; // for highlighting  -- color of stroke rect
    this.arrowHeadColor = "#1AD920";
    this.arrowStemColor = "#1AD920"; // arrow color
    this.arrowStemWidth = 5;
    this.arrowTransparency = 1.0;
    this.arrowHeadType  = 1; // 0: none, 1: arrow at (x2,y2), 2: arrow at (x1,y1), 3: both
    this.arrowHeadLength = 25;
    this.arrowHeadDegree = Math.PI/8;
    this.padding = padding;
    this.squareSize = squareSize;

    var sprites = new SpriteCache("commons/chess/images/spriteSheet_" + SQUARE_SIZE + "_alpha.png",SQUARE_SIZE,SQUARE_SIZE,OnPiecesSheetLoaded);
    var pceManager = pieceManager(sprites);  // don't need 'new' keyword here. Look up "Module" section in Javascript: The Good Parts"
    this.PIECE_ROOK   = 0;
    this.PIECE_QUEEN  = 1;
    this.PIECE_PAWN   = 2;
    this.PIECE_KNIGHT = 3;
    this.PIECE_KING   = 4;
    this.PIECE_BISHOP = 5;

    function Square(row,col,color) {

        this.piece = null;
        this.highlight = null;
        this.highlightLineWidth = 5;     // line width of stroke rect (which is what a highlight is)
        this.highlightInnerSpacing = 3;  // distance from edge of square to stroke rect in pixels
        this.color = color;
        this.row = row;
        this.col = col;

        this.equals = function(sq) { 
            console.log("Square.equals(["+this.row+"==="+sq.row+"]["+this.col+"==="+sq.col+"]"); 
            return ((this.row === sq.row) && (this.col === sq.col));
        }
        this.isEmpty = function() { return this.piece === null; }
        this.addPiece = function(piece) {
            this.piece = piece;
            piece.square = this;
        };

        this.removePiece = function() {
            var p = this.piece;
            this.piece = null;
            p.square = null; // does this actually work?
            return p;
        };

        this.isHighlighted = function() { return this.highlight !== null; };

        this.addHighlight = function(color) {
            this.highlight = color;
        };

        this.removeHighlight = function() {
            this.highlight = null;
        };

        this.toAlgebraic = function() {
            return letters[this.col] + (8-this.row);
        };

        this.getFileLetter = function() {
            return letters[this.col];
        }

        this.getRankNumber = function() {
            return 8-this.row;
        }

        this.toString = function() {
            return "["+this.row+","+this.col+"] -- Piece: " + (this.piece?this.piece.name:"none");
        }

        this.getRectBounds = function() {
            var r = this.row;
            var c = this.col;
            if (board_flipped === true) {
                r = 7 - r;
                c = 7 - c;
            }
            var canvasX = padding_left + (c)*SQUARE_SIZE;
            var canvasY = padding_top + (r)*SQUARE_SIZE;
            return [canvasX,canvasY,SQUARE_SIZE,SQUARE_SIZE];
        };

        this.getCenterCoords = function() {
            var rect = this.getRectBounds();
            return [rect[0] + SQUARE_SIZE/2, rect[1] + SQUARE_SIZE/2];
        };

        this.draw = function(context) {
            var r = this.row;
            var c = this.col;
            if (board_flipped === true) {
                r = 7 - r;
                c = 7 - c;
            }
            var canvasX = padding_left + (c)*SQUARE_SIZE;
            var canvasY = padding_top + (r)*SQUARE_SIZE;
            context.fillStyle = this.color;
            context.fillRect(canvasX,canvasY,SQUARE_SIZE,SQUARE_SIZE);
            if (this.piece !== null) {
                var ss = SQUARE_SIZE;
                var sourceX = this.piece.sprite.sourceX;
                var sourceY = this.piece.sprite.sourceY;
                var spriteSheet = this.piece.sprite.sheet;
                context.drawImage(spriteSheet,
                    sourceX*SQUARE_SIZE,sourceY*SQUARE_SIZE,SQUARE_SIZE,SQUARE_SIZE, // position in sprite sheet
                    canvasX,canvasY,SQUARE_SIZE,SQUARE_SIZE); // position on canvas
            }

            if (this.highlight !== null) {
                // Draw highlight square
                context.strokeStyle = this.highlight;
                var lineW = this.highlightLineWidth; // width of stroke
                var innerW = this.highlightInnerSpacing; // distance from edge of square to stroke rect in pixels
                context.lineWidth = lineW;
                context.strokeRect(canvasX+innerW,canvasY+innerW,SQUARE_SIZE-2*innerW,SQUARE_SIZE-2*innerW);
                // context.strokeRect(canvasX+w,canvasY+w,SQUARE_SIZE-2*w,SQUARE_SIZE-2*w);
            }
        };
    };

this.reset = function() {
   initSquares();
   pceManager.reset();
};
this.calcPosition = function() {
    var pce;
    for (var col = 0; col < 8; col++) {
        for (var row = 0; row < 8 ; row++) {
            pce = square[row][col].piece;
            if (pce !== null) {
                pce.getAttackGrid((pce.isWhite ? watk : batk ));
            }
        }
    }
}
var initSquares = function() {
    var row,col;
    console.log("Initializing Squares");
    squares = new Array(8);
    watk = new Array(8);
    batk = new Array(8);
    for (col = 0; col < 8; col++) {
       squares[col] = new Array(8);
       watk[col] = new Array(8);
       batk[col] = new Array(8);
    }
    for (col = 0; col < 8 ; col++) {
        for (row = 0; row < 8 ; row++) {
            squares[row][col] = new Square(row,col,colors[(row+col)%2]);
            watk[row][col] = 0;
            batk[row][col] = 0;
        }
    }
};

function OnPiecesSheetLoaded(e) {
    initSquares();
    initPieces();
    OnResourcesLoaded();
}

this.getSpriteSheet = function() {
    return sprites.spriteSheet;
}
this.getSpriteCache = function() { return sprites; }
this.getPieceManager = function() { return pceManager; }

this.getWhitePieces = function() { return pceManager.getWhitePieces(); }
this.getBlackPieces = function() { return pceManager.getBlackPieces(); }

this.getWhiteAttackGrid = function() { return watk; }
this.getBlackAttackGrid = function() { return batk; }

this.makeMove = function(pce,toSquare,actualMove) {

    console.log("board::makeMove() called");
    // TODO: Handle en passant
    pce.hasMoved = true;

    // Handle Special Move Cases

    // Handle Pawn Promotion
    var pawnPromotion = false;
    if (actualMove.indexOf("=") != -1) {
        var idx = actualMove.indexOf("=");
        var promotionPieceChar = actualMove.charAt(idx+1);
        var promotionPieceType = ChessUtils.alg2PieceType(promotionPieceChar);
        var promotionPiece = this.createPiece(pce.color,promotionPieceType);
        this.returnPiece(pce);
        pce = promotionPiece;
    }

    // Handle Castling
    if (actualMove === 'O-O') { // this has already been validated so lets do it!
        var king = pce;
        var rook = this.getPiece(king.color,"kingside","rook");
        var rookSquare = this.findSquareWithPiece(rook);
        this.removePiece(rookSquare);
        this.addPiece(rook,this.getSquare(toSquare.row,toSquare.col-1));
    } else if (actualMove === 'O-O-O') {
        var king = pce;
        var rook = this.getPiece(king.color,"queenside","rook");
        var rookSquare = this.findSquareWithPiece(rook);
        this.removePiece(rookSquare);
        this.addPiece(rook,this.getSquare(toSquare.row,toSquare.col+1));
    }

    // Move pce to toSquare
    this.addPiece(pce,toSquare);
    this.updateAttackGrids();

    // $('#debugDisplay').html("Move made")
    this.dumpGrids($('#debugDisplay'));

}

this.updateAttackGrids = function() {

    // First we have to zero out the old matrices
    for (var r = 0; r < 8 ; r++) {
        for (var c = 0; c < 8 ; c++) {
            watk[r][c] = 0;
            batk[r][c] = 0;
        }
    }
    // Question: Should we call this after adding/removing pieces to the board?
    for (var r = 0; r < 8 ; r++) {
        for (var c = 0; c < 8 ; c++) {
            var sq = squares[r][c];
            var pce = sq.piece;
            if (pce !== null) {
                if (pce.isWhite) {
                    watk = pce.getAttackGrid(pce,sq,this,watk); // returns watk with pce's attack values added
                } else {
                    batk = pce.getAttackGrid(pce,sq,this,batk); // returns batk with pce's attack values added
                }
            }
        }
    }
}

this.kingInCheckForColor = function(color) {
    var atkGrid = color.toLowerCase() === "white" ? batk : watk;
    return this.kingInCheck(atkGrid);
}
this.kingInCheck = function (atkGrid) {
    for (var r = 0 ; r < 8 ; r++) {
        for (var c = 0; c < 8; c++) {
            if (atkGrid[r][c] === 3) {
                return true;
            }
        }
    }
    return false;
}
this.getKnightMovePath = function(fromSquare,toSquare) {
    // toSquare = this.algebraicToSquare(toSquare);
    var arrowPath = fromSquare.toAlgebraic();
    var diffCol = toSquare.col-fromSquare.col;
    var diffRow = toSquare.row-fromSquare.row;
    arrowPath += this.rowColToAlgebraic(fromSquare.row,fromSquare.col+diffCol);
    arrowPath += this.rowColToAlgebraic(fromSquare.row+diffRow,toSquare.col);
    return arrowPath;
}

this.dumpGrids = function(toJqueryElement) {

       var watkStr = ChessUtils.attackGridToString(watk);
       var batkStr = ChessUtils.attackGridToString(batk);

       var str = "";
       str += ("---------- White Attack Grid: ----------\n" + watkStr + 
               "---------- Black Attack Grid: ----------\n" + batkStr +
               "---------- Piece Placement History  : ----------\n" + ArrayUtils.arr2str(history.pces) + "\n" +
               "---------- Skip Squares     : ----------\n" + ArrayUtils.arr2str(history.skipSquares) + "\n" +
               "---------- White Pieces Used : ---------\n" + ArrayUtils.arr2str(pceManager.getWhitePiecesUsed()) + "\n" +
               "---------- Black Pieces Used : ---------\n" + ArrayUtils.arr2str(pceManager.getBlackPiecesUsed()) + "\n");
        toJqueryElement.html(HtmlUtils.str2html(str));
}

var initPieces = function() {
    var sprite;

    // TODO: I think we can move the entire spriteCache to the pceManager
    pceManager.initPieces();

    // whitePieces = new Array(6);
    // sprite = sprites.defineSprite("WhiteRook",0,0);   whitePieces[0] = new Piece("White","Rook",sprite);
    // sprite = sprites.defineSprite("WhiteQueen",1,0);  whitePieces[1] = new Piece("White","Queen",sprite);
    // sprite = sprites.defineSprite("WhitePawn",2,0);   whitePieces[2] = new Piece("White","Pawn",sprite);
    // sprite = sprites.defineSprite("WhiteKnight",3,0); whitePieces[3] = new Piece("White","Knight",sprite);
    // sprite = sprites.defineSprite("WhiteKing",0,1);   whitePieces[4] = new Piece("White","King",sprite);
    // sprite = sprites.defineSprite("WhiteBishop",1,1); whitePieces[5] = new Piece("White","Bishop",sprite);

    // blackPieces = new Array(6);
    // sprite = sprites.defineSprite("BlackRook",2,1);   blackPieces[0] = new Piece("Black","Rook",sprite);
    // sprite = sprites.defineSprite("BlackQueen",3,1);  blackPieces[1] = new Piece("Black","Queen",sprite);
    // sprite = sprites.defineSprite("BlackPawn",0,2);   blackPieces[2] = new Piece("Black","Pawn",sprite);
    // sprite = sprites.defineSprite("BlackKnight",1,2); blackPieces[3] = new Piece("Black","Knight",sprite);
    // sprite = sprites.defineSprite("BlackKing",2,2);   blackPieces[4] = new Piece("Black","King",sprite);
    // sprite = sprites.defineSprite("BlackBishop",3,2); blackPieces[5] = new Piece("Black","Bishop",sprite);
};

this.getSquares = function() { return squares; }
this.getSquare = function(row,col) { return squares[row][col]; } 
this.findSquareWithPiece = function(pce) {
    for (var r = 0; r < 8 ; r++) {
        for (var c = 0; c < 8 ; c++) {
            sq = squares[r][c];
            if (sq.piece === pce) {
                return sq;
            }
        }
    }
}
this.findPieceOnBoard = function(color,name,skipPiece) {
    var pieceOnBoard, sq;
    if (typeof skipPiece === 'undefined') {
        var skipPiece = null;
    }
    for (var r = 0; r < 8 ; r++) {
        for (var c = 0; c < 8 ; c++) {
            sq = squares[r][c];
            pieceOnBoard = sq.piece;
            if (pieceOnBoard !== null) {
                if ( pieceOnBoard.name.toLowerCase() === name.toLowerCase() && 
                     pieceOnBoard.color.toLowerCase() === color.toLowerCase()) {

                    console.log("Matched Piece Found At -- row: " + r + " -- col: " + c);

                    if (skipPiece !== null && skipPiece.square !== null) {
                        if (pceManager.areMatchingPieces( pieceOnBoard, skipPiece )) {
                            console.log("skipPiece detected on square ["+r+","+c+"]");
                            continue;
                        }
                    }
                    return {
                        piece: pieceOnBoard,
                        square: sq
                    };
                }
            }
        }
    }
    return null;
};
this.findMatchingPieceFor = function(pce) {
    var pieceType = pce.name.toLowerCase();
    var pieceColor = pce.color.toLowerCase();
    var matchingPieceInfo = this.findPieceOnBoard(pieceColor,pieceType,pce);
    return matchingPieceInfo;
}
this.findAllMatchingPiecesFor = function(pce) {
    var pieceOnBoard, sq;
    if (typeof pce === 'undefined' || pce == null) { return null; }
        
    var pceList = [];
    var pceName = pce.name.toLowerCase();
    var pceColor = pce.color.toLowerCase();
    for (var r = 0; r < 8 ; r++) {
        for (var c = 0; c < 8 ; c++) {
            sq = squares[r][c];
            pieceOnBoard = sq.piece;
            if ( pieceOnBoard !== null && pieceOnBoard.name.toLowerCase() === pceName && pieceOnBoard.color.toLowerCase() === pceColor) {
                 
                console.log("Matched Piece Found At -- row: " + r + " -- col: " + c);

                if (pce.square !== null) {
                    console.log("pce.square != null");
                    if (pceManager.areMatchingPieces( pieceOnBoard, pce )) {
                        console.log("skipPiece detected on square ["+r+","+c+"]");
                        continue;
                    }
                }

                pceList.push(pieceOnBoard);
            }
        }
    }
    return pceList;
}
this.getSquareDescriptorForMove = function(pce,fromSquare,toSquare) {
    // Note the move for pce SHOULD HAVE already been validated before calling this
    var pceList = this.findAllMatchingPiecesFor(pce);
    var cnt = 0;
    var descriptor = ""; // this is returned if cnt === 0

    // At this point the selected piece, pce, is in the process of being moved and has been removed from the board
    // This is done in the OnMouseDown function when they first select the piece, necessary so it will draw properly.
    // So here we need to add it back to the board temporarily so that it can properly tell if the pieces in pceList
    // can validly move to the toSquare without colliding with the selected piece itself. This is kind of a HACK.
    pceBeingMoved = fromSquare.isEmpty();
    if (pceBeingMoved) {
        this.addPieceToSquare(pce,fromSquare,this);
    }

    for (var i = 0 ; i < pceList.length ; i++) {
        console.log("getSquareDescriptorForMove: toSquare: " + toSquare.toString());
        if (pceList[i].isValidMove(pceList[i],pceList[i].square,toSquare,this)) {
            cnt++;
            if (pceList[i].square.row === fromSquare.row) { // if they are on the same row we use the file letter
                descriptor = fromSquare.getFileLetter();
            }
            else if (pceList[i].square.col === fromSquare.col) { // if they are on the same file we use the rank number
                descriptor = fromSquare.getRankNumber();
            }
            else {
                descriptor = fromSquare.getFileLetter();
            }
        }
    }

    if (pceBeingMoved) {
        this.removePiece(fromSquare); // now we have to remove it again to return to the state it should be in
    }
    
    if (cnt > 1) { 
        // this means multiple pieces can move to this square 
        // in this case we will use the entire square for a descriptor
        descriptor = fromSquare.toAlgebraic();
    }
    return descriptor;
}
this.getValidMovesFromSquare = function(square) {
    var piece = square.piece;
    if (piece === null) { return null; }
    return piece.getValidMovesFromSquare(square,this);
};

this.clearArrows = function() {
    arrows = [];
};

this.addArrow = function(newArrowPath) {
    arrows.push(newArrowPath);
};

this.popArrow = function() {
   arrows.pop();
};

this.setPadding = function(newPadding) {
    padding_top    = newPadding[0];
    padding_right  = newPadding[1];
    padding_bottom = newPadding[2];
    padding_left   = newPadding[3];
    this.padding = newPadding;
}

this.setBoardFlipped = function(state) {
    board_flipped = state;
};
this.getBoardFlipped = function() {
    return board_flipped;
};

this.setDrawBoardCoords = function(displayType) {
    draw_board_coords = displayType;
};

this.getDarkColor  = function(){ return colors[DARK_COLOR_IDX]; }
this.getLightColor = function(){ return colors[LIGHT_COLOR_IDX]; }
this.setDarkColor = function(color) {
    colors[DARK_COLOR_IDX] = color;
    for (var row = 0 ; row < 8 ; row++) {
        for (var col = 0 ; col < 8 ; col++) {
            squares[row][col].color = colors[(row+col)%2];
        }
    }
};

this.setLightColor = function(color) {
    colors[LIGHT_COLOR_IDX] = color;
    for (var row = 0 ; row < 8 ; row++) {
        for (var col = 0 ; col < 8 ; col++) {
            squares[row][col].color = colors[(row+col)%2];
        }
    }
};

this.setHighlightColor = function(color) {
    this.highlightColor = color;
      // for (var row = 0 ; row < 8 ; row++) {
      //    for (var col = 0 ; col < 8 ; col++) {
      //       if (squares[row][col].isHighlighted()) {
      //          squares[row][col].addHighlight(color);
      //       }
      //    }
      // }
};

this.setArrowHeadColor = function(color) {
    this.arrowHeadColor = color;
};

this.setArrowStemColor = function(color) {
    this.arrowStemColor = color;
};

this.setArrowStemWidth = function (width) {
    this.arrowStemWidth = width;
};

this.setArrowTransparency = function (alpha) {
    this.arrowTransparency = alpha;
};

this.setArrowHeadType = function(type) {
   this.arrowHeadType = parseInt(type);
};

this.setArrowHeadLength = function(len) {
   this.arrowHeadLength = parseInt(len); 
};

this.setArrowHeadDegree = function(degree) {
   this.arrowHeadDegree = degree; 
};

this.clearBoard = function() {
    initSquares();
    pceManager.reset();
    this.clearArrows();
};

this.createPiece = function(color,type) { // create an untracked piece
    return pceManager.createPiece(color,type);
}
this.returnPiece = function( piece ) {
    pceManager.returnPiece(piece);
}

this.addPiece = function(piece,square) {
    if (square.piece !== null) {
        pceManager.returnPiece(square.piece);
    }
    square.addPiece(piece);
};

this.addPieceToSquare = function(piece,square) {
    if (square.piece !== null) {
        pceManager.returnPiece(square.piece);
    }
    square.addPiece(piece);
};


this.addPieceToSquareCoord = function(piece,algCoord) {
    var square = this.algebraicToSquare(algCoord);
    square.addPiece(piece);
};

this.removePiece = function(square) {
   return square.removePiece();
};

this.getPiece = function(color,side,type) { // side can be "kingside" or "queenside"
   return pceManager.getPiece(color,side,type);
}

this.clearBackground = function() {
    this.context.fillStyle = "#FFFFFF";
    this.context.fillRect(padding_left,padding_top,BOARD_WIDTH,BOARD_HEIGHT); // this just clears the board
};

this.drawSquares = function() {
    for (var row = 0 ; row < 8 ; row++) {
       for (var col = 0 ; col < 8 ; col++) {
           squares[row][col].draw(this.context);
       }
    }
};

this.drawArrows = function() {
    for (var i = 0; i < arrows.length ; i++) {
        this.drawArrow(arrows[i],null,null);
    }
};

this.drawArrow = function(arrowPath,mouseX,mouseY) {
    //console.log("Drawing Arrow: " + arrowPath + " -- Length: " + arrowPath.length + " -- mouseX: " + mouseX + " mouseY: " + mouseY);
    var canvasX, canvasY, old_canvasX, old_canvasY, x1, y1, x2, y2, oldTransparency;

    // Set defaults unless user passes in values for them explicitly
    var which=typeof(which)!='undefined'? which:1; // end point gets arrow
    var angle=typeof(angle)!='undefined'? angle:this.arrowHeadDegree;
    var d    =typeof(d)    !='undefined'? d    :this.arrowHeadLength;
    var style=typeof(style)!='undefined'? style:this.arrowHeadType;

    style = this.arrowHeadType;
    angle = this.arrowHeadDegree;
    d     = this.arrowHeadLength;
    oldTransparency = this.context.globalAlpha;
    this.context.globalAlpha = this.arrowTransparency;
    this.context.fillStyle = this.arrowHeadColor;
    this.context.strokeStyle = this.arrowStemColor;
    this.context.lineWidth = this.arrowStemWidth;
    this.context.lineCap = "circle";
    this.context.lineJoin = "round";

    var squaresInPath = arrowPath.length/2;

    for (var j = 0; j < arrowPath.length ; j+=2) {
        var square = this.algebraicToSquare(arrowPath.charAt(j) + arrowPath.charAt(j+1));
        var r = square.row;
        var c = square.col;
        if (board_flipped === true) {
            r = 7 - r;
            c = 7 - c;
        }
        old_canvasX = canvasX;
        old_canvasY = canvasY;
        canvasX = padding_left + (c)*SQUARE_SIZE + Math.floor(SQUARE_SIZE/2);
        canvasY = padding_top  + (r)*SQUARE_SIZE + Math.floor(SQUARE_SIZE/2);

        if (squaresInPath === 1 && j === 0) {
            x1 = canvasX; y1 = canvasY;
            x2 = mouseX;  y2 = mouseY;
            canvasutils.drawArrow(this.context,x1,y1,x2,y2,style,which,angle,d);
        } else if (j < (arrowPath.length-2)) {
            x1 = old_canvasX; y1 = old_canvasY;
            x2 = canvasX;     y2 = canvasY;
            canvasutils.drawLine(this.context,x1,y1,x2,y2);
        } else {
            if (mouseX !== null) {
                x1 = old_canvasX; y1 = old_canvasY;
                x2 = canvasX;     y2 = canvasY;
                canvasutils.drawLine(this.context,x1,y1,x2,y2);
            }
            if (mouseX === null) {
                x1 = old_canvasX; y1 = old_canvasY;
                x2 = canvasX;  y2 = canvasY;
            } else {
                x1 = canvasX; y1 = canvasY;
                x2 = mouseX;  y2 = mouseY;
            }
            canvasutils.drawArrow(this.context,x1,y1,x2,y2,style,which,angle,d);
        }
   }
   this.context.globalAlpha = oldTransparency;
};

this.drawBoardCoordinates = function() {

  var num,numX,numY,let,letX,letY,partOfSquare;

  if (draw_board_coords === "none") { return; }

  if (draw_board_coords === "outside") {

     this.context.fillStyle = "black";
     this.context.font = "normal lighter 20px serif";
     this.context.textBaseline = "middle";
     this.context.textAlign = "center";

     numX = padding_left - 20;
     letY = padding_top + BOARD_HEIGHT + 20;
     for (var i = 1; i <= 8 ; i++) {
            // Draw number
            num = board_flipped ? 9-i : i;
            numY = padding_top + BOARD_HEIGHT - ((i-1)*SQUARE_SIZE + Math.floor(SQUARE_SIZE/2));
            this.context.fillText(num,numX,numY);
            // Draw letter
            let = board_flipped ? letters[8-i] : letters[i-1];
            letX = padding_left + ((i-1)*SQUARE_SIZE + Math.floor(SQUARE_SIZE/2));
            this.context.fillText(let,letX,letY);        
        }
      } else { // inside

         this.context.font = "normal bold 12px serif";
         this.context.textBaseline = "alphabetic";
         this.context.textAlign = "start";
         numX = padding_left + 3;
         letY = padding_top + BOARD_HEIGHT - 3;
         partOfSquare = 5*Math.floor(SQUARE_SIZE/6);
         for (var i = 1; i <= 8 ; i++) {
            this.context.fillStyle = colors[(i-1)%2];

            numY = padding_top + BOARD_HEIGHT - ((i-1)*SQUARE_SIZE + partOfSquare);
            num = board_flipped ? 9-i : i;
            this.context.fillText(num,numX,numY);

            letX = padding_left + ((i-1)*SQUARE_SIZE + partOfSquare);
            let = board_flipped ? letters[8-i] : letters[i-1];
            this.context.fillText(let,letX,letY);
        }
    }   
};

  this.drawBorder = function() {
      this.context.strokeStyle = "black";
      this.context.lineWidth = 2;
      this.context.strokeRect(padding_left-1,padding_top-1,BOARD_WIDTH+2,BOARD_HEIGHT+2);
  };

  this.drawMessage =function(message,where,offset) {

     // Text
      this.context.font = this.fontStyle + " " + this.fontWeight + " " + this.textSize + "px" + " " + this.textFont;

      var metrics = this.context.measureText(message);
      var textWidth = metrics.width;
      var xPosition = 0;
      var yPosition = 0;
      if (typeof where === 'string') {
          switch(where) {
              case "center":
                  xPosition = padding_left+(BOARD_WIDTH/2);// - (textWidth/2);
                  yPosition = padding_top+(BOARD_HEIGHT/2);
                  break;
              case "top":
                  xPosition = padding_left+(BOARD_WIDTH/2);
                  yPosition = 0;
                  break;
              case "bottom":
                  xPosition = padding_left+(BOARD_WIDTH/2);
                  yPosition = this.theCanvas.height;
                  break;
          }
          if (offset) {
              xPosition += offset[0];
              yPosition += offset[1];
          }
      } else {
        // assume its coordinates on screen
        xPosition = where[0] + offset[0];
        yPosition = where[1] + offset[1];
      }

      // Adjust coords if being clipped off edge of canvas
      var canvasW = (padding_left + BOARD_WIDTH + padding_right);
      if ( (xPosition + textWidth) > canvasW ) {
        xPosition = canvasW-textWidth;
      }
      if (xPosition < 0) {
        xPosition = 0;
      }
      // TODO: adjust for yPosition

      //console.log("xPosition: " + xPosition + " --- yPosition: " + yPosition);

      switch(this.fillOrStroke) {
        case "fill":
            this.context.fillStyle = this.textColor;
            this.context.fillText(message,xPosition,yPosition);
            break;
        case "stroke":
            this.context.strokeStyle = this.textColor;
            this.context.strokeText(message,xPosition,yPosition);
            break;
        case "both":
            this.context.fillStyle = this.textColor;
            this.context.fillText(message,xPosition,yPosition);
            this.context.strokeStyle = "#000000";
            this.context.strokeText(message,xPosition,yPosition);
            break;
      }
  };

  this.getRectBounds = function() {
      return [padding_left,padding_top,BOARD_WIDTH,BOARD_HEIGHT];
  };

  this.getFullRectBounds = function() { // includes padding
      return [0,0,padding_left+BOARD_WIDTH+padding_right,padding_top+BOARD_HEIGHT+padding_bottom];
  }

  this.clickInSquare = function (mouseCoords,row,col) {

      if (mouseCoords.x < padding_left || mouseCoords.y < padding_top) { return false; }

      if ((mouseCoords.x > (padding_left + row*SQUARE_SIZE) && mouseCoords.x <= (padding_left + row*SQUARE_SIZE+SQUARE_SIZE)) &&
          (mouseCoords.y > (padding_top + col*SQUARE_SIZE) && mouseCoords.y <= (padding_top + col*SQUARE_SIZE+SQUARE_SIZE)))  {
          return true;
      }
  };

// Converts square to screen coordinates
this.squareToScreen = function (square) {
    // returning 4 element array where
    // r[0] = top corner x
    // r[1] = top corner y
    // r[2] = square width
    // r[3] = square height
    screenX = square.col * SQUARE_SIZE + padding_left;
    screenY = square.row * SQUARE_SIZE + padding_top;
    return [screenX, screenY, SQUARE_SIZE, SQUARE_SIZE];
};

this.screenToSquare = function (screenX, screenY) {
  var col = Math.floor((screenX-padding_left) / SQUARE_SIZE);
  var row = Math.floor((screenY-padding_top) / SQUARE_SIZE);
  var r = row;
  var c = col;
  if (board_flipped) {
     r = 7-row;
     c = 7-col;
  }
  if (r < 0 || r > 7 || c < 0 || c > 7) {
    return null;
  }
  return squares[r][c];
};

this.algebraicToSquare = function(squareCoord) { //ex. "a4", "e5", "h8", etc
   var let = squareCoord.charAt(0);
   var num = squareCoord.charAt(1);
   var row = 8 - parseInt(num);
   var col = letters.indexOf(let);
   return squares[row][col];
};

this.squareToAlgebraic = function(square) {
      return letters[square.col] + (8-square.row);
};

this.rowColToAlgebraic = function(row,col) {
   return letters[col] + (8-row);
};

this.loadFen = function(fen) {

      // http://chessprogramming.wikispaces.com/Forsyth-Edwards+Notation#FEN%20Syntax
      // 1. Piece placement
      // 2. Who's move?
      // 3. Castling Options
      // 4. en passant square candidates
      // 5. Number of moves towards 50-move draw rule
      // 6. Total number of moves
      initSquares();
      pceManager.reset();
      //fen = '3r2k1/1p5p/6p1/p2q1p2/P1Q5/1P5P/1P6/5RK1 w - - 0 1';
      var items = fen.split(/\s/g);
      var pieces = items[0];
      console.log("Pieces: " + items[0]); // pieces
      console.log("Move: " + items[1]); // whos move
      var col = 0;
      var row = 0;
      var i = 0;

      var pce = null;
      var pceColor;
      var pceType;
      while( i < pieces.length ){
         var character = pieces.substr(i++,1);
         if (character === "/") {
            row++;
            col = 0;
            continue;
        } else if(character.match(/[A-Z]/)){ /* White pieces */                  
            pceColor = "White";
        } else if(character.match(/[a-z]/)){ /* Black pieces */
            pceColor = "Black";
        } else {
            col += parseInt(character);
            continue;
        }

        switch(character.toLowerCase()) {
            case "p": pceType = "Pawn"; break; 
            case "n": pceType = "Knight"; break;
            case "b": pceType = "Bishop"; break;
            case "r": pceType = "Rook"; break;
            case "q": pceType = "Queen"; break;
            case "k": pceType = "King"; break;
            default:
        }

        pce = pceManager.getUnusedPiece(pceColor,pceType);
        if (pce === null) {
            pce = pceManager.createPiece(pceColor,pceType);
        }
        squares[row][col++].addPiece(pce);

      }
    // drawScreen();
};
// this.loadFen = function(fen) {

//       // http://chessprogramming.wikispaces.com/Forsyth-Edwards+Notation#FEN%20Syntax
//       // 1. Piece placement
//       // 2. Who's move?
//       // 3. Castling Options
//       // 4. en passant square candidates
//       // 5. Number of moves towards 50-move draw rule
//       // 6. Total number of moves
//       initSquares();
//       //fen = '3r2k1/1p5p/6p1/p2q1p2/P1Q5/1P5P/1P6/5RK1 w - - 0 1';
//       var items = fen.split(/\s/g);
//       var pieces = items[0];
//       console.log("Pieces: " + items[0]); // pieces
//       console.log("Move: " + items[1]); // whos move
//       var col = 0;
//       var row = 0;
//       var i = 0;
//       var team = null;
//       var pce = null;
//       while( i < pieces.length ){
//          var character = pieces.substr(i++,1);
//          if (character === "/") {
//             row++;
//             col = 0;
//             continue;
//         } else if(character.match(/[A-Z]/)){ /* White pieces */                  
//             team = whitePieces;
//         } else if(character.match(/[a-z]/)){ /* Black pieces */
//             team = blackPieces;
//         } else {
//             col += parseInt(character);
//             continue;
//         }

//         switch(character.toLowerCase()) {
//             case "p": pce = team[this.PIECE_PAWN]; break;
//             case "n": pce = team[this.PIECE_KNIGHT]; break;
//             case "b": pce = team[this.PIECE_BISHOP]; break;
//             case "r": pce = team[this.PIECE_ROOK]; break;
//             case "q": pce = team[this.PIECE_QUEEN]; break;
//             case "k": pce = team[this.PIECE_KING]; break;
//             default:
//         }
//         squares[row][col++].addPiece(pce);

//       }
//     // drawScreen();
// };

this.convertToFen = function() {
    var emptySquareCount = 0;
    var fd;
    var fen = "";
    for( var r = 0 ; r < 8 ; r++ ) {
        for (var c = 0; c < 8 ; c++) {
            var sq = squares[r][c];
            if (sq.piece === null) {
                emptySquareCount++;
            } else {
                fd = sq.piece.getFenDescriptor();
                if (emptySquareCount > 0) {
                    fen = fen + emptySquareCount + fd;
                    emptySquareCount = 0;
                } else {
                    fen = fen + fd;
                }
            }
        }
        if (emptySquareCount > 0) {
            fen = fen + emptySquareCount;
            emptySquareCount = 0;
        }
        if (r < 7) {
            fen = fen + "/";
        }
    }    

    var personToMove = "w";  // Add person to move {w|b}
    var castleOption = "-";  // Add castling options
    var enpassantTgt = "-";  // Add enpassant target square
    var drawMoveCount = "0"; // Add 50 move draw count
    var fullMoveCount = "1"; // Add full move counter
      
    fen = fen + " " + personToMove + " " + castleOption + " " + enpassantTgt + " " + drawMoveCount + " " + fullMoveCount;

    return fen;
};

function simpleHtmlentities(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// pgnGame does this now
// this.loadPgn = function(pgnText) {
//     // console.log("Before -- pgnGame.totalPlyCount: " + this.pgnGame.getTotalPlyCount());
//     // this.pgnGame.loadPgn(pgnText);
//     // console.log("After -- pgnGame.totalPlyCount: " + this.pgnGame.getTotalPlyCount());
// }

// Opens a queen pawn promotion dialog letting user select the piece they want to turn the pawn into
//
//
this.showPawnPromotionDialog = function(mouseCoords,color,callback) {

    var sprite = null;
    var pieces = ["Queen","Rook","Bishop","Knight"];
    var imageWidth  = SQUARE_SIZE * pieces.length;
    var imageHeight = SQUARE_SIZE;
    var canvasX = mouseCoords.x - Math.floor(imageWidth/2);
    var canvasY = mouseCoords.y - Math.floor(imageHeight/2) - SQUARE_SIZE;

    var fullBoardBounds = this.getFullRectBounds(); // gets rect bounds of entire board including padding outside of board
    var imageStartX = canvasX;
    var imageStartY = canvasY;
    var pad = [4,4,4,4]; // left, top, right, bot
    var first = true;
    var hoverEnabled = false;
    var radius = 5;
    var lineWidth = 4;
    var that = this;

    console.log("Mouse Coords: ["+mouseCoords.x+","+mouseCoords.y+"]");
    
    var ctx = this.context;
    
    // Adjust imageStartX if it is being clipped
    if (imageStartX < fullBoardBounds[0]) {
        imageStartX = fullBoardBounds[0] + lineWidth + pad[0];
    } else if (imageStartX > ((fullBoardBounds[0] + fullBoardBounds[2]) - imageWidth - lineWidth - pad[2])) {
        imageStartX = ((fullBoardBounds[0] + fullBoardBounds[2]) - imageWidth - lineWidth - pad[2]);
    } 

    // Adjust imageStartY if it is being clipped (this should be impossible in current implementation but just in case for later)
    if (imageStartY < fullBoardBounds[1]) {
        imageStartY = fullBoardBounds[1] + lineWidth + pad[1];
    } else if (imageStartY > ((fullBoardBounds[1] + fullBoardBounds[3]) - imageHeight - lineWidth - pad[3])) {
        imageStartY = ((fullBoardBounds[1] + fullBoardBounds[3]) - imageHeight - lineWidth - pad[3]);
    }

    var imgBounds = [imageStartX,imageStartY,imageWidth,imageHeight];

    var x = imageStartX-pad[0],
        y = imageStartY-pad[1],
        w = imageWidth+pad[0]+pad[2],
        h = imageHeight+pad[1]+pad[3];
    var dlgBounds = [x,y,w,h]; // this in screen coordinates

    // Draw the dialog
    draw(mouseCoords);
    
    this.theCanvas.addEventListener('click',OnClick,false);
    this.theCanvas.addEventListener('mousemove',OnMouseMove,false);

    function draw( mouseCoords ) {

        // Draw filled inner rect 
        ctx.fillStyle = '#F0B40E';// light orange (I like) "#EDE4CE", Henry likes #F0B40E;
        canvasutils.roundRect(ctx,x,y,w,h,radius,true,false);

        // Draw stroked outer rect
        ctx.strokeStyle = '#000000';//"#000000";
        ctx.lineWidth = lineWidth;
        canvasutils.roundRect(ctx,x,y,w,h,radius,false,true);

        // Draw Piece Images
        for (var i = 0; i < pieces.length ; i++) {
            sprite = sprites.getSprite(color+pieces[i]);
            ctx.drawImage(sprite.sheet,
                        sprite.sourceX*SQUARE_SIZE,sprite.sourceY*SQUARE_SIZE,SQUARE_SIZE,SQUARE_SIZE, // position in sprite sheet
                        imageStartX+i*SQUARE_SIZE,imageStartY,SQUARE_SIZE,SQUARE_SIZE); // position on canvas
        }

        // Draw Hover if enabled
        if (hoverEnabled) {
            var imgInfo = mouseHoveringOverPieceImage( mouseCoords );
            ctx.strokeStyle = '#00FF00';//"#000000";
            ctx.lineWidth = 4;
            canvasutils.roundRect(ctx,imgInfo.coords[0],imgInfo.coords[1],imgInfo.coords[2],imgInfo.coords[3],5,false,true);
        }
    }
    function mouseHoveringOverPieceImage( mouseCoords ) {
        // This function assumes mouseInDialog has already been called
        var diffX = mouseCoords.x - imageStartX;
        var idx = Math.floor(diffX / SQUARE_SIZE);
        if (idx > (pieces.length-1)) { idx = (pieces.length-1); } // quick fix to bug where mouse is right on edge of dlg and it idx=4
        
        var ix = imageStartX + idx*SQUARE_SIZE;
        var iy = imageStartY;
        var iw = SQUARE_SIZE;
        var ih = SQUARE_SIZE;
        var imgInfo = {
            name : pieces[idx],
            coords : [ix,iy,iw,ih], 
        };
        return imgInfo;
    }
    function mouseInDialog( mouseCoords ) {
        return (mouseCoords.x >= imageStartX && mouseCoords.x <= imageStartX+imageWidth &&
                mouseCoords.y >= imageStartY && mouseCoords.y <= imageStartY+imageHeight);
    }
    function OnMouseMove(e) {
        // Get the mouse coords
        console.log("Mouse Move!");
        mouseCoords.x = (e.pageX-that.theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-that.theCanvas.offsetTop);// + self.pageYOffset;
        if (mouseInDialog( mouseCoords )) {
            hoverEnabled = true;
            draw(mouseCoords);
        } else {
            if (hoverEnabled) {
                hoverEnabled = false;
                draw(mouseCoords);
            }
        }
    }
    function OnClick(e) {
        if (first) { first = false; console.log("first"); return; } // hack, for some reason adding the event listener triggers it immediately, bypassing here
        console.log("Pawn Promotion Dialog Selection Callback Triggered");
        // Get the mouse coords
        mouseCoords.x = (e.pageX-that.theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-that.theCanvas.offsetTop);// + self.pageYOffset;
        // console.log("Mouse Coords: ["+mouseCoords.x+","+mouseCoords.y+"]");
        // console.log("Dialog Coords: ["+dlgBounds[0]+","+dlgBounds[1]+","+dlgBounds[2]+","+dlgBounds[3]+"]");
        
        if (mouseInDialog( mouseCoords )) {

            var imgInfo = mouseHoveringOverPieceImage( mouseCoords );
            console.log("Selected Piece in OnClick: " + imgInfo.name);
            callback(imgInfo.name);
            that.theCanvas.removeEventListener('click',OnClick,false);
            that.theCanvas.removeEventListener('mousemove',OnMouseMove,false);

        }
        
    }
}

}