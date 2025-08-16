function squareGame2(master_board,gameConsole,OnStageChangeFcn) {
   
    var mode = "playingWhite"; // either "playingWhite" || "playingBlack"
    var problemId = -1;

    var theCanvas = document.getElementById("canvas1");
    var context = theCanvas.getContext("2d");
    var clock = null;
    var mouseOffCanvas = false;
    var mouseCoords = {x: 0, y: 0};

    var GAME_DURATION_IN_SEC = 60;
    var selectedSquare = null;
    var expectedSquare = "";
    var failedAttempts = 0;
    var failedScores = [];
    var scoreToAdvance = {
      playingWhite : 15,
      playingBlack : 10
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
        removeMouseListeners();
        if (clock.countdownInProgress()) {
           clock.stopClock();
        }
        clock.resetClock();
    }
    //-----------------------------------------------------------------------------
    function setMode(newMode) {
        mode = newMode;
        failedAttempts = 0;
        failedScores = [];
        score.reset();
        setFlippedState( mode === "playingWhite" ? false : true );
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
        drawTopBoardMessage(expectedSquare);
      } else if (gameStage === GAME_INIT) {
        // Draw Instructions and Start Button on canvas
        drawInitScreen();
      } else if (gameStage === GAME_COMPLETE) {
        // Game Over Stage: Draw "Try Again or Next Exercise" Button
        drawCompleteScreen();
      }

      context.restore();
            
	}
	//-------------------------------------------------------------------------------------
  function drawInitScreen() {

     var message = ["Exercise: " + problemId,"Click on the squares","as fast as you can!"];

     // Draw the instructions
     drawMessage(message);
     
     // Draw start button
     startButton.draw(context);
     // drawButton("Click Start!");
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
               theCanvas.addEventListener(   'click',OnInitStageMouseClick,false); 
               theCanvas.removeEventListener('click',OnGameMouseClick,false);
               theCanvas.removeEventListener('click',OnCompleteStageMouseClick,false);             
               break;
           case GAME_IN_PROGRESS:
               gameOver = false;
               gameInProgress = true;
               theCanvas.removeEventListener('click',OnInitStageMouseClick,false); 
               theCanvas.addEventListener(   'click',OnGameMouseClick,false);
               theCanvas.removeEventListener('click',OnCompleteStageMouseClick,false);
               break;
           case GAME_COMPLETE:
               gameOver = true;
               gameInProgress = false;
               if (score.getScore() < scoreToAdvance[mode]) { failedAttempts++; failedScores.push(score) }
               theCanvas.removeEventListener('click',OnInitStageMouseClick,false); 
               theCanvas.removeEventListener('click',OnGameMouseClick,false);
               theCanvas.addEventListener(   'click',OnCompleteStageMouseClick,false);
               break;
       }

       var info = {};
       info.problemId = problemId;
       info.stageVal = stageVal;
       info.score = score.getScore();
       info.advance = score.getScore() >= scoreToAdvance[mode];
       info.failedAttempts = failedAttempts;
       info.failedScores = failedScores;
       stageChangeFcn(info);
   };

   //-----------------------------------------------------------------------------
	// Game Control Functions - (not a part of the "Game" API)
	//-----------------------------------------------------------------------------

   //-------------------------------------------------------------------------------------
   function initGame() {

       score.reset();

       clock = new CountdownClock( GAME_DURATION_IN_SEC, onClockStart, onClockStop, onClockTick );

       setGameStage(GAME_INIT);

       drawScreen();
   }

   //-------------------------------------------------------------------------------------
   function resetGame() {

       score.reset();

       if (clock.countdownInProgress()) {
           clock.stopClock();
       }
       clock.resetClock();

       setGameStage(GAME_INIT);
       
       drawScreen();
   }

    //-------------------------------------------------------------------------------------
    function startGame() {

        score.reset();
        setGameStage(GAME_IN_PROGRESS);

        getNextProblem();

        // Start the clock
        clock.startClock();

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
    }
    //-------------------------------------------------------------------------------------
    function getNextProblem() {

       // Get next random square
       var randomSquareCoord;
       var uniqueSquareFound = false;
       while( !uniqueSquareFound ) {
           randomSquareCoord = ChessUtils.genRandomAlgebraicSquare();
           uniqueSquareFound = (expectedSquare !== randomSquareCoord);
       }
       expectedSquare = randomSquareCoord;

       drawScreen();

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
              console.log("Attempting to run auto click: " + "#Problem-"+(problemId+1));
              $("#Problem-"+(problemId+1)).click();
            }
        }
    }

    //-------------------------------------------------------------------------------------
    function OnGameMouseClick(e) {
 

       // Get the mouse coords
       mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
       mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

       // Get the square the user clicked on
       selectedSquare = board.screenToSquare(mouseCoords.x,mouseCoords.y);
       if (selectedSquare === null) {
          return; // user clicked off the board somewhere
       }

       // Did the user click on the right square?
       console.log("Clicked Square: " + selectedSquare.toAlgebraic());
       var correctGuess = (selectedSquare.toAlgebraic() === expectedSquare);
      
       drawProblemCheckSequence(correctGuess,selectedSquare,expectedSquare);
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

    function setFlippedState(state) { board.setBoardFlipped(state); drawScreen(); }
    function getFlippedState() { return board.getBoardFlipped(); }
    function flipBoard() {
      board.setBoardFlipped(!board.getBoardFlipped());
      drawScreen();
    }
    function removeMouseListeners() {
       theCanvas.removeEventListener('click',OnInitStageMouseClick,false); 
       theCanvas.removeEventListener('click',OnGameMouseClick,false);
       // theCanvas.removeEventListener('mousedown',OnMouseDown,false);
       // theCanvas.removeEventListener('mouseup',OnMouseUp,false);
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
     var highlightColor;

     // Must disable clicks while animating your user can spam click and rack up points (thanks Henry)
     theCanvas.removeEventListener('click',OnGameMouseClick,false);

     if (correctGuess) {
         highlightColor = "#00FF00";
         // exclamEl.innerHTML = "YES!";
         score.incrementBy(1);
      } else {
         highlightColor = "#FF0000";
         board.addArrow(selSquare.toAlgebraic()+expectedAlgSquare);
         // exclamEl.innerHTML = "NO!";
         score.decrementBy(1);
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
        board.drawMessage((correctGuess?"+1":"-1"), selSquare.getCenterCoords(), [0, yOffset]); // 3rd arg is offset x,y from center
        if (gameOver || (frameCount * msPerFrame) >= msAnimationDuration) {
            clearInterval(timer);
            selSquare.removeHighlight();
            board.popArrow();
            getNextProblem();
            theCanvas.addEventListener('click',OnGameMouseClick,false);
        }
        frameCount++;
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
        if (clock === null ) { return; }
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