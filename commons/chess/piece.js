function Piece( color, name, sprite, startingSquare ) {
   this.color = color;
   this.isWhite = color === "White";
   this.name = name;
   this.square = null; // reference to Square object it is currently on
   this.algDescriptor = null; // algebraic descriptor
   this.fenDescriptor = null;
   this.sprite = sprite;
   this.startingSquare = startingSquare;
   this.hasMoved = false;
   // if (typeof startingSquare !== 'undefined') {
   //     this.startingSquare = startingSquare;
   // }

   this.isPawn   = function() { return this.name === "Pawn"; }
   this.isKing   = function() { return this.name === "King"; }
   this.isQueen  = function() { return this.name === "Queen"; }
   this.isRook   = function() { return this.name === "Rook"; }
   this.isBishop = function() { return this.name === "Bishop"; }
   this.isKnight = function() { return this.name === "Knight"; }
  
   function checkSquare(fromPiece,r,c,board) {
       var collideInfo = {
           pce: null,
           pieceCollision: false,
           collidesWithTeamPiece: false
       };
       var pce = board.getSquare(r,c).piece;
       collideInfo.pieceCollision = ( pce !== null );
       if (collideInfo.pieceCollision) {
           collideInfo.pce = pce;
           collideInfo.collidesWithTeamPiece = (pce.isWhite === fromPiece.isWhite); // ran into team piece
       }
       return collideInfo;
   }

   function isCastlingLegal(king,fromSquare,toSquare,board) {
       var legal = false;
       var r1,c2,r2,c2;
       r1 = fromSquare.row; c1 = fromSquare.col;
       r2 = toSquare.row;   c2 = toSquare.col;
       if (r1 === king.startingSquare[0] && r1 === r2 && (c2 === c1-2 || c2 === c1+2)) {

           console.log("==========Possible castling detected!");

           // Has the king moved before?
           console.log("King Moved: " + king.hasMoved);
           if (king.hasMoved) { return legal; }

           // Has the king rook moved before?
           var side = ((c2 === c1-2) ? "Queenside" : "Kingside");
           var rook = board.getPiece(king.color,side,"rook");
           console.log(side+" Rook Moved: " + rook.hasMoved);
           if (rook.hasMoved) { return legal; }
           
           // Is the king currently in check?
           atkGrid = king.isWhite ? board.getBlackAttackGrid() : board.getWhiteAttackGrid();
           console.log("King is in check: " + (atkGrid[r1][r2] === 3));
           if (atkGrid[r1][r2] === 3) { return legal; }

           // Are the squares in between king and rook vacant?
           // Are the squares in between king and rook being attacked by opposing team?
           if (side === "Kingside") {
               if ( !board.getSquare(r1,c1+1).isEmpty() || !board.getSquare(r1,c1+2).isEmpty() ) {
                   console.log("Kingside squares betwen king and rook are NOT EMPTY: ");
                   return legal;
               } else if (atkGrid[r1][c1+1] >= 1 || atkGrid[r1][c1+2] >= 1 ) {
                   console.log("Kingside squares betwen king and rook are BEING ATTACKED!: ");
                  return legal;
               }
           } else {   // Queenside
               if ( !board.getSquare(r1,c1-1).isEmpty() || !board.getSquare(r1,c1-2).isEmpty() || !board.getSquare(r1,c1-3).isEmpty() ) { 
                   console.log("Queenside squares betwen king and rook are NOT EMPTY: ");
                   return legal;
               } else if (atkGrid[r1][c1-1] >= 1 || atkGrid[r1][c1-2] >= 1 || atkGrid[r1][c1-3] >= 1) {
                   console.log("Queenside squares betwen king and rook are BEING ATTACKED!: ");
                   return legal;
               }
           }

           legal = true;
       }
       return legal;
   }

  //----------------------------------------------------------------------------------
  this.isValidMove = function(fromPiece,fromSquare,toSquare,board) {

       var validMove = false, pieceCollision = false, info = null, pieceBlock = false;

       var r1,c2,r2,c2;
       r1 = fromSquare.row; c1 = fromSquare.col;
       r2 = toSquare.row;   c2 = toSquare.col;

       switch(this.name.toLowerCase()) {
           case "pawn"  : isValidMoveFor_Pawn(); break;
           case "knight": isValidMoveFor_Knight(); break;
           case "bishop": isValidMoveFor_Bishop(); break;
           case "rook"  : isValidMoveFor_Rook(); break;
           case "queen" : isValidMoveFor_Queen() ; break;
           case "king"  : isValidMoveFor_King()  ; break;
       }

       console.log(fromPiece.name + " move from ["+r1+","+c1+"] to ["+r2+","+c2+"] is valid: " + validMove);
       return validMove;

       //----------------------------------------------------------------------------------
       function isValidMoveFor_Pawn() {

           // If white pawn at fromSquare r,c
           // If piece at r-1,c then blocked
           // If piece at r-1,c-1 then attack possible (unless king)
           // If piece at r-1,c+1 then attack possible (unless king)
           // If r == 6 then we are at starting position and two-square jump possible
           // If r == 3 and board.lastMove was pawn to row=r,col=c-1 || row=r,col=c+1 then enpassant possible

           // If black pawn at fromSquare r,c
           // If piece at r+1,c then blocked
           // If piece at r+1,c-1 then attack possible (unless king)
           // If piece at r+1,c+1 then attack possible (unless king)
           // If r == 1 then we are at starting position and two-square jump possible
           // If r == 4 and board.lastMove was pawn to row=r,col=c-1 || row=r,col=c+1 then enpassant possible

           var dir = fromPiece.isWhite ? -1 : 1;
           var startingSquareRow = fromPiece.isWhite ? 6 : 1;

           // Check for block on square ahead
           if (r2 === r1+dir && c2 === c1) {
               validMove = board.getSquare(r2,c2).isEmpty();

           // Check for two-square jump
           } else if ( r2 === r1+(2*dir) && c2 === c1) {
               if (r1 === startingSquareRow) { // then its on its original square
                   validMove = board.getSquare(r1+dir,c1).isEmpty() && board.getSquare(r1+2*dir,c1).isEmpty();            
               }

           // Check for one square diagonal move
           } else if ( (r2 === r1+dir && c2 === c1-1) ||  (r2 === r1+dir && c2 === c1+1) ) {
               // This could either be taking a piece or enpassant
               info = checkSquare(fromPiece,r2,c2,board);
           
               // Check for pawn attack
               if (info.collidesWithTeamPiece) { validMove = false; }
               else if (info.pieceCollision) {
                   validMove = !info.pce.isKing();
               // Check for enpassant
               } else if (!info.pieceCollision) { // the square isempty
                   // Check for enpassant -- if fails then the attacking square is just empty and the move is invalid
                   validMove = false; // this is true for all cases except for enpassant valid

                   var enpassantRow = fromPiece.isWhite ? 3 : 4;
                   if (r1 === enpassantRow) {
                       // TODO - implement once you figure out how best to implement board.lastMove
                       // Note: fen solves this by always storing the square of a double pawn jump
                       // regardless if a enpassant is actually possible. They call it an "en passant target square"
                       // Its cleared every move
                       // 
                       // if board.lastMove was double pawn jump to [r1,c1+1] or [r1,c1-1]
                       //     then enpassant move is valid
                   }
                   
               }
           }       
       }
       //----------------------------------------------------------------------------------
       function isValidMoveFor_King() {

           // First lets check for castling O-O or O-O-O
           validMove = isCastlingLegal(fromPiece,fromSquare,toSquare,board);
           if (validMove) { return validMove; }

           // First lets check the square position
           if (r2 > r1+1 || r2 < r1-1 || c2 > c1+1 || c2 < c1-1 ) { validMove = false; return validMove; }

           // Next lets check for team piece collision
           info = checkSquare(fromPiece,r2,c2,board);
           if (info.collidesWithTeamPiece) { validMove = false; return validMove; }

           // Now check for moving into check
           atkGrid = fromPiece.isWhite ? board.getBlackAttackGrid() : board.getWhiteAttackGrid();
           if (atkGrid[r2][c2] >= 1) { 
               console.log("---------- isValidMoveFor_King Attack Grid: ----------");
               ChessUtils.displayAttackGrid(atkGrid);
               console.log("isValidMoveFor_King -- Moving into check detected on ["+r2+","+c2+"]");
               validMove = false; return validMove; 
           }

           // If we get this far then we have a valid move yay!
           validMove = true;
       }
       //----------------------------------------------------------------------------------
       function isValidMoveFor_Knight() {
           var knightMoves = [[-2,-1],[-2,1],[-1,2],[1,2],[2,1],[2,-1],[1,-2],[-1,-2]];
           for (var i = 0 ; i < knightMoves.length; i++) {
               r = fromSquare.row + knightMoves[i][0];
               c = fromSquare.col + knightMoves[i][1];
               if (toSquare.row === r && toSquare.col === c) {
                   checkSquareForValidity();
                   break;
               }
           }
       }
       //----------------------------------------------------------------------------------
       function isValidMoveFor_Queen() {
            isValidMoveFor_Rook(); 
            if (!validMove) { isValidMoveFor_Bishop(); }
       }
       //----------------------------------------------------------------------------------
       function isValidMoveFor_Bishop() { 

           // Quick way to determine if the two squares lie on the same diagonal
           if (Math.abs(r1-r2) !== Math.abs(c1-c2)) { 
               validMove = false;
           }

           // Now we are just checking for piece blockages
           else if (r1 > r2 && c1 < c2) {        // top right diagonal
               for (r=r1-1,c=c1+1; (!pieceBlock && r>=r2 && c<=c2) ; r--,c++) {
                   checkSquareForValidity();
               }
           } else if (r1 < r2 && c1 < c2) { // bot right diagonal
               for (r=r1+1,c=c1+1; (!pieceBlock && r<=r2 && c<=c2) ; r++,c++) {
                   checkSquareForValidity();
               }
           } else if (r1 > r2 && c1 > c2) { // top left diagonal
               for (r=r1-1,c=c1-1; (!pieceBlock && r>=r2 && c>=c2) ; r--,c--) {
                   checkSquareForValidity();               }
           } else { //r1 < r2 && c1 > c2    // bot left diaonal
               for (r=r1+1,c=c1-1; (!pieceBlock && r<=r2 && c>=c2) ; r++,c--) {
                   checkSquareForValidity();
               }
           }
       }
       //----------------------------------------------------------------------------------
       function isValidMoveFor_Rook() { 

           if (r1 == r2) {
               if (c2 < c1) { // check left
                   for (r=r1,c=c1-1;(!pieceBlock && c>=c2);c--) {
                       checkSquareForValidity();
                   }
               } else {       // check right
                   for (r=r1,c=c1+1;(!pieceBlock && c<=c2);c++) {
                       checkSquareForValidity();
                   }
               }
           } else if (c1 == c2) {
               if (r2 < r1) { // check up
                   for (r=r1-1,c=c1;(!pieceBlock && r>=r2);r--) {
                        checkSquareForValidity();
                   }
               } else {       // check down
                   for (r=r1+1,c=c1;(!pieceBlock && r<=r2);r++) {
                        checkSquareForValidity();
                   }
               }
           }

       }

       //----------------------------------------------------------------------------------
       function checkSquareForValidity() { // doesn't returning anything, run for side-effects
           info = checkSquare(fromPiece,r,c,board);
           if (info.collidesWithTeamPiece) { validMove = false; }
           else if (info.pieceCollision && info.pce.isKing()) { validMove = false; }
           else { validMove = true; }
           pieceBlock = info.pieceCollision;
           if (pieceBlock && (r !== r2 || c !== c2)) { validMove = false; }
       }
  };

  //----------------------------------------------------------------------------------
  this.getValidMovesFromSquare = function(fromPiece,square,board) {

      var r,c;
      var r1 = square.row;
      var c1 = square.col;
      var allMoves = [];
      var done = false;

      switch(this.name.toLowerCase()) {
          case "pawn"  : getValidMovesFromSquare_Pawn();   break;
          case "knight": getValidMovesFromSquare_Knight(); break;
          case "bishop": getValidMovesFromSquare_Bishop(); break;
          case "rook"  : getValidMovesFromSquare_Rook();   break;
          case "queen" : getValidMovesFromSquare_Queen() ; break;
          case "king"  : getValidMovesFromSquare_King();   break;
      }

      return allMoves;

      //----------------------------------------------------------------------------------
       function getValidMovesFromSquare_Pawn() {
           // Pawns are the exception: they don't attack like they move so the regular
           // checkSquareForValidity function won't work. Checking attack moves and
           // regular moves separately
           var dir = fromPiece.isWhite ? -1 : 1;
           var startingSquareRow = fromPiece.isWhite ? 6 : 1;
           r = square.row;
           c = square.col;
           var pawnMoves = [[r+dir,c],[r+2*dir,c],[r+dir,c-1],[r+dir,c+1]];
           for (var i = 0; i < pawnMoves.length; i++) {
               r = pawnMoves[i][0];
               c = pawnMoves[i][1];
               if (r < 0 || r > 7 || c < 0 || c > 7) { continue; } // off the board

               // Pawns require their own special logic since they don't attack the way they move
               if (i === 0) {
                   if (board.getSquare(r,c).isEmpty()) { // check one square move ahead
                       allMoves = allMoves.concat( board.rowColToAlgebraic(r,c) );
                   }
               } else if (i === 1) {
                   if (square.row === startingSquareRow) { // check two square move ahead
                       if (board.getSquare(square.row+dir,c).isEmpty() && 
                           board.getSquare(square.row+2*dir,c).isEmpty()) {
                           allMoves = allMoves.concat( board.rowColToAlgebraic(r,c) );
                       }
                   }
               } else { // this covers attacking pawn moves
                   var info = checkSquare(fromPiece,r,c,board);
                   if (info.pieceCollision && !info.collidesWithTeamPiece && !info.pce.isKing()) {
                       allMoves = allMoves.concat( board.rowColToAlgebraic(r,c) );
                   } else {
                       var enpassantRow = fromPiece.isWhite ? 3 : 4;
                       if (r === enpassantRow) {
                           // TODO - implement once you figure out how best to implement board.lastMove
                           // Note: fen solves this by always storing the square of a double pawn jump
                           // regardless if a enpassant is actually possible. They call it an "en passant target square"
                           // Its cleared every move
                           // 
                           // if board.lastMove was double pawn jump to [square.row,square.col+1] or [square.row,square.col-1]
                           //     then enpassant move is valid
                       }
                   }
               }
           }
       }

      //----------------------------------------------------------------------------------
       function getValidMovesFromSquare_King() {
           // Kings also use their own validity logic (located in isValidMoveFor_King)
           r = square.row; c = square.col;
           var kingMoves = [[r-1,c],[r-1,c+1],[r,c+1],[r+1,c+1],[r+1,c],[r+1,c-1],[r,c-1],[r-1,c-1]];
           for (var i = 0; i < kingMoves.length; i++) {
               r = kingMoves[i][0];
               c = kingMoves[i][1];
               if (r < 0 || r > 7 || c < 0 || c > 7) { continue; } // off the board
               if (fromPiece.isValidMove(fromPiece,square,board.getSquare(r,c),board)) {
                   allMoves = allMoves.concat( board.rowColToAlgebraic(r,c) );
               }
           }
       }
      //----------------------------------------------------------------------------------
       function getValidMovesFromSquare_Knight() {
           var knightMoves = [[-2,-1],[-2,1],[-1,2],[1,2],[2,1],[2,-1],[1,-2],[-1,-2]];
           for (var i = 0 ; i < knightMoves.length; i++) {
               r = square.row + knightMoves[i][0];
               c = square.col + knightMoves[i][1];
               if (r < 0 || r > 7 || c < 0 || c > 7) { continue; } // off the board
               checkSquareForValidity();
           }
       }
      //----------------------------------------------------------------------------------
       function getValidMovesFromSquare_Queen() {
           getValidMovesFromSquare_Bishop();
           getValidMovesFromSquare_Rook();
       }
      //----------------------------------------------------------------------------------
       function getValidMovesFromSquare_Bishop() {
           done = false;
           for (r=r1-1,c=c1+1; (!done && r>=0 && c<=7) ; r--,c++) { // top right diagonal
               checkSquareForValidity();
           }
           done = false;
           for (r=r1+1,c=c1+1; (!done && r<=7 && c<=7) ; r++,c++) { // bot right diagonal
               checkSquareForValidity();
           }
           done = false;
           for (r=r1-1,c=c1-1; (!done && r>=0 && c>=0) ; r--,c--) { // top left diagonal
               checkSquareForValidity();
           }
           done = false;
           for (r=r1+1,c=c1-1; (!done && r<=7 && c>=0) ; r++,c--) { // bot left diagonal
               checkSquareForValidity();
           }
       }

       //----------------------------------------------------------------------------------
       function getValidMovesFromSquare_Rook() {
           done = false;
           for (r=r1-1,c=c1; (!done && r>=0) ; r--) { // check up
               checkSquareForValidity();
           }
           done = false;
           for (r=r1+1,c=c1; (!done && r<=7) ; r++) { // check down
               checkSquareForValidity();
           }
           done = false;
           for (r=r1, c=c1-1; (!done && c>=0) ; c--) { // check left
               checkSquareForValidity();
           }
           done = false;
           for (r=r1, c=c1+1; (!done && c<=7) ; c++) { // check right
               checkSquareForValidity();
           }
       }

      //----------------------------------------------------------------------------------
       function checkSquareForValidity() {
           var info = checkSquare(fromPiece,r,c,board);
           if (!info.pieceCollision) { allMoves = allMoves.concat( board.rowColToAlgebraic(r,c) ); return; }
           done = true; // since info.pieceCollision == true
           if (info.collidesWithTeamPiece) { return; }
           if (info.pce.isKing()) { return; }
           allMoves = allMoves.concat( board.rowColToAlgebraic(r,c) );

           // if (!info.pieceCollision || (!info.collidesWithTeamPiece && !info.pce.isKing())) {
           //     // This square is GOOD
           //     allMoves = allMoves.concat( board.rowColToAlgebraic(r,c) );
           // }
           // done = info.pieceCollision;
       }

  };

  //----------------------------------------------------------------------------------
  this.getAttackGrid = function(fromPiece,square,board,teamAttackGrid) {
       var r,c;
       var r1 = square.row;
       var c1 = square.col;
       var done = false;
       if ((typeof teamAttackGrid === 'undefined') || teamAttackGrid === null || teamAttackGrid.length === 0) {
           var teamAttackGrid = ChessUtils.createEmptyAttackGrid();
       }

       switch(this.name.toLowerCase()) {
          case "pawn"  : getAttackGrid_Pawn(); break;
          case "knight": getAttackGrid_Knight(); break;
          case "bishop": getAttackGrid_Bishop(); break;
          case "rook"  : getAttackGrid_Rook(); break;
          case "queen" : getAttackGrid_Queen(); break;
          case "king"  : getAttackGrid_King(); break;
       }

       return teamAttackGrid;

       //----------------------------------------------------------------------------------
       function getAttackGrid_King() {
           r = square.row; c = square.col;
           var kingMoves = [[r-1,c],[r-1,c+1],[r,c+1],[r+1,c+1],[r+1,c],[r+1,c-1],[r,c-1],[r-1,c-1]];
           for (var i = 0; i < kingMoves.length; i++) {
               r = kingMoves[i][0];
               c = kingMoves[i][1];
               if (r < 0 || r > 7 || c < 0 || c > 7) { continue; } // off the board
               updateAttackMatrix();
           }
       }
       //----------------------------------------------------------------------------------
       function getAttackGrid_Pawn() {
           var dir = fromPiece.isWhite ? -1 : 1;
           r = square.row;
           c = square.col;
           var pawnAttackMoves = [[r+dir,c-1],[r+dir,c+1]];
           for (var i = 0; i < pawnAttackMoves.length; i++) {
               r = pawnAttackMoves[i][0];
               c = pawnAttackMoves[i][1];
               if (r < 0 || r > 7 || c < 0 || c > 7) { continue; } // off the board
               updateAttackMatrix();
           }
       }
       //----------------------------------------------------------------------------------
       function getAttackGrid_Knight() {
           var knightMoves = [[-2,-1],[-2,1],[-1,2],[1,2],[2,1],[2,-1],[1,-2],[-1,-2]];
           for (var i = 0 ; i < knightMoves.length; i++) {
               r = square.row + knightMoves[i][0];
               c = square.col + knightMoves[i][1];
               if (r < 0 || r > 7 || c < 0 || c > 7) { continue; } // off the board
               updateAttackMatrix();
           }
       }
       //----------------------------------------------------------------------------------
       function getAttackGrid_Queen() {
           getAttackGrid_Bishop();
           getAttackGrid_Rook();
       }
       //----------------------------------------------------------------------------------
       function getAttackGrid_Bishop() {
           done = false;
           for (r=r1-1,c=c1+1; (!done && r>=0 && c<=7) ; r--,c++) { // top right diagonal
               updateAttackMatrix();
           }
           done = false;
           for (r=r1+1,c=c1+1; (!done && r<=7 && c<=7) ; r++,c++) { // bot right diagonal
               updateAttackMatrix();
           }
           done = false;
           for (r=r1-1,c=c1-1; (!done && r>=0 && c>=0) ; r--,c--) { // top left diagonal
               updateAttackMatrix();
           }
           done = false;
           for (r=r1+1,c=c1-1; (!done && r<=7 && c>=0) ; r++,c--) { // bot left diagonal
               updateAttackMatrix();
           }
       }
       //----------------------------------------------------------------------------------
       function getAttackGrid_Rook() {
           done = false;
           for (r=r1-1,c=c1; (!done && r>=0) ; r--) { // check up
               updateAttackMatrix();
               // console.log("rook up done = " + done);
           }
           done = false;
           for (r=r1+1,c=c1; (!done && r<=7) ; r++) { // check down
               updateAttackMatrix();
               // console.log("rook down done = " + done);
           }
           done = false;
           for (r=r1, c=c1-1; (!done && c>=0) ; c--) { // check left
               updateAttackMatrix();
               // console.log("rook left done = " + done);
           }
           done = false;
           for (r=r1, c=c1+1; (!done && c<=7) ; c++) { // check right
               updateAttackMatrix();
               // console.log("rook right done = " + done);
           }
       }
       //----------------------------------------------------------------------------------
       function updateAttackMatrix() {
           var pce = board.getSquare(r,c).piece;
           if ( pce === null ) {
               teamAttackGrid[r][c] = 1;           // 1 means its attacking empty square
           } else if (pce.isWhite !== fromPiece.isWhite) {
               teamAttackGrid[r][c] = 2;           // 2 means its attacking enemy piece
               if (pce.isKing()) {
                   teamAttackGrid[r][c] = 3;       // 3 means its attacking enemy king
               }
               done = true;
           } else if (pce.isWhite === fromPiece.isWhite) { 
               teamAttackGrid[r][c] = 4;           // 4 means it defending team piece
               done = true;
           } 
       }
  }

   this.getAlgebraicDescriptor = function() {
       if (this.algDescriptor !== null) { return this.algDescriptor; }
       switch(this.name.toLowerCase()) {
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

       this.algDescriptor = c;
       return c;
   };
   this.getFenDescriptor = function() {
      if (this.fenDescriptor !== null) { return this.fenDescriptor; }
      var c;
      switch(this.name.toLowerCase()) {
        case "pawn":
           c = "p"; break;
        case "knight":
           c = "n"; break;
        case "bishop":
           c = "b"; break;
        case "rook":
           c = "r"; break;
        case "queen":
           c = "q"; break;
        case "king":
           c = "k"; break;
      }
      if (this.color === "White") {
         c = c.toUpperCase();
      }
      this.fenDescriptor = c;
      return c;
   }
}