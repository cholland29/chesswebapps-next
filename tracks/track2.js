
$(document).ready( main );

function main() {
	trackController(track2());
}

function track2() {
    var uniqueId = makeid(); // TODO: Get rid of this once you add user names and passwords
	  var trackId = 2;
	  var trackTitle = "Mates In 1";
    var author = "Corbin Holland";
    var instructions = "White to Move -- Find the Mate In 1";

    var pgns = [];

    // Problems 1-10 in Polgar "Chess"
    pgns.push('[FEN "3q1rk1/5pbp/5Qp1/8/8/2B5/5PPP/6K1 w - - 0 1"]'+'\n'+'1. Qxg7'+'\n'+'*');
    pgns.push('[FEN "2r2rk1/2q2p1p/6pQ/4P1N1/8/8/1PP5/2KR4 w - - 0 1"]'+'\n'+'1. Qxh7'+'\n'+'*');
    pgns.push('[FEN "r2q1rk1/pp1p1p1p/5PpQ/8/4N3/8/PP3PPP/R5K1 w - - 0 1"]'+'\n'+'1. Qg7'+'\n'+'*');
    pgns.push('[FEN "6r1/7k/2p1pPp1/3p4/8/1R6/5PPP/5K2 w - - 0 1"]'+'\n'+'1. Rh3'+'\n'+'*');
    pgns.push('[FEN "1r4k1/1q3p2/5Bp1/8/8/8/PP6/1K5R w - - 0 1"]'+'\n'+'1. Rh8'+'\n'+'*');
    pgns.push('[FEN "r4rk1/5p1p/8/8/8/8/1BP5/2KR4 w - - 0 1"]'+'\n'+'1. Rg1'+'\n'+'*');
    pgns.push('[FEN "4r2k/4r1p1/6p1/8/2B5/8/1PP5/2KR4 w - - 0 1"]'+'\n'+'1. Rh1'+'\n'+'*');
    pgns.push('[FEN "8/2r1N1pk/8/8/8/2q2p2/2P5/2KR4 w - - 0 1"]'+'\n'+'1. Rh1'+'\n'+'*');
    pgns.push('[FEN "r7/4KNkp/8/8/b7/8/8/1R6 w - - 0 1"]'+'\n'+'1. Rg1'+'\n'+'*');
    pgns.push('[FEN "2kr4/3n4/2p5/8/5B2/8/6PP/5B1K w - - 0 1"]'+'\n'+'1. Ba6'+'\n'+'*');
        
    var prob = "";
    var problemSet = [];
    for (var i = 0 ; i < pgns.length ; i++) {
        prob = trackId+"-----"+(i+1)+"-----"+pgns[i]+"-----"+instructions+"-----This is a test",
        console.log("Problem " + i+1 +": "+prob);
        problemSet.push(prob);
    }

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
          OnTrackComplete : OnTrackComplete
	    };
	
	    function getGameObject() { return gameObj; }

 	    //-----------------------------------------------------------------------------
      // Called when user clicks a Problem in track list
	    function setProblem(probVars,OnStageChangeFcn) {
         console.log("******setProblem called");
         console.log("Setting Problem Id: " + probVars.problemId);

         if (gameObj !== null) {
             console.log("Cleaning up gameObj");
             gameObj.cleanUp();
         } else {
           	 gameObj = mateSolver(board,gameConsole,OnStageChangeFcn);
         }

         problemId = ((typeof probVars.problemId === 'number') ? probVars.problemId : parseInt(probVars.problemId));
           
	       gameObj.setPosition(problemSet,problemId);
         gameObj.init();
      };

      function OnTrackComplete(info) {
          console.log("uniqueId: " + uniqueId);
          console.log("track2::problemController::OnTrackComplete -- stage: " + info.stageVal);
          console.log("ProblemId is: " + info.problemId);
          console.log("Score is: " + info.score);
          console.log("Advance?: " + info.advance);
          console.log("Failed Attempts: " + info.failedAttempts);
          console.log("Failed Scores: " + ArrayUtils.arr2str(info.failedScores));

          if (info.problemId === info.totalProblems) {
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
}
