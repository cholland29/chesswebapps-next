function scriptedMovePlay(master_board,gameConsole,OnStageChangeFcn) {
   
    var mode = "scriptedMovePlayLevel1";
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
      scriptedMovePlayLevel1 : -1,
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
         innerFillStyle : "#67E03F",//'#67E03F', //"#1AD920",
         outerFillStyle : "#000000",
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
        score = 0;
        switch(mode) {
            case "scriptedMovePlayLevel1":
               usingScore = false; usingClock = false;
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

      // context.font = "normal bold 60px serif";
      // context.fillStyle = "#000000";
      // context.textAlign = "center";
      // context.fillText(expectedMove,board.padding[3]+ss*4,75);
  }
  //-------------------------------------------------------------------------------------
  function drawInitScreen() {

     var message = ["Exercise: " + problemId,"Play through the game"];

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

    //-------------------------------------------------------------------------------------
    function initGame() {

        score = 0;
        selectedPiece = null;
        
        if (usingClock) {
            clock = new CountdownClock( GAME_DURATION_IN_SEC, onClockStart, onClockStop, onClockTick );
        }

        setGameStage(GAME_INIT);

        // var pgnText = 
        //     '[Event "F/S Return Match"]'+'\n'+
        //     '[Site "Belgrade, Serbia JUG"]'+'\n'+
        //     '[Date "1992.11.04"]'+'\n'+
        //     '[Round "29"]'+'\n'+
        //     '[White "Fischer, Robert J."]'+'\n'+
        //     '[Black "Spassky, Boris V."]'+'\n'+
        //     '[Result "1/2-1/2"]'+'\n'+

        //     '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 '+
        //     'O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. '+
        //     'Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. '+
        //     'Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 '+
        //     '27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. '+
        //     'f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 '+
        //     '40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1/2-1/2';

        // var pgnText = 
        //     '[Event "Berlin Jubilee"]'+'\n'+
        //     '[Site "Berlin"]'+'\n'+
        //     '[Date "1907.??.??"]'+'\n'+
        //     '[Round "9"]'+'\n'+
        //     '[White "Von Scheve, Theodor"]'+'\n'+
        //     '[Black "Teichmann, Richard"]'+'\n'+
        //     '[Result "0-1"]'+'\n'+
        //     '[ECO "C53"]'+'\n'+
        //     '[PlyCount "34"]'+'\n'+
        //     '[EventDate "1907.??.??"]'+'\n'+
        //     '[Source "ChessBase"]'+'\n'+
        //     '[SourceDate "1998.11.10"]'+'\n'+

        //     '1. e4! e5? 2. Nf3!! Nc6?? 3. Bc4?! Bc5!? 4. c3+ Qe7++ 5. O-O+! d6+? 6. d4+!! Bb6+?? 7. a4+?! a6+!? 8. a5+# Ba7 '+
        //     '9. h3 Nf6 10. dxe5 Nxe5 11. Nxe5 Qxe5 12. Nd2 Bxh3 13. gxh3 Qg3+ 14. Kh1 Qxh3+ '+
        //     '15. Kg1 Ng4 16. Nf3 Qg3+ 17. Kh1 Bxf2 0-1';

          // var pgnText = 
          // '[Event "?"]'+'\n'+
          // '[Site "?"]'+'\n'+
          // '[Date "2000.??.??"]'+'\n'+
          // '[Round "?"]'+'\n'+
          // '[White "?"]'+'\n'+
          // '[Black "?"]'+'\n'+
          // '[Result "*"]'+'\n'+

          // '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. Nc3 Bc5 6. Nxe5 Nxe5 7. d4 Bb4 '+'\n'+
          // '8. dxe5 Nxe4 9. Qd4 Nxc3 10. bxc3 Ba5? 11. Ba3 b6 12. e6 Qf6 13. Bxd7+ Kd8 '+'\n'+
          // '14. Bc6+! Qxd4 15. e7+ *';

          // var pgnText = 
          //   '[Event "1001 Brilliant Mates"]'+'\n'+
          //   '[Site "No forced mate in this position???"]'+'\n'+
          //   '[Date "????.??.??"]'+'\n'+
          //   '[Round "?"]'+'\n'+
          //   '[White "BWTC.0005"]'+'\n'+
          //   '[Result "*"]'+'\n'+
          //   '[SetUp "1"]'+'\n'+
          //   '[FEN "r2qk1r1/p4p2/bp2pQp1/1n1pP1Bp/7P/3P2N1/P1R2PP1/2R3K1 w q - 0 1"]'+'\n'+
          //   '[PlyCount "8"]'+'\n'+

          //   '1. Rc8 Rxc8 2. Rxc8 Kd7 3. Rxd8+ Rxd8 4. Qxd8+ Kc6 1-0'; 

// var pgnText = 
// '[Event "ICC 5 0"]'+'\n'+
// '[Site "Internet Chess Club"]'+'\n'+
// '[Date "2013.11.21"]'+'\n'+
// '[Round "-"]'+'\n'+
// '[White "jubba"]'+'\n'+
// '[Black "k-45"]'+'\n'+
// '[Result "1-0"]'+'\n'+
// '[ICCResult "Black resigns"]'+'\n'+
// '[WhiteElo "1262"]'+'\n'+
// '[BlackElo "1260"]'+'\n'+
// '[Opening "KGA: Muzio gambit"]'+'\n'+
// '[ECO "C37"]'+'\n'+
// '[NIC "KG.01"]'+'\n'+
// '[Time "14:31:31"]'+'\n'+
// '[TimeControl "300+0"]'+'\n'+

// '1. e4 e5 2. f4 exf4 3. Nf3 g5 4. Bc4 g4 5. O-O gxf3 6. Qxf3 Qf6 7. Nc3 c6 8.'+'\n'+
// 'd3 Bc5+ 9. Kh1 b5 10. Bb3 d5 11. exd5 cxd5 12. Nxd5 Qh6 13. Bxf4 Nd7'+'\n'+
// //'{Black resigns}'+'\n'+
// '1-0';

// var pgnText =
// '[Event "Liége"]'+'\n'+
// '[Site "?"]'+'\n'+
// '[Date "1928.??.??"]'+'\n'+
// '[Round "?"]'+'\n'+
// '[White "Liubarski"]'+'\n'+
// '[Black "Soultanbeieff, Victor Ivanov"]'+'\n'+
// '[Result "0-1"]'+'\n'+
// '[ECO "C53"]'+'\n'+
// '[PlyCount "32"]'+'\n'+

// '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Bb6 5. d4 Qe7 6. O-O Nf6 7. d5 Nb8 8. Be3 '+'\n'+
// 'd6 9. h3 h6 10. Qe2 g5 11. Nh2 g4 12. hxg4 Rg8 13. Bxh6 Nxg4 14. Be3 Nxh2 15. '+'\n'+
// 'Kxh2 Qh4+ 16. Kg1 Qh3 0-1';

// [Event "Gand-Terneuzen"]
// [Site "?"]
// [Date "1929.??.??"]
// [Round "?"]
// [White "Colle"]
// [Black "Delvaux"]
// [Result "1-0"]
// [ECO "D05"]
// [PlyCount "43"]

// 1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 c5 5. c3 Nc6 6. Nbd2 Be7 7. O-O c4 8. Bc2
// b5 9. e4 dxe4 10. Nxe4 O-O 11. Qe2 Bb7 12. Nfg5 h6 13. Nxf6+ Bxf6 14. Qe4 g6
// 15. Nxe6 fxe6 16. Qxg6+ Bg7 17. Qh7+ Kf7 18. Bg6+ Kf6 19. Bh5 Ne7 20. Bxh6 Rg8
// 21. h4 Bxh6 22. Qf7# 1-0

var pgnText = 
'[Event "London"]'+'\n'+
'[Site "?"]'+'\n'+
'[Date "1891.??.??"]'+'\n'+
'[Round "?"]'+'\n'+
'[White "Blackburne, Joseph"]'+'\n'+
'[Black "Blanchard"]'+'\n'+
'[Result "1-0"]'+'\n'+
'[ECO "C30"]'+'\n'+
'[PlyCount "35"]'+'\n'+
'[EventDate "1891.??.??"]'+'\n'+

'1. e4 e5 2. f4 Bc5 3. Nc3 Nc6 4. Nf3 exf4 5. d4 Bb4 6. Bxf4 d5 7. e5 Bxc3+ 8. '+'\n'+
'bxc3 Be6 9. Bd3 h6 10. O-O Nge7 11. Rb1 b6 12. Qd2 O-O 13. Bxh6 gxh6 14. Qxh6 '+'\n'+
'Ng6 15. Ng5 Re8 16. Rxf7 Bxf7 17. Qh7+ Kf8 18. Qxf7# 1-0';

// var pgnText = 
// '[Event "1001 Brilliant Mates"]'+'\n'+
// '[White "BWTC.0278"]'+'\n'+
// '[Result "*"]'+'\n'+
// '[FEN "1r3r2/2kP2Rp/p1bN1p2/2p5/5P2/2P5/P5PP/3R2K1 w - - 0 1"]'+'\n'+

// '1. d8=N Rbxd8 2. Nb7+ '+'\n'+
// '*';

// var pgnText = 
// '[Event "1001 Brilliant Mates"]'+'\n'+
// '[White "BWTC.0931"]'+'\n'+
// '[Result "*"]'+'\n'+

// '[FEN "1qrb4/r3pP1R/3k1N2/n2P4/3Q3K/N5p1/6B1/6B1 w - - 0 1"]'+'\n'+

// '1. f8=N Qb7 2. Ne6! exf6'+'\n'+
// '*';

//-------------------------------------------------------------------------------------------------------
//  Rook Movement Test PGN
//-------------------------------------------------------------------------------------------------------
// var pgnText = 
// '[Event "Rook Movement Test"]'+'\n'+
// '[Result "*"]'+'\n'+

// '[FEN "4k3/7R/2r5/8/6R1/3R4/8/4K3 w - - 0 1"]'+'\n'+

// // Testing horizontal rook movement 
// '1. Rdd4 Rc2 2. Rhh4 Rb2 3. Ra4 Rc2 4. Rgb4 Rb2 5. Rbf4 Rb4 6. Rfxb4 Kd8 7. Rb1 Ke8 8. Ra4b4 Kd8'+'\n'+
// '*';

// // Testing vertical rook movement 
// '1. Rhd7 Rc2 2. Rg4d4 Rb2 3. Rd1 Rc2 4. R4d6 Rb2 5. Rd8 Rd2 6. R6xd2'+'\n'+
// '*';

//-------------------------------------------------------------------------------------------------------
//  Bishop Movement Test PGN
//-------------------------------------------------------------------------------------------------------
// var pgnText = 
// '[Event "Bishop Movement Test"]'+'\n'+
// '[Result "*"]'+'\n'+

// '[FEN "4K2b/b7/b1BBb1BB/8/8/k7/b1BB1b1B/b4b2 w - - 0 1"]'+'\n'+

// // Testing horizontal bishop movement 
// '1. Bd5 Bg8 2. Bdf8 Bgxd5'+'\n'+
// '*';

//-------------------------------------------------------------------------------------------------------
//  Knight Movement Test PGN
//-------------------------------------------------------------------------------------------------------
// var pgnText = 
// '[Event "Knight Movement Test"]'+'\n'+
// '[Result "*"]'+'\n'+

// '[FEN "3N1N2/2Nn1nN1/2n3n1/2N3N1/2nN1Nn1/3n1n2/8/k6K w - - 0 1+-+-+4K2b/b7/b1BBb1BB/8/8/k7/b1BB1b1B/b4b2 w - - 0 1"]'+'\n'+

// // Testing knight movement 
// '1. Ndb3 Ng1 2. N7a6 N6a5 3. Ng5e6 Nd3e5'+'\n'+
// '*';

//-------------------------------------------------------------------------------------------------------
//  Queen Movement Test PGN
//-------------------------------------------------------------------------------------------------------
// var pgnText = 
// '[Event "Queen Movement Test"]'+'\n'+
// '[Result "*"]'+'\n'+

// '[FEN "2q1q2Q/5Q2/3q4/q6q/2q1Q3/3R3Q/Q4qQ1/8 w - - 0 1"]'+'\n'+

// // Testing queen movement 
// '1. Qc2 Qd1 2. Qhf5 '+'\n'+
// '*';

//---------------------------------------------------------------------------------------------------------
// Pawn Promotion Test PGN
//---------------------------------------------------------------------------------------------------------
var pgnText = 
'[Event "Pawn Promotion Test"]'+'\n'+
'[Result "*"]'+'\n'+

'[FEN "8/8/PK6/8/8/6kp/8/8 w - - 0 1"]'+'\n'+

// Testing pawn promotion
'1. a7 h2 2. a8=Q h1=Q 3. Qxh1!'+'\n'+
'*';

        loadPgn(pgnText);

        drawScreen();
    }
    //-------------------------------------------------------------------------------------
    function resetGame() {

       score = 0;
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

        score = 0;
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

    function dumpDebugInfo() {
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

       if (!usingClock && pgnGame.endOfGame()) {
           endGame(); return;
       }
       // ---------------------------
       // scriptedMovePlayLevel1: Play through a pgn game
       // 
       // Set expectedMove to next move in game
       expectedMove = pgnGame.getNextMove();
       dumpDebugInfo();

       // expectedPiece = newPiece;
       // expectedSquare
       // expectedMove

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

        if (canvasutils.ptInRect(mouseCoords,startButton.getRect())) {
            startGame();
        }
    }

    //-------------------------------------------------------------------------------------
    function OnCompleteStageMouseClick(e) {
        // Get the mouse coords
        mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
        mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

        if (canvasutils.ptInRect(mouseCoords,startButton.getRect())) {
            if (startButton.getText() === "Try Again!") {
               resetGame();
               startGame();
            } else if (startButton.getText() === "Next Exercise") {
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
        board.textColor = (correctGuess?"#00FF00":"#FF0000");
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