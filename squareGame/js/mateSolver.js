function mateSolver(master_board,gameConsole,OnStageChangeFcn) {
   
    var mode = "mateSolver1";
    var problemId = -1;
    var totalProblems = -1;
    var solutionHidden = true;

    var theCanvas = document.getElementById("canvas1");
    var context = theCanvas.getContext("2d");
    var clock = null;
    var usingClock = false;
    var usingScore = false;
    var mouseOffCanvas = false;
    var mouseCoords = {x: 0, y: 0};
    var mouseDownSquare = null;
    var mouseUpSquare = null;

    var curPiece = null; // this stores the current piece the problem is on
    var selectedPiece = null; // this stores pieces the user has clicked on
    var originalSquare = null; // this stores the square selectedPiece was on when it was originally picked up
    var expectedMove = "";
    var expectedSquare = null; // in algebraic coords
    var expectedPiece = null;
    var score = 0;
    var failedAttempts = 0;
    var failedScores = [];
    var scoreToAdvance = {
      mateSolver1 : -1,
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
    board.setPadding([100,50,50,50]);

    // Initialize the pgnGame
    var pgnGame = PgnGame(board);
    pgnGame.setDisplayMode(0); // hide

    // Initialize the piece manager
    var pceManager = board.getPieceManager();

    // Initializing some stuff
    var ss,CANVAS_HEIGHT,CANVAS_WIDTH;
    ss = board.squareSize;
    CANVAS_WIDTH  = board.padding[1] + ss*8 + board.padding[3];
    CANVAS_HEIGHT = board.padding[0] + ss*8 + board.padding[2];
    theCanvas.width  = CANVAS_WIDTH;
    theCanvas.height = CANVAS_HEIGHT;

    // Initializing gui components
    var widgetMaker = canvasWidgets();

    // Draw the start button
    var btnX = CANVAS_WIDTH/2;
    var btnY = CANVAS_HEIGHT/2;
    var btnTextProps = { 
         font : '30pt Times',
         padding : [0,0,0,5], // only padding[3] is used currently which is left padding - controls width of button
    };
    var btnRectProps = {
         innerFillStyle : '#67E03F', //"#1AD920",
         outerFillStyle : "000000",
    };
    var startButton = widgetMaker.createButton(context,btnX,btnY,"Click Start",btnTextProps,btnRectProps);

    var stageVals = {
        GAME_INIT : GAME_INIT,
        GAME_IN_PROGRESS : GAME_IN_PROGRESS,
        GAME_COMPLETE : GAME_COMPLETE
    };

    var savedMoveState = {
        selectedPiece : null,
        originalSquare : null,
        mouseUpSquare : null,
        newSquareAlg : null,
        expectedMove : null,
        exclam : null
    };

    return {
      init            : init,
      cleanUp         : cleanUp,
      drawScreen      : drawScreen,
      setMode         : setMode,
      setProblemId    : setProblemId,
      setPosition     : setPosition,
      stageVals       : stageVals // this is not a function
    };

    //-----------------------------------------------------------------------------
    function init() {
        console.log("init(): Before initGame() call gameStage: " + gameStage);
        initGame();
        console.log("init(): After initGame() call gameStage: " + gameStage);
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
        score = 0;
        switch(mode) {
            case "mateSolver1":
               usingScore = true; usingClock = false;
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
      drawScore();

      // // Stage 1: Start Game Button
      // // Stage 2: Active game play - nextProblem displayed top center of canvas
      // // Stage 3: Final Score and Try Again or Next Exercise Button is displayed
      if (gameStage === GAME_IN_PROGRESS) {
        // Draw Next Problem Coord In
        drawGame(mode);
      } else if (gameStage === GAME_INIT && problemId === 1) {
        // Draw Instructions and Start Button on canvas
        drawInitScreen();
      } else if (gameStage === GAME_COMPLETE && problemId === totalProblems) {
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

      // context.font = "normal bold 60px serif";
      // context.fillStyle = "#000000";
      // context.textAlign = "center";
      // context.fillText(expectedMove,board.padding[3]+ss*4,75);
  }
  //-------------------------------------------------------------------------------------
  function drawInitScreen() {

     var message = ["Exercise: " + problemId,"Find the mate in 1"];

     // Draw the instructions
     drawMessage(message);
     
     // Draw start button
     startButton.draw(context);
  }
  //-------------------------------------------------------------------------------------
  function drawCompleteScreen() {
    
    var message = [];
        message[0] = "You did it! Well done.";
        message[1] = "You have completed this track!";
     // var message = ["Final Score: " + score];
     
     // if (score >= scoreToAdvance[mode]) {
     //     message[1] = "Congratulations!";
     //     message[2] = "You may advance to the";
     //     message[3] = "next exercise";
     //     startButton.setText("Next Exercise");
     // } else {
     //     var exclam = "";
     //     if (score <= scoreToAdvance[mode]*0.5) {
     //         exclam = "More practice needed!";
     //     } else if (score <= scoreToAdvance[mode]*0.75) {
     //         exclam = "Not too bad!";
     //     } else {
     //         exclam = "Almost!";
     //     }
     //     message = message.concat([exclam, " You need to", "score " + scoreToAdvance[mode] + " to advance"]);
     //     startButton.setText("Try Again!");
     // }

     // Draw the complete message
     drawMessage(message);
     
     // Draw start button
     // startButton.draw(context);

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
               if ( !pgnGame.endOfGame() ) { failedAttempts++; failedScores.push( pgnGame.getPlyCount() ) }
               break;
       }

       setInputListenersForStage( stageVal );

       var info = {};
       info.problemId = problemId;
       info.totalProblems = totalProblems;
       info.stageVal = stageVal;
       info.score = score;
       info.advance = score >= scoreToAdvance[mode];
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
    function parseProblem(fulltext) {

      // Problem Format:
      // trackId<delim>probId<delim>pgn<delim>instructions<delim>analysis

      var delim = "-----";
      var tok = fulltext.split(delim);

      var probVars = {
          fulltext     : fulltext,
          trackId      : tok[0],
          problemId    : tok[1],
          pgn          : tok[2],
          instructions : tok[3],
          analysis     : tok[4]
      };

      return probVars;
    }
    function setPosition(problemSet,id) {
        console.log("--- Start setPosition");
        totalProblems = problemSet.length;
        var fulltext = problemSet[id-1];
        var probVars = parseProblem(fulltext);
        loadPgn(probVars.pgn);
        setProblemId(id);
        drawScreen();
        console.log("--- Finished setPosition");
    }
    //-------------------------------------------------------------------------------------
    function initGame() {
        
        console.log("******initGame called");
        score = 0;
        selectedPiece = null;
        
        if (usingClock) {
            clock = new CountdownClock( GAME_DURATION_IN_SEC, onClockStart, onClockStop, onClockTick );
        }

        setGameStage(GAME_INIT); // skip GAME_INIT stage for mateSolver...gets right to the solving..no initial start button
        if (problemId > 1) {
           startGame();
        }

        drawScreen();
    }
    //-------------------------------------------------------------------------------------
    function resetGame() {

       console.log("******resetGame called");
       score = 0;
       if (clock !== null) {
           if (clock.countdownInProgress()) {
               clock.stopClock();
           }
           clock.resetClock();
       }

       setGameStage(GAME_INIT);
       if (problemId > 1) {
           startGame();
       }
       
       drawScreen();
    }

    //-------------------------------------------------------------------------------------
    function startGame() {
        
        console.log("******startGame called");
        score = 0;
        setGameStage(GAME_IN_PROGRESS);

        getNextProblem();

        // Start the clock
        if (clock !== null) {
            clock.startClock();
        }

    }
    //-------------------------------------------------------------------------------------
    function endGame() { // called once full pgn has been played through
        console.log("******endGame called");
        setGameStage(GAME_COMPLETE);
        resetBoard();
        drawScreen();
        $("#Problem-"+(problemId+1)).click();
    }
    //-------------------------------------------------------------------------------------
    function resetBoard() {
        board.clearBoard();
        selectedPiece = null;
    }

    function dumpDebugInfo() {
       if (!debugOn) { return; }
       console.log("debugOn: " + debugOn);
       var debugOutput = "plyCount: " + pgnGame.getPlyCount() + "\n" +
                         "totalPlyCount: " + pgnGame.getTotalPlyCount() + "\n" +
                         "expectedMove: " + pgnGame.getNextMove() + "\n";
       debugOutput = HtmlUtils.str2html(debugOutput);

       $('.moveViewerSpacer').html(debugOutput);
    }

    function parseMove(move) {
        return {
            pceType: null,
            algSquare: null,
        }
    }

    //-------------------------------------------------------------------------------------
    // Generate
    function getNextProblem() {

      console.log("******getNextProblem called");
       if (!usingClock && pgnGame.endOfGame()) {
           endGame(); return;
       }
       // ---------------------------
       // scriptedMovePlayLevel1: Play through a pgn game
       // 
       // Set expectedMove to next move in game

       expectedMove = pgnGame.getNextMove();
       dumpDebugInfo();

       console.log("Expected Move: " + expectedMove);

       drawScreen();
    }

    function loadPgn(pgnText) {
      var fenVals = pgnGame.loadPgn(pgnText);
      board.loadFen(fenVals.fen);
      drawScreen();
    }

    function setPieceSelection(pce) {
        selectedPiece = pce; // for this yes its that simple
        if (selectedPiece === null) {
            originalSquare = null;
        }
    }

    function addPieceToSquare(pce,square,board) {
        board.addPiece(pce,square);
    }
    function makeMove(pce,toSquare,actualMove,board) {
        board.makeMove(pce,toSquare,actualMove); // makes the move on the board only
        pgnGame.movePlayed(actualMove);
    }

    //-----------------------------------------------------------------------------
    // Mouse Callbacks - (not a part of the "Game" API)
    //-----------------------------------------------------------------------------

    //-------------------------------------------------------------------------------------
    function OnInitStageMouseClick(e) {
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        console.log("OnInitStageMouseClick Called");
        if (canvasutils.ptInRect(mouseCoords,startButton.getRect())) {
            startGame();
        }
    }

    //-------------------------------------------------------------------------------------
    function OnCompleteStageMouseClick(e) {
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        console.log("OnCompleteStageMouseClick Called");
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
      // console.log("mouse in");
        mouseOffCanvas = false;
    }
    function OnMouseOut(e) {
      // console.log("mouse out");
        mouseOffCanvas = true;
        drawScreen();
    }
    function OnMouseMove(e) {
        // console.log("mouse move");
        mouseCoords.x = (e.clientX-theCanvas.offsetLeft) + self.pageXOffset;
        mouseCoords.y = (e.clientY-theCanvas.offsetTop)  + self.pageYOffset;
        drawScreen();
    }
    function OnMouseDown(e) {
        console.log("----------------------------------------------");
        console.log("Mouse Down!");
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        mouseDownSquare = board.screenToSquare(mouseCoords.x,mouseCoords.y);

        if (mouseDownSquare.piece !== null && pgnGame.getColorToMove() === mouseDownSquare.piece.color) {
            originalSquare = mouseDownSquare;
            setPieceSelection(board.removePiece(mouseDownSquare));
        }

        drawScreen();
    }
    function OnMouseUp(e) {

        console.log("----------------------------------------------");
        console.log("Mouse Up!");

        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        // Convert the mouse coords to a board square object
        mouseUpSquare = board.screenToSquare(mouseCoords.x,mouseCoords.y);

        // If user releases piece on original square or drops it off the board then add it back to original square
        if ( mouseDownSquare === mouseUpSquare || mouseUpSquare === null) { // user clicked off the board somewhere
            if (selectedPiece !== null) {
                addPieceToSquare(selectedPiece,originalSquare,board);
            }
            setPieceSelection(null);
        } else if (selectedPiece !== null) {
          // Check if its a valid move before placing
          if (selectedPiece.isValidMove(selectedPiece,originalSquare,mouseUpSquare,board)) {
              
              // Check to see if the move they made was the expectedMove
              var pieceAlg = selectedPiece.getAlgebraicDescriptor();
              var newSquareAlg = mouseUpSquare.toAlgebraic();

              // Check for matching piece moves (for knights and rooks)
              var sqDesc = "";
              if (!(selectedPiece.isPawn() || selectedPiece.isKing())) {
                  sqDesc = board.getSquareDescriptorForMove(selectedPiece,originalSquare,mouseUpSquare);
              }

              // Look for any exclam characters [!!,??,!?,?!,+!!,+??,+!?,+?!,+#,++]
              var exclam = expectedMove.substr(expectedMove.length-3).match(/[\+]*(!!|\?\?|\?!|!\?|\+\+)/); // compare against last 3 characters
              if (exclam === null) { 
                  // Look for any exclam characters [+,!,?,#,+!,+?,+#]
                  exclam = expectedMove.substr(expectedMove.length-2).match(/[\+]*(\+|!|\?|#)/); // compare against last 2 characters
              }
              if (exclam === null) { exclam = ""; }

              // Handle Castling First
              var actualMove;
              if (selectedPiece.isKing() && isCastling(selectedPiece,originalSquare,mouseUpSquare,board) ) {
                  mouseUpSquare.col > originalSquare.col ? actualMove = 'O-O' : actualMove = 'O-O-O';
              }

              // Handle Pawn Promotion
              else if (selectedPiece.isPawn() && isPromotingPawn(selectedPiece,originalSquare,mouseUpSquare,board) ) {
                  console.log("Pawn Promotion Detected!");

                  // Hide the pawn that we are dragging (we don't want to deselect as that will mess up future code)
                  var tempPiece = selectedPiece;
                  selectedPiece = null;
                  drawScreen();
                  selectedPiece = tempPiece;

                  // Display the pawn promotion dialog
                  suspendInputListeners();
                  console.log("Display Pawn Promotion modal dialog here!");
                  board.showPawnPromotionDialog(mouseCoords, selectedPiece.color, pawnPromotionSelectionCallback);
                  
                  savedMoveState.selectedPiece = selectedPiece;
                  savedMoveState.originalSquare = originalSquare;
                  savedMoveState.mouseUpSquare = mouseUpSquare;
                  savedMoveState.newSquareAlg = newSquareAlg;
                  savedMoveState.expectedMove = expectedMove;
                  savedMoveState.exclam = exclam;

                  return;
              }

              // Are they taking a piece?
              else if (!mouseUpSquare.isEmpty()) {
                  actualMove = (selectedPiece.isPawn() ? originalSquare.getFileLetter() : pieceAlg) + sqDesc + "x" + newSquareAlg;
              }

              // Normal move
              else {
                  actualMove = pieceAlg + sqDesc + newSquareAlg;
              }

              // Add exclam if it exists
              if (exclam) { actualMove += exclam[0]; }

              console.log("expectedMove: " + expectedMove);
              console.log("actualMove  : " + actualMove);
              var correctGuess = (actualMove === expectedMove);
              if (exclam) { actualMove = actualMove.substr(0,actualMove.length-exclam[0].length); }
              console.log("After exclam strip -- actualMove  : " + actualMove);

              // Draw the correct animation based on correctness and move to the next problem (if correct)

              drawProblemCheckSequence(correctGuess,mouseUpSquare,actualMove,expectedMove);
          } else {
              addPieceToSquare(selectedPiece,originalSquare,board);
          }
          setPieceSelection(null);  
        }

        drawScreen();

    }

    function pawnPromotionSelectionCallback(selPieceString) {
        var selectedPieceChar = ChessUtils.pieceType2alg(selPieceString);
        console.log("Selected Piece was " + ChessUtils.alg2PieceType(selPieceString));
        restoreInputListeners();

        var selectedPiece  = savedMoveState.selectedPiece,
            originalSquare = savedMoveState.originalSquare,
            mouseUpSquare  = savedMoveState.mouseUpSquare,
            newSquareAlg   = savedMoveState.newSquareAlg,
            expectedMove   = savedMoveState.expectedMove,
            exclam         = savedMoveState.exclam;

        if (!mouseUpSquare.isEmpty()) {
            actualMove = (selectedPiece.isPawn() ? originalSquare.getFileLetter() : pieceAlg) + "x" + newSquareAlg + "=" + selectedPieceChar;
        } else {
            // actualMove = pieceAlg + file + newSquareAlg + "=" + promotionPiece;
            actualMove = newSquareAlg + "=" + selectedPieceChar;
        }

        // Add exclam if it exists
        if (exclam) { actualMove += exclam[0]; }

        console.log("expectedMove: " + expectedMove);
        console.log("actualMove  : " + actualMove);
        var correctGuess = (actualMove === expectedMove);
        if (exclam) { actualMove = actualMove.substr(0,actualMove.length-exclam[0].length); }
        console.log("After exclam strip -- actualMove  : " + actualMove);

        // Draw the correct animation based on correctness and move to the next problem (if correct)

        drawProblemCheckSequence(correctGuess,mouseUpSquare,actualMove,expectedMove);
        setPieceSelection(null);
        drawScreen();
    }

    function isCastling(king,fromSquare,toSquare,board) {
        // IMPORTANT!!! this function assumes the move has already been validated by Piece.isValidMove
        var r1,c2,r2,c2;
        r1 = fromSquare.row; c1 = fromSquare.col;
        r2 = toSquare.row;   c2 = toSquare.col;
        return (r1 === king.startingSquare[0] && r1 === r2 && (c2 === c1-2 || c2 === c1+2));
    }

    function isPromotingPawn(pawn,fromSquare,toSquare,board) {
        return (toSquare.row === 0 || toSquare.row === 7);
    }

    //-------------------------------------------------------------------------------------
    // Fires in GAME_IN_PROGRESS mode
    // OnMouseUp  - if valid move and selectedPiece
    // This function draws animation that occurs after user clicks on square
    //    If correct draws floating green +1 rising upward and decelerating
    //    If incorrect draws red highlight and arrow pointing to correct square
  function drawProblemCheckSequence(correctGuess,selSquare,actualMove,expectedMove) {
     var i = 0;
     var msPerFrame = 16;
     var fps = 1000/msPerFrame;
     var frameCount = 0;
     var pixDisplacement = 2;
     var msAnimationDuration = 500;
     var yOffset = 0;
     var highlightColor;

     // Must disable clicks while animating your user can spam click and rack up points (thanks Henry)
     // Must disable mouse events otherwise they make the animation flicker when they trigger drawScreen()'s
     suspendInputListeners();

     if (correctGuess) {
         highlightColor = "#00FF00";
         makeMove(selectedPiece,mouseUpSquare,actualMove,board);
         // score++;
      } else {
         highlightColor = "#FF0000";
         addPieceToSquare(selectedPiece,originalSquare,board);
         // board.addArrow(selSquare.toAlgebraic()+expectedAlgSquare);
         // score--;
      }

      // Draw the highlight around the clicked square - with color indicating correct or incorrect
      selSquare.addHighlight(highlightColor);

     var timer = setInterval(function() {
        drawScreen();

        context.lineWidth = 1;
        board.fillOrStroke = "both";
        board.textSize = "25";
        board.textColor = (correctGuess?"00FF00":"FF0000");
        board.fontWeight = "bold";

        //var yOffset = -frameCount*pixDisplacement;
        //console.log(-Math.round(Math.exp(-frameCount/50)*pixDisplacement));
        yOffset += -Math.round(Math.exp(-frameCount/50)*pixDisplacement); // decreasing function to make it look like its slowing down
                                                                          // not quite right but close
        board.drawMessage((correctGuess?"Correct!":"Whoops!"), selSquare.getCenterCoords(), [0, yOffset]); // 3rd arg is offset x,y from center
        if (gameOver || (frameCount * msPerFrame) >= msAnimationDuration) {
            clearInterval(timer);
            selSquare.removeHighlight();
            // board.popArrow();
            if (correctGuess) {
                getNextProblem();
            }
            restoreInputListeners();
        }
        frameCount++;
     }, msPerFrame);
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
   function suspendInputListeners() {
        removeMouseListeners();
        removeKeyListeners();
    }

    //-------------------------------------------------------------------------------------
    function restoreInputListeners() {
        setInputListenersForStage(gameStage);
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
           outerFillStyle : "000000",
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
    function drawScore() {
        if (!usingScore) { return; }
        context.font = "normal bold 30px serif";
        context.fillStyle = "#444444";
        context.textAlign = "right";
        // scoreEl.innerHTML = score;
        if (board !== null) {
            context.fillText("Score: " + score,ss*8+board.padding[3]/2,75);
        }

    }

}