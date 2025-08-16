function MovePieceGame(parent) {

    var board = parent.getBoard();
    var theCanvas = parent.getCanvas();
    var cxt = parent.getContext();

    var selectedSquare;
    var selectedPiece = null;
    var expectedMove = "";
    var mouseCoords = {
    	x: -1,
    	y: -1
    };
    var mouseOffCanvas = false;

    var pm = pieceManager(board); // don't need 'new' keyword here. Look up "Module" section in Javascript: The Good Parts"

    this.init = OnInit;
    this.cleanUp = OnCleanUp;
    this.getNextProblem = OnGetNextProblem;
    this.endGame = OnEndGame;

    function OnInit() {
        board.reset();
        pm.reset();
        selectedPiece = null;
        theCanvas.addEventListener('mouseover',OnMouseIn,false);
        theCanvas.addEventListener('mouseout',OnMouseOut,false);
    }
    function OnCleanUp() {
    	removeMouseListeners();
        board.reset();
        pm.reset();
        selectedPiece = null;
    }
    function OnEndGame() {
        selectedPiece = null;
    }
    function removeMouseListeners() {
       theCanvas.removeEventListener('click',parent.OnInitScreenMouseClick,false); 
       theCanvas.removeEventListener('click',this.OnMouseClick,false);
       theCanvas.removeEventListener('mousedown',this.OnMouseDown,false);
       theCanvas.removeEventListener('mouseup',this.OnMouseUp,false);
       theCanvas.removeEventListener('mouseover',OnMouseIn,false);
       theCanvas.removeEventListener('mouseout',OnMouseOut,false);
       theCanvas.removeEventListener('click',parent.OnCompleteScreenMouseClick,false); 
    }

    function placeRandomPieceOnBoard(n) {
    	var whiteSelected, team, pieceIdx, randomPiece, square, squares = [];

    	for (var i = 0; i < n; i++) {

            // First we get the next random piece to be placed
            randomPiece = pm.getRandomPiece(); // this is unique

            // Second we get the next random square
    	    randomSquareCoords = parent.genRandomAlgebraicSquare();
    	    square = board.algebraicToSquare(randomSquareCoords);
    	    while (square.piece !== null || !pm.validSquareFor(square,randomPiece)) {
    	    	randomSquareCoords = parent.genRandomAlgebraicSquare();
    	        square = board.algebraicToSquare(randomSquareCoords);
    	    }
            
    	    square.addPiece(randomPiece);
    	    squares = squares.concat(square);
        }
    	return squares;
    }

    function OnGetNextProblem() {
        board.reset();
        pm.reset();
    	var squares = placeRandomPieceOnBoard(1);
    	var square = squares[0];
    	var piece = square.piece;
    	var validMoves = board.getValidMovesFromSquare(square);
    	if (validMoves !== null) {
            parent.expectedSquare = validMoves[Math.floor(Math.random()*validMoves.length)];
    		expectedMove = piece.getAlgebraicDescriptor() + parent.expectedSquare;
    	} else {
            parent.expectedSquare = "a1";
            expectedMove = piece.getAlgebraicDescriptor() + parent.expectedSquare;
    	}
    }

    // ------------------------------------------------------------------------------------
	this.OnInitScreenMouseClick = null; // going to use the default one in squareGame.js

	this.OnCompleteScreenMouseClick = null; // going to use the default one in squareGame.js

	this.OnMouseClick = function(e) {

        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        // Get the square the user clicked on
        selectedSquare = board.screenToSquare(mouseCoords.x,mouseCoords.y);
        if (selectedSquare === null) {
            return; // user clicked off the board somewhere
        } 
        if (selectedPiece === null) {
            selectedPiece = selectedSquare.piece;
            selectedSquare.piece = null;
            theCanvas.addEventListener('mousemove',OnMouseMove,false); 
            parent.draw();
        } else {
            selectedSquare.piece = selectedPiece;
            selectedPiece = null;
            theCanvas.removeEventListener('mousemove',OnMouseMove,false);
            var correctGuess = (selectedSquare.toAlgebraic() === parent.expectedSquare);
            parent.drawAfterGuessAnimation(correctGuess,selectedSquare,parent.expectedSquare);
        }

      // Did the user click on the right square?
      //console.log("Clicked Square: " + selectedSquare.toAlgebraic());
      
	}

	this.OnMouseDown = function(e) {
        //console.log("Inside MovePieceGame::OnMouseDown -- This is a test!!");
	}
	function OnMouseMove(e) {
        mouseCoords.x = (e.clientX-theCanvas.offsetLeft) + self.pageXOffset;
        mouseCoords.y = (e.clientY-theCanvas.offsetTop) + self.pageYOffset;
        parent.draw();
    }
	this.OnMouseUp = function(e) {
        //console.log("Inside MovePieceGame::OnMouseUp -- This is a test!!");
	}
    function OnMouseIn(e) {
     mouseOffCanvas = false;
   }
   function OnMouseOut(e) {
     mouseOffCanvas = true;
     parent.draw();
   }
	

	this.getInitMsg = function() {
       return ["Move the pieces","as fast as you can!"];
	};
	// this.getCompleteMsg = function(completed) {
 //       return (completed?["Yay!"]:["Boo!"]);
	// };
	this.drawGameInProgress = function() {
       // Draw Move On Top Of Board
       var ss = board.squareSize;
       cxt.font = "normal bold 60px serif";
       cxt.fillStyle = "#000000";
       cxt.textAlign = "center";
       cxt.fillText(expectedMove,board.padding[3]+ss*4,75);

       // Draw the selected piece on center of mouse pointer
      if (selectedPiece != null && !mouseOffCanvas) {
         var ptrX = mouseCoords.x - Math.floor(ss/2);
         var ptrY = mouseCoords.y - Math.floor(ss/2);
         cxt.drawImage(board.getSpriteSheet(),
            selectedPiece.sprite.sourceX*ss,
            selectedPiece.sprite.sourceY*ss,
            ss,ss,
            ptrX,
            ptrY,
            ss,ss);
      }
	};
}