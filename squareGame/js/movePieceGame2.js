function movePieceGame2(master_board,gameConsole,OnStageChangeFcn) {
   
    var mode = "movingPiecesLevel1"; // either "movingPiecesLevel1" || "movingPiecesLevel2" || "movingPiecesLevel3" || 
    var problemId = -1;

    var theCanvas = document.getElementById("canvas1");
    var context = theCanvas.getContext("2d");
    var clock = null;
    var usingClock = false;
    var usingScore = false;
    var mouseOffCanvas = false;
    var mouseCoords = {x: 0, y: 0};
    var mouseDownSquare = null;
    var mouseUpSquare = null;

    var GAME_DURATION_IN_SEC = 60;
    var curPiece = null; // this stores the current piece the problem is on
    var selectedPiece = null; // this stores pieces the user has clicked on
    // var selectedSquare = null;
    var originalSquare = null; // this stores the square selectedPiece was on when it was originally picked up
    var expectedMove = "";
    var expectedSquare = null; // in algebraic coords
    var expectedPiece = null;
    var failedAttempts = 0;
    var failedScores = [];
    var scoreToAdvance = {
      movingPiecesLevel1 : 18,
      movingPiecesLevel2 : 18,
      movingPiecesLevel3 : 15,
    }
   
    var stageChangeFcn = OnStageChangeFcn; // call this func whenever stage changes so trackController can make gui updates if needed
    var gameOver = false;
    var gameInProgress = false;
    var gameStage;
    var GAME_INIT        = 1,
        GAME_IN_PROGRESS = 2,
        GAME_COMPLETE    = 3;
    var canvasutils = new CanvasUtils(); // TODO: remove instance call here. Should be a class static method call.

    // Initialize the board
    var board = master_board;
    if (!master_board) {
        board = new Board(theCanvas,ss,padding,OnResourcesLoaded);
    } else {
        board = master_board;
        board.setPadding([100,50,50,50]);
    }
    var pceManager = board.getPieceManager(); // don't need 'new' keyword here. Look up "Module" section in Javascript: The Good Parts"

    // Initializing some stuff
    var ss,CANVAS_HEIGHT,CANVAS_WIDTH;
    ss = board.squareSize;
    CANVAS_WIDTH  = board.padding[1] + ss*8 + board.padding[3];
    CANVAS_HEIGHT = board.padding[0] + ss*8 + board.padding[2];
    theCanvas.width  = CANVAS_WIDTH;
    theCanvas.height = CANVAS_HEIGHT;

    // Initializing gui components
    var widgetMaker = canvasWidgets();

    //-------------- Create the start button object --------------
    var btnTextProps = { 
         font : '30pt Times',
         padding : [0,0,0,5], // only padding[3] is used currently which is left padding - controls width of button
    };
    var btnRectProps = {
         innerFillStyle : '#67E03F', //"#1AD920",
         outerFillStyle : "#000000",
    };
    var startButton = widgetMaker.createButton(context,CANVAS_WIDTH/2,CANVAS_HEIGHT/2,"Click Start",btnTextProps,btnRectProps);

    //-------------- Create the score object --------------
          
    var scoreTextProps = {
         font : "normal bold 30px serif",
         fillStyle: "#444444",
         textAlign: "right",
         textBaseline: "middle",
    };
    var score = widgetMaker.createScore(context,ss*8+board.padding[3]/2,75,scoreTextProps);

    // -------------

    var stageVals = {
        GAME_INIT : GAME_INIT,
        GAME_IN_PROGRESS : GAME_IN_PROGRESS,
        GAME_COMPLETE : GAME_COMPLETE
    }
    return {
      init            : init,
      cleanUp         : cleanUp,
      drawScreen      : drawScreen,
      setMode         : setMode,
      setProblemId    : setProblemId,
      stageVals       : stageVals // this is not a function
    };

    //-----------------------------------------------------------------------------
    function init() {
        initGame();
    }
    //-----------------------------------------------------------------------------
    function cleanUp() {
        resetBoard();
        gameConsole.innerHTML = "";
        removeMouseListeners();
        if (clock !== null && clock.countdownInProgress()) {
           clock.stopClock();
           clock.resetClock();
        }
    }
    //-----------------------------------------------------------------------------
    function setMode(newMode) {
        mode = newMode;
        failedAttempts = 0;
        failedScores = [];
        score.reset();
        switch(mode) {
            case "movingPiecesLevel1":
               usingScore = true; usingClock = false;
               board.setBoardFlipped(false);          
               break;
            case "movingPiecesLevel2":
               usingScore = true; usingClock = false;
               board.setBoardFlipped(false);
               break;
            case "movingPiecesLevel3":
               usingScore = true; usingClock = true;
               board.setBoardFlipped(false);
               break;
        }
    }
    //-----------------------------------------------------------------------------
    function setProblemId(id) {
        problemId = ((typeof id === 'number') ? id : parseInt(id));
    }
    //-------------------------------------------------------------------------------------
    function drawScreen() {

      context.save();

      context.fillStyle = "#FFFFFF";
      context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

      board.drawSquares();
      board.drawBorder();
      board.drawArrows();
      board.drawBoardCoordinates();

      drawClock();
      score.draw();

      // // Stage 1: Start Game Button
      // // Stage 2: Active game play - nextProblem displayed top center of canvas
      // // Stage 3: Final Score and Try Again or Next Exercise Button is displayed
      if (gameStage === GAME_IN_PROGRESS) {
        // Draw Next Problem Coord In
        drawGame(mode);
      } else if (gameStage === GAME_INIT) {
        // Draw Instructions and Start Button on canvas
        drawInitScreen();
      } else if (gameStage === GAME_COMPLETE) {
        // Game Over Stage: Draw "Try Again or Next Exercise" Button
        drawCompleteScreen();
      }

      context.restore();
            
	}

	//-----------------------------------------------------------------------------
	// Helper Functions Only - (not a part of the "Game" API)
	//-----------------------------------------------------------------------------
  function drawGame(mode) {
      switch(mode) {

      }

      // Draw the selected piece on center of mouse pointer
      if (selectedPiece != null && !mouseOffCanvas) {
         var ptrX = mouseCoords.x - Math.floor(ss/2);
         var ptrY = mouseCoords.y - Math.floor(ss/2);
         context.drawImage(board.getSpriteSheet(),
            selectedPiece.sprite.sourceX*ss,
            selectedPiece.sprite.sourceY*ss,
            ss,ss,
            ptrX,
            ptrY,
            ss,ss);
      }

      drawTopBoardMessage(expectedMove);
  }
  //-------------------------------------------------------------------------------------
  function drawInitScreen() {

     var message = ["Exercise: " + problemId,"Move the piece","to the correct square"];

     // Draw the instructions
     drawMessage(message);
     
     // Draw start button
     startButton.draw(context);
  }
  //-------------------------------------------------------------------------------------
  function drawCompleteScreen() {

     var message = ["Final Score: " + score.getScore()];
     
     if (score.getScore() >= scoreToAdvance[mode]) {
         message[1] = "Congratulations!";
         message[2] = "You may advance to the";
         message[3] = "next exercise";
         startButton.setText("Next Exercise");
     } else {
         var exclam = "";
         if (score.getScore() <= scoreToAdvance[mode]*0.5) {
             exclam = "More practice needed!";
         } else if (score.getScore() <= scoreToAdvance[mode]*0.75) {
             exclam = "Not too bad!";
         } else {
             exclam = "Almost!";
         }
         message = message.concat([exclam, " You need to", "score " + scoreToAdvance[mode] + " to advance"]);
         startButton.setText("Try Again!");
     }

     // Draw the complete message
     drawMessage(message);
     
     // Draw start button
     startButton.draw(context);
     // drawButton("Try Again");

  }

  //-------------------------------------------------------------------------------------
   function setGameStage( stageVal ) {

       gameStage = stageVal;
       switch(stageVal) {
           case GAME_INIT:
               gameOver = false;
               gameInProgress = false;        
               break;
           case GAME_IN_PROGRESS:
               gameOver = false;
               gameInProgress = true;
               break;
           case GAME_COMPLETE:
               gameOver = true;
               gameInProgress = false;
               if (score.getScore() < scoreToAdvance[mode]) { failedAttempts++; failedScores.push(score.getScore()) }
               break;
       }

       setInputListenersForStage( stageVal );

       var info = {};
       info.problemId = problemId;
       info.stageVal = stageVal;
       info.score = score.getScore();
       info.advance = score.getScore() >= scoreToAdvance[mode];
       info.failedAttempts = failedAttempts;
       info.failedScores = failedScores;
       stageChangeFcn(info);
   };

   //-------------------------------------------------------------------------------------
   function setInputListenersForStage( stageVal ) {
       removeMouseListeners();
       removeKeyListeners();
       switch(stageVal) {
           case GAME_INIT:
               theCanvas.addEventListener('mouseover',OnMouseIn,false);
               theCanvas.addEventListener('mouseout',OnMouseOut,false);
               theCanvas.addEventListener(   'click',OnInitStageMouseClick,false);      
               break;
           case GAME_IN_PROGRESS:
               theCanvas.addEventListener('mousemove',OnMouseMove,false);
               theCanvas.addEventListener('mouseout',OnMouseOut,false);
               theCanvas.addEventListener('mouseover',OnMouseIn,false);
               theCanvas.addEventListener('mousedown',OnMouseDown,false);
               theCanvas.addEventListener('mouseup',OnMouseUp,false);
               theCanvas.addEventListener(   'click',OnGameMouseClick,false);
               break;
           case GAME_COMPLETE:
               theCanvas.addEventListener('mouseover',OnMouseIn,false);
               theCanvas.addEventListener('mouseout',OnMouseOut,false);
               theCanvas.addEventListener(   'click',OnCompleteStageMouseClick,false);
               break;
       }
   }

    //-----------------------------------------------------------------------------
    // Game Control Functions - (not a part of the "Game" API)
    //-----------------------------------------------------------------------------

    //-------------------------------------------------------------------------------------
    function initGame() {

        score.reset();
        selectedPiece = null;
        
        if (usingClock) {
            clock = new CountdownClock( GAME_DURATION_IN_SEC, onClockStart, onClockStop, onClockTick );
        }

        setGameStage(GAME_INIT);

        drawScreen();
    }
    //-------------------------------------------------------------------------------------
    function resetGame() {

       score.reset();
       if (clock !== null) {
           if (clock.countdownInProgress()) {
               clock.stopClock();
           }
           clock.resetClock();
       }

       setGameStage(GAME_INIT);
       
       drawScreen();
    }

    //-------------------------------------------------------------------------------------
    function startGame() {

        score.reset();
        setGameStage(GAME_IN_PROGRESS);

        getNextProblem();

        // Start the clock
        if (clock !== null) {
            clock.startClock();
        }

    }
    //-------------------------------------------------------------------------------------
    function endGame() {
        setGameStage(GAME_COMPLETE);
        resetBoard();
        drawScreen();
    }
    //-------------------------------------------------------------------------------------
    function resetBoard() {
        board.clearBoard();
        selectedPiece = null;
    }
    //-------------------------------------------------------------------------------------
    // Generate
    function getNextProblem() {

       if (!usingClock && score.getScore() >= scoreToAdvance[mode]) {
           endGame(); return;
       }
       // ---------------------------
       // movingPiecesLevel1: Put a curPiece on a random square
       // 
       resetBoard();

       // Create piece user will be moving -- this is the start of the show
       if (mode === "movingPiecesLevel3") {
           var pieceList = ['R','B','Q','N','K',""];
           curPiece = pieceList[Math.floor(Math.random()*pieceList.length)];
       } else {
           if (score.getScore() < 3) {
               curPiece = "R";
           } else if (score.getScore() < 6) {
               curPiece = "B";
           } else if (score.getScore() < 9) {
               curPiece = "Q";
           } else if (score.getScore() < 12) {
               curPiece = "N";
           } else if (score.getScore() < 15) {
               curPiece = "K";
           } else if (score.getScore() < 18) {
               curPiece = "";
           }
       }
       // curPiece = "N";
       

       // When randomly placing pieces
       //    1. Pick the piece
       //    2. Randomly generate square
       //    3. Build attack grids after piece has been moved to that square
       //    4. If teams king is in check then disallow the move ( goto 2 )
       //    5. Otherwise add the piece to the board
       //   

       var skipRanks = [], skipFiles = [],
           randomSquareCoord, pieceType, newPiece, newSquare;

       var history = {
           pces : [],
           skipSquares : []
       }
           
       // ------------------ Place Piece User Wil Be Moving ------------------
       // 1. Pick the piece
       pieceType = ChessUtils.alg2PieceType(curPiece);
       newPiece = pceManager.getUnusedPiece("White",pieceType);

       // 2. Randomly generate square       
       if (newPiece.isPawn()) {
           skipRanks = [1,8]; // skip first and 8th ranks
       }
       randomSquareCoord = ChessUtils.genRandomAlgebraicSquare(skipRanks,skipFiles,history.skipSquares);
       newSquare = board.algebraicToSquare(randomSquareCoord);

       // No need to do a king check check since this is first piece placed
       // Add the newly created piece to the randomly generated square
       board.addPieceToSquare(newPiece,newSquare);
       board.updateAttackGrids();

       history.skipSquares.push(randomSquareCoord);
       history.pces.push(newPiece.getAlgebraicDescriptor()+newSquare.toAlgebraic());
       
       // ------------------ Randomly Place Enemy Pieces ------------------
       // Generate random enemy pieces on the board
       var nPieces, pieceColor;

       if (mode === "movingPiecesLevel1") {
           nPieces = 0;
       } else if (mode === "movingPiecesLevel2") {
           nPieces = 0;
       } else if (mode === "movingPiecesLevel3") {
           nPieces = Math.floor(score.getScore()/3)+2;
           if (nPieces < 0) { nPieces = 0; }
       }
       pieceColor = newPiece.isWhite ? "Black" : "White";
       history = randomlyAddPieces(nPieces,pieceColor,board,pceManager,history);

       // ------------------ Randomly Place Team Pieces ------------------
       // Generate random team pieces on the board
       if (mode === "movingPiecesLevel1") {
           nPieces = 0;
       } else if (mode === "movingPiecesLevel2") {
           nPieces = 5;
       } else if (mode === "movingPiecesLevel3") {
           nPieces = Math.floor(score.getScore()/3)+2;
           if (nPieces < 0) { nPieces = 0; }
       }
       
       pieceColor = newPiece.isWhite ? "White" : "Black";
       history = randomlyAddPieces(nPieces,pieceColor,board,pceManager,history);
       
       // Pieces have been placed. Lets update the boards attack grids
       // board.updateAttackGrids();
       var watk = board.getWhiteAttackGrid();
       var batk = board.getBlackAttackGrid();

       // console.log("---------- White Attack Grid: ----------");
       var watkStr = ChessUtils.attackGridToString(watk);
       // console.log("---------- Black Attack Grid: ----------");
       var batkStr = ChessUtils.attackGridToString(batk);
       // var dump = document.getElementById("gameConsole");
       gameConsole.innerHTML = 
                        "---------- White Attack Grid: ----------<br />" + HtmlUtils.str2html(watkStr) + 
                        "---------- Black Attack Grid: ----------<br />" + HtmlUtils.str2html(batkStr) +
                        "---------- Piece Placement History  : ----------<br />" + ArrayUtils.arr2str(history.pces) + "<br />" +
                        "---------- Skip Squares     : ----------<br />" + ArrayUtils.arr2str(history.skipSquares) + "<br />" +
                        "---------- White Pieces Used : ---------<br />" + ArrayUtils.arr2str(pceManager.getWhitePiecesUsed()) + "<br />" +
                        "---------- Black Pieces Used : ---------<br />" + ArrayUtils.arr2str(pceManager.getBlackPiecesUsed()) + "<br />";


       // ------------------ Find Move For User To Make ------------------
       // Now we need to find a random square on the field of movement for this piece
       var validMoves = newPiece.getValidMovesFromSquare(newPiece,newSquare,board);
       console.log("Valid Moves: " + ArrayUtils.arr2str(validMoves));
       if (validMoves.length === 0) {
           getNextProblem();
           return;
       }

       // Randomly pick out one of them
       expectedPiece = newPiece;
       expectedSquare = validMoves[Math.floor(Math.random()*validMoves.length)]; // Generate random index between 0 - validMoves.length
       var sq = board.algebraicToSquare(expectedSquare);
       console.log(sq.toAlgebraic());
       console.log(sq.toAlgebraic().charAt(0));

       // Check for matching piece that might possibly be attacking the same square.
       // var matchingPieceMoveCollision = false;
       // var specialMatchingChar = "";
       // if (newPiece.isRook() || newPiece.isKnight()) {
           
       //     var matchingPieceInfo = board.findMatchingPieceFor(newPiece);
           

       //     if (matchingPieceInfo !== null) {
       //         console.log("Matching piece found for '"+newPiece.name+"' on square: [" + matchingPieceInfo.square.row + "," + matchingPieceInfo.square.col + "]");
       //         var validMoves2 = newPiece.getValidMovesFromSquare(matchingPieceInfo.piece,matchingPieceInfo.square,board);
       //         console.log("Valid Moves (Matching Piece): " + ArrayUtils.arr2str(validMoves2));
       //         // Check for matching piece collision
       //         for (var i=0; i < validMoves2.length ; i++) {
       //             if (validMoves2[i] === expectedSquare) {
       //                 console.log("MOVE COLLISION DETECTED!!!");
       //                 matchingPieceMoveCollision = true;
       //                 if (matchingPieceInfo.square.col !== newSquare.col) {
       //                     specialMatchingChar = newSquare.toAlgebraic().charAt(0); // if not same file use the file letter
       //                 } else { 
       //                     specialMatchingChar = newSquare.toAlgebraic().charAt(1); // else use the rank number
       //                 }
       //             }
       //         }
       //     } else {
       //         console.log("No matching piece found");
       //     }

       // }

       var sqDesc = "";
       if (!(newPiece.isPawn() || newPiece.isKing())) {
           sqDesc = board.getSquareDescriptorForMove(newPiece,newSquare,sq);
           console.log("sqDesc: " + sqDesc);
       }

       if (sq.isEmpty()) {
           expectedMove = curPiece + sqDesc + expectedSquare;
       } else {
           expectedMove = (newPiece.isPawn() ? randomSquareCoord.charAt(0) : curPiece) + sqDesc + "x" + expectedSquare;
       }

       console.log("Expected Move: " + expectedMove);

       drawScreen();

    }

    function randomlyAddPieces(nPieces,pieceColor,board,pceManager,history) {

        // When randomly placing pieces
        //    1. Pick the piece
        //    2. Randomly generate square
        //    3. Build attack grids after piece has been moved to that square
        //    4. If teams king is in check then disallow the move ( goto 2 )
        //    5. Otherwise add the piece to the board
        //   

        var confineToColorShade, atkGrid, pickedAlgSquare, pickedSquare
            skipRanks = [], skipFiles = [], skipSquares = [], 
            pces = new Array(nPieces);

        for (var i = 0; i < nPieces ; i++) {
           confineToColorShade = null, atkGrid = null;
           
           // 1. Pick the piece
           pces[i] = pceManager.getRandomPiece(pieceColor);

           // 2. Randomly generate square
           if (pces[i].isPawn()) {
               skipRanks = [1,8]; // skip first and 8th ranks
           } else if (pces[i].isBishop()) {
               var pceInfo = board.findPieceOnBoard(pieceColor,"Bishop");
               if (pceInfo !== null) {
                   var darkSquareColor = board.getDarkColor();
                   var lightSquareColor = board.getLightColor();
                   confineToColorShade = (pceInfo.square.color === darkSquareColor ? "light" : "dark");
                   console.log("confineToColorShade: " + confineToColorShade);
               }
           } else if (pces[i].isKing()) {
               atkGrid = pces[i].isWhite ? board.getBlackAttackGrid() : board.getWhiteAttackGrid();
           }

               // pickedAlgSquare = ChessUtils.genRandomAlgebraicSquare(skipRanks,skipFiles,history.skipSquares,confineToColorShade,atkGrid);
               // pickedSquare = board.algebraicToSquare(pickedAlgSquare);

           var kingCheckExists = true;
           while(kingCheckExists) {

               pickedAlgSquare = ChessUtils.genRandomAlgebraicSquare(skipRanks,skipFiles,history.skipSquares,confineToColorShade,atkGrid);
               pickedSquare = board.algebraicToSquare(pickedAlgSquare);

               // 3. TODO: Build attack grids after piece has been moved to that square
               // 4. TODO: If any king is in check then pick a different square (stay in while loop)
               // 5. Otherwise add the piece to the board
               console.log("Looking at for king check after move: " + pces[i].getAlgebraicDescriptor() + pickedAlgSquare);
               board.addPieceToSquare(pces[i],pickedSquare);
               board.updateAttackGrids();

               var team_atkGrid = pces[i].isWhite ? board.getWhiteAttackGrid() : board.getBlackAttackGrid();
               kingCheckExists = kingInCheck(team_atkGrid);
               if (kingCheckExists) {
                   console.log("Team King check detected!!: ");
                   board.removePiece(pickedSquare);
                   board.updateAttackGrids();
                   continue;
               }
               var enemy_atkGrid = pces[i].isWhite ? board.getBlackAttackGrid() : board.getWhiteAttackGrid();
               kingCheckExists = kingInCheck(enemy_atkGrid);
               if (kingCheckExists) {
                   console.log("Enemy King check detected!!: ");
                   board.removePiece(pickedSquare);
                   board.updateAttackGrids();
                   continue;
               }

               console.log("No king check found!");

           }

           
           // Note: In this situation the only time a king should be in check is if its the piece that
           // the user is moving and that piece is a king obviously.

           //5. Otherwise add the piece to the board
           // board.addPieceToSquare(pces[i],pickedSquare);
           // board.updateAttackGrids();

           history.skipSquares.push(pickedAlgSquare);
           history.pces.push(pces[i].getAlgebraicDescriptor()+pickedSquare.toAlgebraic());
       }

       return history;
    }

    function kingInCheck(atkGrid) {
        for (var r = 0 ; r < 8 ; r++) {
            for (var c = 0; c < 8; c++) {
                if (atkGrid[r][c] === 3) {
                    return true;
                }
            }
        }
        return false;
    }

    function setPieceSelection(pce) {
        selectedPiece = pce; // for this yes its that simple
        if (selectedPiece === null) {
            originalSquare = null;
        }
    }

    //-----------------------------------------------------------------------------
    // Mouse Callbacks - (not a part of the "Game" API)
    //-----------------------------------------------------------------------------

    //-------------------------------------------------------------------------------------
    function OnInitStageMouseClick(e) {
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        if (canvasutils.ptInRect(mouseCoords,startButton.getRect())) {
            startGame();
        }
    }

    //-------------------------------------------------------------------------------------
    function OnCompleteStageMouseClick(e) {
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        console.log("Button Text: " + startButton.getText());
        if (canvasutils.ptInRect(mouseCoords,startButton.getRect())) {
            if (startButton.getText() === "Try Again!") {
               resetGame();
               startGame();
            } else if (startButton.getText() === "Next Exercise") {
              console.log("Attempting to run auto click: " + "#Problem-"+(problemId+1));
              $("#Problem-"+(problemId+1)).click();
            }
        }
    }

    //-------------------------------------------------------------------------------------
    function OnGameMouseClick(e) {
    }

    function OnMouseIn(e) {
        mouseOffCanvas = false;
    }
    function OnMouseOut(e) {
        mouseOffCanvas = true;
        drawScreen();
    }
    function OnMouseMove(e) {
        if (selectedPiece === null) { return; }
        mouseCoords.x = (e.clientX-theCanvas.offsetLeft) + self.pageXOffset;
        mouseCoords.y = (e.clientY-theCanvas.offsetTop)  + self.pageYOffset;
        drawScreen();
    }
    function OnMouseDown(e) {
        console.log("Mouse Down!");
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        mouseDownSquare = board.screenToSquare(mouseCoords.x,mouseCoords.y);

        if (mouseDownSquare.piece !== null) {
            originalSquare = mouseDownSquare;
            setPieceSelection(board.removePiece(mouseDownSquare));
        }

        drawScreen();
    }
    function OnMouseUp(e) {
        console.log("Mouse Up!");
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        mouseUpSquare = board.screenToSquare(mouseCoords.x,mouseCoords.y);

        // If user releases piece on original square or drops it off the board then add it back to original square
        if ( mouseDownSquare === mouseUpSquare || mouseUpSquare === null) { // user clicked off the board somewhere
          if (selectedPiece !== null) {
              board.addPieceToSquare(selectedPiece,originalSquare);
          }
          setPieceSelection(null);
        } else if (selectedPiece !== null) {
          // Check if its a valid move before placing
          if (selectedPiece.isValidMove(selectedPiece,originalSquare,mouseUpSquare,board)) {
              // board.addPieceToSquare(selectedPiece,mouseUpSquare);

              // Now we need to check if solution is correct
              console.log("mouseUpSquare:  " + ArrayUtils.arr2str([mouseUpSquare.row,mouseUpSquare.col]));
              console.log("expectedSquare: " + expectedSquare);
              correctGuess = (selectedPiece.startingSquare[0] === expectedPiece.startingSquare[0] &&
                              selectedPiece.startingSquare[1] === expectedPiece.startingSquare[1] &&
                              mouseUpSquare.toAlgebraic() === expectedSquare);
              // correctGuess = (curPiece === selectedPiece.getAlgebraicDescriptor() && mouseUpSquare.toAlgebraic() === expectedSquare);

              drawProblemCheckSequence(correctGuess,mouseUpSquare,expectedSquare);
          } else {
              board.addPieceToSquare(selectedPiece,originalSquare);
          }
          setPieceSelection(null);  
        }

        drawScreen();

    }


    //-----------------------------------------------------------------------------
    // Countdown Clock Callbacks - (not a part of the "Game" API)
    //-----------------------------------------------------------------------------

    //-------------------------------------------------------------------------------------
    function onClockStart(remainTimeInMs, timeStr) {
       console.log("Clock Started");
       drawScreen();
    }

    //-------------------------------------------------------------------------------------
    function onClockStop(stoppedEarly) {
       console.log("Clock Stopped");
       if (stoppedEarly === null || !stoppedEarly) {
          endGame();
       }
    }
    //-------------------------------------------------------------------------------------
    function onClockTick(remainTimeInMs, timeStr) {
       drawScreen();
    }

    //-----------------------------------------------------------------------------
    // Helper Functions Only - (not a part of the "Game" API)
    //-----------------------------------------------------------------------------

    //-------------------------------------------------------------------------------------
    function removeMouseListeners() {
       theCanvas.removeEventListener('mousemove',OnMouseMove,false);
       theCanvas.removeEventListener('mouseout',OnMouseOut,false);
       theCanvas.removeEventListener('mouseover',OnMouseIn,false);
       theCanvas.removeEventListener('mousedown',OnMouseDown,false);
       theCanvas.removeEventListener('mouseup',OnMouseUp,false);
       theCanvas.removeEventListener('click',OnInitStageMouseClick,false); 
       theCanvas.removeEventListener('click',OnGameMouseClick,false);
       theCanvas.removeEventListener('click',OnCompleteStageMouseClick,false);  
    }
    function removeKeyListeners() {
    }

    //-------------------------------------------------------------------------------------
    // Fires in GAME_IN_PROGRESS mode
    // OnGameMouseClick
    // This function draws animation that occurs after user clicks on square
    //    If correct draws floating green +1 rising upward and decelerating
    //    If incorrect draws red highlight and arrow pointing to correct square
  function drawProblemCheckSequence(correctGuess,selSquare,expectedAlgSquare) {
     var i = 0;
     var msPerFrame = 16;
     var fps = 1000/msPerFrame;
     var frameCount = 0;
     var pixDisplacement = 2;
     var msAnimationDuration = 500;
     var yOffset = 0;
     var lastOffset = -1;
     var highlightColor;

     // Must disable clicks while animating your user can spam click and rack up points (thanks Henry)
     // Must disable mouse events otherwise they make the animation flicker when they trigger drawScreen()'s
     removeMouseListeners();

     if (correctGuess) {
         board.addPieceToSquare(selectedPiece,selSquare);
         highlightColor = "#00FF00";
         score.incrementBy(1);
         msAnimationDuration = 500;
      } else {
         highlightColor = "#FF0000";
         board.addPieceToSquare(selectedPiece,originalSquare);
         selSquare = expectedPiece.square;
         var arrowPath = "";
         if (selectedPiece.isKnight()) {
            // Make an arrow from originalSquare to the expectedAlgSquare in an L shape
            arrowPath = board.getKnightMovePath(selSquare,board.algebraicToSquare(expectedAlgSquare));
         } else {
            arrowPath = selSquare.toAlgebraic()+expectedAlgSquare;
         }
         board.addArrow(arrowPath);
         score.decrementBy(1);
         msAnimationDuration = (mode === "movingPiecesLevel3" ? 500 : 2000); // let them look at what they did wrong for a longer period of time
      }

      // Draw the highlight around the clicked square - with color indicating correct or incorrect
      selSquare.addHighlight(highlightColor);
      console.log("Selected Piece: " + selectedPiece);

     var timer = setInterval(function() {
        drawScreen();

        context.lineWidth = 1;
        board.fillOrStroke = "both";
        board.textSize = "25";
        board.textColor = (correctGuess?"#00FF00":"#FF0000");
        board.fontWeight = "bold";

        yOffset += -Math.round(Math.exp(-frameCount/50)*pixDisplacement); // decreasing function to make it look like its slowing down              
                                                                          // not quite right but close
        if (lastOffset < Math.abs(yOffset)) {
            board.drawMessage((correctGuess?"+1":"-1"), selSquare.getCenterCoords(), [0, yOffset]); // 3rd arg is offset x,y from center
        }
        if (gameOver || (frameCount * msPerFrame) >= msAnimationDuration) {
            clearInterval(timer);
            selSquare.removeHighlight();
            board.popArrow();
            getNextProblem();
            setInputListenersForStage( gameStage );
        }
        frameCount++;
        lastOffset = Math.abs(yOffset);
     }, msPerFrame);
  }
    //-------------------------------------------------------------------------------------
    function drawMessage(message) {

       var largeFont = '36pt san-serif';
       var smallFont = '24pt cursive';
       var afont = largeFont;

       context.save();

       var textProps = [];
       for (var i = 0 ; i < message.length ;i++) {
           if (i > 0) { afont = smallFont; }
           textProps[i] = { 
               fillStyle    : "#000000",
               textAlign    : 'center',
               textBaseline : 'top',
               font         : afont
           };
       }
       var rectProps = {
           innerFillStyle : "#FFFF66",
           outerFillStyle : "#000000",
           padding : [20,20,20,20]
       };
       canvasutils.drawTextPanel(context,board.getRectBounds(),message,textProps,rectProps);

       context.restore();
    }

    //-------------------------------------------------------------------------------------
    function drawClock(timeStr) {
        if (!usingClock || clock === null ) { return; }
        context.font = "normal bold 30px serif";
        context.fillStyle = "#444444";
        context.textAlign = "left";
        if (!timeStr) {
            timeStr = clock.convertSecToTimeString();
        }
        // timeEl.innerHTML = timeStr;
        if (board !== null) {
            context.fillText(timeStr,1.5*board.padding[3],75);
        }
    }

    //-------------------------------------------------------------------------------------
    function drawTopBoardMessage(msg) {
        var fontsize = 60;
        context.font = "normal bold "+fontsize+"px serif";
        context.fillStyle = "#000000";
        context.textAlign = "center";
        context.textBaseline = "bottom";
        var xCenterOfTopPadding = board.padding[3]+ss*4;
        var yCenterOfTopPadding = fontsize+(board.padding[0]-fontsize)/2;
        context.fillText(msg,xCenterOfTopPadding,yCenterOfTopPadding);
    }


}