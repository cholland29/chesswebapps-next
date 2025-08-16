function gameController(master_board) {
	// Init Screen Is Displayed
	// Game is started
	// Game ends naturally
	// Game ends abruptly
	// Complete Screen Is Displayed
	// Game is restarted
	// Game is cleaned up

	// init function
	// reset function
	// startGame function
	// endGame function
	// cleanup function
	// Mouse Listeners
	// setGameStage

	var board = master_board;
  var gameConsole = document.getElementById("gameConsole");
	var gameObj = null;
	var problemId;

    return {
        setProblem : setProblem,
        getGameObject : getGameObject
    };
	
  function getGameObject() { return gameObj; }
	//-----------------------------------------------------------------------------
	function setProblem(probVars,OnStageChangeFcn) {
       console.log("Setting Problem Id: " + probVars.problemId);

       if (gameObj !== null) {
           gameObj.cleanUp();
       }

       switch(probVars.problemId) {
           case "1":   
               problemId = 1;
               gameObj = squareGame2(board,gameConsole,OnStageChangeFcn);
               gameObj.setMode("playingWhite");
               break;
           case "2":
               problemId = 2;
               gameObj = squareGame2(board,gameConsole,OnStageChangeFcn);
               gameObj.setMode("playingBlack");
               break;
           case "3":
               problemId = 3;
               gameObj = movePieceGame2(board,gameConsole,OnStageChangeFcn);
               gameObj.setMode("movingPiecesLevel1");
               break;
           case "4":
               problemId = 4;
               gameObj = movePieceGame2(board,gameConsole,OnStageChangeFcn);
               gameObj.setMode("movingPiecesLevel2");
               break;
           case "5":
               problemId = 5;
               gameObj = movePieceGame2(board,gameConsole,OnStageChangeFcn);
               gameObj.setMode("movingPiecesLevel3");
               break;
           case "6":
               problemId = 6;
               gameObj = scriptedMovePlay(board,gameConsole,OnStageChangeFcn);
       }
       gameObj.setProblemId(probVars.problemId);
       gameObj.init();
   };


}