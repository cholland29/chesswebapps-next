
function SquareGameApp(master_board) {

   var name = "SquareGame";
   var that = this;
   var theCanvas = document.getElementById("canvas1");
   var context = theCanvas.getContext("2d");
   var canvasutils = new CanvasUtils(); // TODO: board has an instance of this and there is no need. resolve this or properly define functions
                                        // using function.prototype

   // Preferences
   var ss = 60; // square size
   var padding = [100,50,50,50];
   var board;
   if (!master_board) {
       board = new Board(theCanvas,ss,padding,OnResourcesLoaded);
   } else {
       board = master_board;
       board.setPadding(padding);
   }

   var ss,padding,CANVAS_HEIGHT,CANVAS_WIDTH;
   
   var clock = null;
   var mouseOffCanvas = false;
   var mouseCoords = {x: 0, y: 0};

   var GAME_DURATION_IN_SEC = 5;
   var letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
   var numbers = [8, 7, 6, 5, 4, 3, 2, 1];
   var selectedSquare = null;
   var expectedSquare = "h4";
   var score = 0;
   var gameOver = false;
   var gameInProgress = false;
   var gameStage;
   var GAME_INIT        = 1,
       GAME_IN_PROGRESS = 2,
       GAME_COMPLETE    = 3;
   var startButtonRect;
   var textColor = "#1AD920";
   var problemId = 1;
   var scoreToAdvance = [-1,20,15,10]; // scoreToAdvance[0] is placeholder only, problemId's start at 1

   // Gui Elements
   var gameInstructionsEl = document.getElementById("gameInstructions");
   var squareCoordEl = document.getElementById("squareCoord");
   var exclamEl = document.getElementById("exclam");
   var scoreEl = document.getElementById("score");
   var timeEl = document.getElementById("time");
   var startButtonEl = document.getElementById("startGameButton");
   var formElement = document.getElementById("textColorPicker");
   formElement.addEventListener("change",textColorChanged,false);
   formElement.value = textColor;

   // Mouse Callbacks
   var OnInitScreenMouseClick,
       OnCompleteScreenMouseClick,
       OnMouseClick,
       OnMouseDown,
       OnMouseUp,
       OnMouseIn,
       OnMouseOut;

   // Game Objects
   var gameObj = null;

   // Function Pointers
   this.draw = drawScreen;
   this.drawAfterGuessAnimation = drawProblemCheckSequence;

   // Initializing some stuff
   ss = board.squareSize;
   padding = board.padding;
   CANVAS_WIDTH  = board.padding[1] + ss*8 + board.padding[3];
   CANVAS_HEIGHT = board.padding[0] + ss*8 + board.padding[2];
   theCanvas.width  = CANVAS_WIDTH;
   theCanvas.height = CANVAS_HEIGHT;

   //-------------------------------------------------------------------------------------
   this.getCanvas = function() { return theCanvas; }
   this.getContext = function() { return context; }
   this.getBoard = function() { return board; }
   this.getScore = function() { return score; }
   this.setFlippedState = function(state) { board.setBoardFlipped(state); drawScreen();};
   this.getFlippedState = function() { return board.getBoardFlipped(); };
   this.flipBoard = function() {
      board.setBoardFlipped(!board.getBoardFlipped());
      drawScreen();
   };
   this.getInitMsg = function() {
      return ["Click on the squares","as fast as you can!"];
   };
   
   this.init = function() {
       initGame();
   };
   this.cleanUp = function() {
       removeMouseListeners();
   };
  
   this.setProblem = function(probVars) {
       console.log("Setting Problem Id " + probVars.problemId);

       // Reset mouse click handlers
       removeMouseListeners(); 

       if (gameObj !== null) {
           gameObj.cleanUp();
       }

       switch(probVars.problemId) {
           case "1":   
               gameObj = this;
               problemId = 1;
               this.setFlippedState(false);
               OnInitScreenMouseClick     = OnInitSquareGameMouseClick;
               OnMouseClick               = OnSquareGameMouseClick;
               OnCompleteScreenMouseClick = OnCompleteSquareGameMouseClick;
               break;
           case "2":
               gameObj = this;
               problemId = 2;
               this.setFlippedState(true);
               OnInitScreenMouseClick     = OnInitSquareGameMouseClick;
               OnMouseClick               = OnSquareGameMouseClick;
               OnCompleteScreenMouseClick = OnCompleteSquareGameMouseClick;
               break;
           case "3":
               gameObj = new MovePieceGame(this);
               gameObj.init();
               problemId = 3;
               this.setFlippedState(false);
               OnInitScreenMouseClick     = (gameObj.OnInitScreenMouseClick !== null ? gameObj.OnInitSquareGameMouseClick : OnInitSquareGameMouseClick);
               OnMouseClick               = (gameObj.OnMouseClick !== null ? gameObj.OnMouseClick : OnSquareGameMouseClick);
               OnMouseDown                = (gameObj.OnMouseDown !== null ? gameObj.OnMouseDown : null);
               OnMouseUp                  = (gameObj.OnMouseUp !== null ? gameObj.OnMouseUp : null);
               OnCompleteScreenMouseClick = (gameObj.OnCompleteScreenMouseClick !== null ? gameObj.OnCompleteScreenMouseClick : OnCompleteSquareGameMouseClick);
               break;
       }
       resetGame();
   };

   function removeMouseListeners() {
       theCanvas.removeEventListener('click',OnInitScreenMouseClick,false); 
       theCanvas.removeEventListener('click',OnMouseClick,false);
       theCanvas.removeEventListener('mousedown',OnMouseDown,false);
       theCanvas.removeEventListener('mouseup',OnMouseUp,false);
       theCanvas.removeEventListener('click',OnCompleteScreenMouseClick,false);  
   }

   function OnResourcesLoaded(e) {
      // We must wait for all of our resources to load before continuing on.
        //board = new Board(theCanvas,ss,padding,OnResourcesLoaded);
        console.log("Resources Loaded in SquareGameApp");
        initGame();
   }


   //-------------------------------------------------------------------------------------
   function setGameStage( stageVal ) {

       gameStage = stageVal;
       switch(stageVal) {
           case GAME_INIT:
               gameOver = false;
               gameInProgress = false;
               gameInstructionsEl.innerHTML = "Hit Start To Begin!";
               startButtonEl.addEventListener('click',OnStartGameClick,false);
               theCanvas.addEventListener('click',OnInitScreenMouseClick,false); 
               theCanvas.removeEventListener('click',OnMouseClick,false);
               theCanvas.removeEventListener('mousedown',OnMouseDown,false);
               theCanvas.removeEventListener('mouseup',OnMouseUp,false);
               theCanvas.removeEventListener('click',OnCompleteScreenMouseClick,false);             
               break;
           case GAME_IN_PROGRESS:
               gameOver = false;
               gameInProgress = true;
               theCanvas.removeEventListener('click',OnInitScreenMouseClick,false); 
               theCanvas.addEventListener('click',OnMouseClick,false);
               theCanvas.addEventListener('mousedown',OnMouseDown,false);
               theCanvas.addEventListener('mouseup',OnMouseUp,false);
               theCanvas.removeEventListener('click',OnCompleteScreenMouseClick,false);
               break;
           case GAME_COMPLETE:
               gameOver = true;
               gameInProgress = false;
               theCanvas.removeEventListener('click',OnInitScreenMouseClick,false); 
               theCanvas.removeEventListener('click',OnMouseClick,false);
               theCanvas.removeEventListener('mousedown',OnMouseDown,false);
               theCanvas.removeEventListener('mouseup',OnMouseUp,false);
               theCanvas.addEventListener('click',OnCompleteScreenMouseClick,false);
               break;
       }
   };

   //-------------------------------------------------------------------------------------
   function initGame() {

       clock = new CountdownClock( GAME_DURATION_IN_SEC, onClockStart, onClockStop, onClockTick );

       setGameStage(GAME_INIT);

       score = 0;
       drawScreen();
   }

   //-------------------------------------------------------------------------------------
   function resetGame() {

       if (clock.countdownInProgress()) {
           clock.stopClock();
       }
       clock.resetClock();

       setGameStage(GAME_INIT);
       
       startButtonEl.style.display = "block";
       
       score = 0; 
       drawScreen();
   }

   //-------------------------------------------------------------------------------------
   function startGame() {

       score = 0;
       setGameStage(GAME_IN_PROGRESS);

       getNextProblem();

       // Start the clock
       clock.startClock();

       startButtonEl.style.display = "none";

   }

   //-------------------------------------------------------------------------------------
   function endGame() {

      setGameStage(GAME_COMPLETE);
      board.clearBoard();
      //drawFinalScore();
      startButtonEl.style.display = "block";
      if (gameObj.hasOwnProperty('endGame')) {
          gameObj.endGame();
      }
      drawScreen();
   }

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

   //-------------------------------------------------------------------------------------
   this.genRandomAlgebraicSquare = function() {
       var let = letters[Math.floor((Math.random()*8))]; // Generate random index between 0 - 7
       var num = numbers[Math.floor((Math.random()*8))]; // Generate random index between 0 - 7
       return (let+num);
   };
   //-------------------------------------------------------------------------------------
   function getNextProblem() {

      if (gameObj.hasOwnProperty('getNextProblem')) {
           gameObj.getNextProblem();
           return;
      }
      // Get next random square
      var randomSquare;
      var uniqueSquareFound = false;
      while( !uniqueSquareFound ) {
          randomSquare = that.genRandomAlgebraicSquare();
          uniqueSquareFound = (expectedSquare !== randomSquare);
      }
      expectedSquare = randomSquare;

      // Update gui with new expected square
      squareCoordEl.innerHTML = expectedSquare;
      exclamEl.innerHTML = "";

      drawScreen();

   }

   //-------------------------------------------------------------------------------------
   function drawScreen() {

      context.fillStyle = "#FFFFFF";
      context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

      //board.clearBackground(); // no need to do this if the entire canvas is cleared
      context.save();
      board.drawSquares();
      board.drawBorder();
      board.drawArrows();
      board.drawBoardCoordinates();

      drawClock();
      drawScore();

      // Stage 1: Start Game Button
      // Stage 2: Active game play - nextProblem dispalyed top center of canvas
      // Stage 3: Final Score and Try Again or Next Exercise Button is displayed
      if (gameStage === GAME_IN_PROGRESS) {
         // Draw Next Problem Coord In
         if (gameObj.drawGameInProgress) {
            gameObj.drawGameInProgress();
         } else {
            context.font = "normal bold 60px serif";
            context.fillStyle = "#000000";
            context.textAlign = "center";
            context.fillText(expectedSquare,board.padding[3]+ss*4,75);
         }
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
  function drawButton(label) {
     context.save();

     var x = CANVAS_WIDTH/2;
     var y = CANVAS_HEIGHT/2;

     // Draw the start button
     textProps = { 
         font : '30pt Times',
         padding : [0,0,0,5]
     };
     rectProps = {
         innerFillStyle : textColor,
         outerFillStyle : "000000",
     };
     context.font = textProps.font;
     context.textAlign = 'center'; // the testLine() only works if this is set to 'left'
     context.textBaseline = 'top'; // important!
     var text = label;
     var h = canvasutils.getTextHeight(textProps.font);
     var butWidth = context.measureText(text).width+2*textProps.padding[3];
     var butHeight = h.height;
     var butX = x - butWidth/2;
     var butY = y+butHeight*1.5;
     startButtonRect = [butX,butY,butWidth,butHeight];
     canvasutils.drawButton(context,butX,butY,butWidth,butHeight,text,textProps,rectProps);
     
     context.restore();
  }
  //-------------------------------------------------------------------------------------
  function drawInitScreen() {
     var message = ["Exercise: " + problemId];
     if (gameObj !== null) {
        message = message.concat(gameObj.getInitMsg());
     }

     // Draw the instructions
     drawMessage(message);
     
     // Draw start button
     drawButton("Click Start!");
  }

  //-------------------------------------------------------------------------------------
  function drawCompleteScreen() {

     var message = ["Final Score: " + score];
     if (gameObj !== null && gameObj.getCompleteMsg) {
         message = message.concat(gameObj.getCompleteMsg());
     }
     if (message.length === 1) {
         if (score >= scoreToAdvance[problemId]) {
             message[1] = "Congratulations!";
             message[2] = "You may advance to the";
             message[3] = "next exercise";
         } else {
             message = message.concat(["Almost! You need to", "score " + scoreToAdvance[problemId] + " to advance"]);
         }
     }

     // Draw the complete message
     drawMessage(message);
     
     // Draw start button
     drawButton("Try Again");

  }

  //-------------------------------------------------------------------------------------
  function drawClock(timeStr) {
      context.font = "normal bold 30px serif";
      context.fillStyle = "#444444";
      context.textAlign = "left";
      if (!timeStr) {
          timeStr = clock.convertSecToTimeString();
      }
      timeEl.innerHTML = timeStr;
      if (board !== null) {
          context.fillText(timeStr,1.5*board.padding[3],75);
      }
  }

  //-------------------------------------------------------------------------------------
  function drawScore() {
      context.font = "normal bold 30px serif";
      context.fillStyle = "#444444";
      context.textAlign = "right";
      scoreEl.innerHTML = score;
      if (board !== null) {
          context.fillText("Score: " + score,ss*8+padding[3]/2,75);
      }

  }

  //-------------------------------------------------------------------------------------
  function drawFinalScore() {
     var i = 0;
     var timer = setInterval(function() { 
        drawScreen();
        board.textColor = "00FF00";
        board.textSize = "50";
        board.fillOrStroke = "both";
        board.fontWeight = "bold";
        context.textAlign = "center";
        board.drawMessage("Final Score: " + i, "center");
        if (score < 0) {
            if (--i < score) {
                clearInterval(timer);
            }
        } else {
            if (++i > score) {
                clearInterval(timer);
            }
        }
     }, 50);
  }

  //-------------------------------------------------------------------------------------
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
     theCanvas.removeEventListener('click',OnMouseClick,false);

     if (correctGuess) {
         highlightColor = "#00FF00";
         exclamEl.innerHTML = "YES!";
         score++;
      } else {
         highlightColor = "#FF0000";
         board.addArrow(selSquare.toAlgebraic()+expectedAlgSquare);
         exclamEl.innerHTML = "NO!";
         score--;
      }
      //updateScore(score);

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
        board.drawMessage((correctGuess?"+1":"-1"), selSquare.getCenterCoords(), [0, yOffset]); // 3rd arg is offset x,y from center
        if (gameOver || (frameCount * msPerFrame) >= msAnimationDuration) {
            clearInterval(timer);
            selSquare.removeHighlight();
            board.popArrow();
            getNextProblem();
            theCanvas.addEventListener('click',OnMouseClick,false);
        }
        frameCount++;
     }, msPerFrame);
  }

  //-------------------------------------------------------------------------------------
  function OnStartGameClick(e) {
    if (gameStage !== GAME_IN_PROGRESS) {
       startGame();
     }
  }

  //-------------------------------------------------------------------------------------
  function OnInitSquareGameMouseClick(e) {
      // Get the mouse coords
      mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
      mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

      if (canvasutils.ptInRect(mouseCoords,startButtonRect)) {
         startGame();
      }
  }

  //-------------------------------------------------------------------------------------
  function OnCompleteSquareGameMouseClick(e) {
      // Get the mouse coords
      mouseCoords.x = (e.pageX-theCanvas.offsetLeft);// + self.pageXOffset;
      mouseCoords.y = (e.pageY-theCanvas.offsetTop);// + self.pageYOffset;

      if (canvasutils.ptInRect(mouseCoords,startButtonRect)) {
         resetGame();
         startGame();
      }
  }

  //-------------------------------------------------------------------------------------
   function OnSquareGameMouseClick(e) {
      
      if (gameOver) { 
         console.log("Game Over!!!!!");
         return; 
      }

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

   function textColorChanged(e) {
      var target = e.target;
      textColor = target.value;
      drawScreen();
  }
   
}