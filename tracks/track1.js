
$(document).ready( main );

function main() {
	trackController(track1());
}

function track1() {
    var uniqueId = makeid(); // TODO: Get rid of this once you add user names and passwords
	var trackId = 1;
	var trackTitle = "Algebraic Notation";
    var author = "Corbin Holland";
    var instructions1 = "Chess players must be able to find squares quickly on the board.  This exercise will test your ability " +
                        "to do so. <br>" +
                        "<div class='orders'>"+
                        "   <span id='ordersLabel'>Instructions</span><br />"+
                        "   An algebraic square will be displayed. All you have to do is click on it."+
                        "   Click on the squares as fast as you can!"+
                        "   <span class='bold'>You must score at least 15 to advance to the next exercise.</span>"+
                        "</div>";
                        " <br>" +
                        "<b>You must score at least 20 to advance to the next exercise.</b>",
        instructions2 = "You must also be able to do it from black's perspective with the board \"flipped\". This will be harder " +
                        "but you can do it!"+
                        "<div class='orders'>"+
                        "   <span id='ordersLabel'>Instructions</span><br />"+
                        "   An algebraic square will be displayed. All you have to do is click on it."+
                        "   Click on the squares as fast as you can!"+
                        "   <span class='bold'>You must score at least 10 to advance to the next exercise.</span>"+
                        "</div>",
        instructions3 = "Let's practice reading chess moves written in algebraic notation. Examples are Nb3, Qa7, Rc4. " +
                        "The first letter tells you what piece to move. It is always uppercase.<br />" +
                        "<ul class='bold'>"+
                        "   <li>R = Rook</li>"+
                        "   <li>B = Bishop</li>"+
                        "   <li>Q = Queen</li>"+
                        "   <li>K = King</li>"+
                        "   <li>N = Knight</li>"+
                        "   <li>and Pawns have no letter at all!</li>"+
                        "</ul>"+
                        "The last two characters are the square you move the piece to. " +
                        "The letter of the file is always lowercase. So...." +
                        "<ul>"+
                        "   <li>Nb3 means move the knight to the b3 square</li>"+
                        "   <li>Qa7 means move the queen to the a7 square</li>"+
                        "   <li>Rc4 means move the rook to the c4 square</li>"+
                        "   <li>e4 means move a pawn to the e4 square</li>"+
                        "</ul>"+
                        "<div class='orders'>"+
                        "   <span id='ordersLabel'>Instructions</span><br />"+
                        "   Move the correct piece to the square."+
                        "   <span class='bold'>You must score at least 18 to advance to the next exercise.</span>"+
                        "</div>",
        instructions4 = "Ok lets make it a bit harder shall we? I am going to add random pieces to the board. Let's"+
                        " see if you can find the right move now."+
                        "<div class='orders'>"+
                        "   <span id='ordersLabel'>Instructions</span><br />"+
                        "   Move the correct piece to the square."+
                        "   <span class='bold'>You must score at least 18 to advance to the next exercise.</span>"+
                        "</div>",
        instructions5 = "Ok now I am going to randomly generate positions with pieces of both colors on the board. "+
                        "Look out for moves that have an 'x' between the piece and the square. They look like this:"+
                        "<ul>"+
                        "   <li>Nxf7 : knight takes on f7</li>"+
                        "   <li>Qxa1 : queen takes on a7</li>"+
                        "</ul>"+
                        "Also be on the lookout for moves that look like this Ncd5 or Rbb3."+
                        "<ul>"+
                        "   <li>Ncd5 : knight on the c-file moves to d5</li>"+
                        "   <li>Rbb3 : rook on the b-file moves to b3</li>"+
                        "   <li>R7d7 : rook on the 7th rank moves to d7</li>"+
                        "</ul>"+
                        "This notation is used when you have two rooks or two knights of the same color that can move "+
                        "to the same square. It lets you know which rook or knight to move."+
                        "<div class='orders'>"+
                        "   <span id='ordersLabel'>Instructions</span><br />"+
                        "   Move the correct piece to the square."+
                        "   <span class='bold'>You must score at least 15 to advance to the next exercise.</span>"+
                        "</div>",
        instructions6 = "Lets apply what we have learned."+
                        "<div class='orders'>"+
                        "   <span id='ordersLabel'>Instructions</span><br />"+
                        "   Play through the game you see displayed to the right of the board. You will play both the white and black moves."+
                        "   <span class='bold'>To complete this exercise, you must successfully play through all the moves.</span>"+
                        "</div>";
    var instructions = [instructions1,instructions2,instructions3,instructions4,instructions5,instructions6];
    var problemSet = [
        "1-----1-----8/8/8/8/8/8/8/8 w - - 0 1-----"+instructions1+"-----This is a test",
        "1-----2-----8/8/8/8/8/8/8/8 w - - 0 1-----"+instructions2+"-----Mate in 1",
        "1-----3-----8/8/8/8/8/8/8/8 w - - 0 1-----"+instructions3+"-----Whatever",
        "1-----4-----8/8/8/8/8/8/8/8 w - - 0 1-----"+instructions4+"-----Whatever",
        "1-----5-----8/8/8/8/8/8/8/8 w - - 0 1-----"+instructions5+"-----Whatever",
        "1-----6-----8/8/8/8/8/8/8/8 w - - 0 1-----"+instructions6+"-----Whatever"
    ];

    return {
        trackId : trackId,
        trackTitle : trackTitle,
        author : author,
        instructions : instructions,
        problemSet : problemSet,
        problemController : problemController, // function
    };

    function makeid()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

    function problemController(master_board) {

	    var board = master_board;
        var gameConsole = document.getElementById("gameConsole");
	    var gameObj = null;
	    var problemId;

	    return {
	        setProblem : setProblem,
	        getGameObject : getGameObject,
            OnTrackComplete : OnTrackComplete,
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

       function OnTrackComplete(info) {
           console.log("uniqueId: " + uniqueId);
           console.log("track1::problemController::OnTrackComplete -- stage: " + info.stageVal);
           console.log("ProblemId is: " + info.problemId);
           console.log("Score is: " + info.score);
           console.log("Advance?: " + info.advance);
           console.log("Failed Attempts: " + info.failedAttempts);
           console.log("Failed Scores: " + ArrayUtils.arr2str(info.failedScores));

           $.post("trackController/php/trackComplete.php",
                {
                  uniqueId : uniqueId,
                  trackId: trackId,
                  trackTitle: trackTitle,
                  student: "unknown",
                  problemId: info.problemId,
                  score: info.score,
                  advance: (info.advance ? "true" : "false"),
                },
                function(data){
                  console.log("Data returned from post: " + data);
                  console.log("post finished");
                }
             );
       }
    }
}
