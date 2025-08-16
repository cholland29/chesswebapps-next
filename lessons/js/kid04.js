$(document).ready( init_kid04 );

// Exercise Mode:
//
// On answer
//    Show if correct/incorrect right away. Give feedback
//    Score tallied on first answer after that has no effect on score
//
// Test Mode: (This is what is currently implemented)
//
// On answer
//    Show selection only
// OnTestSubmit
//    Show correct/incorrect and feedback.
//    Score tallied based on all answers.

var lessonId = 4;
if (lessonId < 10) {
	lessonId = "0" + lessonId;
}
var answers = [1,0,1,0,0,1,1,0,0,1]; // 1 is checkmate, 0 is stalemate
var responders = [];
var score = [];
var totalScore = 0;
var nProblems = answers.length;

function init_kid04() {

    for (var i = 1 ; i <= nProblems ; i++ ) {
    	var prob = i;
    	if (i < 10) {
    		prob = "0" + prob;
    	}

      score[i-1] = -1; // -1 means the problem hasn't been answered yet
      responders[i-1] = "response_"+lessonId+"_"+prob;

	    var rowId = "row" + prob;
  		var imgName = "pos"+prob+".png";
  		var buttonPanelId = "buttonPanel"+prob;
  		$("table").append("<tr id=\""+rowId+"\"></tr>");
  		$("#"+rowId).append("<td><div class='problemTitle' id='Problem "+i+"'>Problem "+i+"</div><img id='"+imgName+"'' src=\"img/"+lessonId+"/"+imgName+"\" /></td>");
  		$("#"+rowId).append("<td><div id=\""+buttonPanelId+"\"></div></td>");
  		$("#"+buttonPanelId).addClass("answerContainer");


  		var checkmateButtonId = "button_checkmate_"+lessonId+"_"+prob;
  		var stalemateButtonId = "button_stalemate_"+lessonId+"_"+prob;
      var nextButtonId = "button_next_"+lessonId+"_"+prob;

      // Add Checkmate Button
  		$("#"+buttonPanelId).append("<div id=\""+checkmateButtonId+"\">Checkmate</div>");
  		$("#"+checkmateButtonId).addClass("button");
      $("#"+checkmateButtonId).click(onCheckMate);

      // Add Stalemate Button
  		$("#"+buttonPanelId).append("<div id=\""+stalemateButtonId+"\">Stalemate</div>");
  		$("#"+stalemateButtonId).addClass("button");
      $("#"+stalemateButtonId).click(onStaleMate);

      // Add Next/Prev Buttons
      if (i <= nProblems) {
        if (i < nProblems) {
          nextProb = (i+1);
          nextProbId = "Problem " + nextProb;
          $("#"+buttonPanelId).append("<a href='#"+nextProbId+"'>Next Problem</a>");
        }
        if (i > 1) {
          prevProb = (i-1);
          prevProbId = "Problem " + prevProb;
          $("#"+buttonPanelId).append("<a href='#"+prevProbId+"'>Prev Problem</a>");
        }
      }
  		
    }


    // $( "input" ).focus(function() {
    //     $( this ).next( "span" ).css( "display", "inline" ).fadeOut( 15000 );
    // });
    
    $("#submitTestButton").click(function(){

        var studentName = $('input[name=studentName]').val();
        if (studentName.length == 0) {
           // alert("Fill in name field first at top of page!");
           // $('input[name=studentName]').focus();
           document.getElementById("studentNameTextfield").focus();
           $( "#studentNameTextfield" ).next( "span" ).css( "display", "inline" ).fadeOut( 15000 );
           return;
        }
        totalScore = 0;
        for (var i = 0; i < nProblems ; i++) {
            if (score[i] >= 0) {
               var probStr = (i+1);
               if (probStr < 10) {
                   probStr = "0" + probStr;
               }

               // Make all button borders red if incorrect and green if correct
               if (score[i] >= 0) {
                   var checkmateButtonId = "#button_checkmate_" + lessonId + "_" + probStr;
                   var stalemateButtonId = "#button_stalemate_" + lessonId + "_" + probStr;
                   if (score[i] == 1) {
                       if (answers[i] == 1) { // checkmate
                          $(checkmateButtonId).css('border-color','#00FF00');
                       } else {
                          $(stalemateButtonId).css('border-color','#00FF00');
                       }
                   } else if (score[i] == 0) {
                       if (answers[i] == 1) { // checkmate
                          $(stalemateButtonId).css('border-color','#FF0000');
                       } else {
                          $(checkmateButtonId).css('border-color','#FF0000');
                       }
                   }
               }

               totalScore += score[i];
               // var responseDivId = "#response_" + lessonId + "_" + probStr;
               // if (score[i] == 0) {
               //    $(responseDivId).html("Incorrect :(");
               // } else if (score[i] == 1) {
               //    $(responseDivId).html("Correct!");
               // }
            }

        }
        
        $.post("php/submitTest.php",
		    {
          lessonId: lessonId,
          student: studentName,
          nProblems: nProblems,
  		    totalScore: totalScore,
          score: score,
		    },
		    function(){
          var msg = "";
          if (totalScore == nProblems) {
            msg = "Well Done!! Perfect Score!! ";
          } else if (totalScore >= (nProblems * .80)) {
            msg = "Nice Job! ";
          } else {
            msg = "Nice try, but I know you can do better!!! Put on your thinking cap and try again. ";
          }

          $("#feedbackPanel").html(msg + "\nTest Scored: " + totalScore + "/" + nProblems);
          // $("#submitTestButton").after("You Scored " + totalScore + "/" + nProblems);
          document.getElementById("instructions").focus();
  		    console.log("post finished");
		    });
	});
}

function onNext(e) {
  var prob = getProblemIdFromButtonId(e.target.id);
  var probStr = getProblemIdStringFromButtonId( e.target.id );
  console.log("Next! Problem: " + prob);
}

function onCheckMate(e) {
   console.log("Checkmate!");

   var prob = getProblemIdFromButtonId(e.target.id);
   var probStr = getProblemIdStringFromButtonId( e.target.id );

   var checkmateButtonId = "#button_checkmate_" + lessonId + "_" + probStr;
   var stalemateButtonId = "#button_stalemate_" + lessonId + "_" + probStr;

   $(checkmateButtonId).addClass("buttonSelected");
   $(stalemateButtonId).removeClass("buttonSelected");

   if (answers[prob-1] == 1) {
       // d.innerHTML = "Correct";
       score[prob-1] = 1;
   } else {
   	   // d.innerHTML = "Incorrect";
       score[prob-1] = 0;
   }
}

function onStaleMate(e) {
   console.log("Stalemate!");

   var prob = getProblemIdFromButtonId(e.target.id);
   var probStr = getProblemIdStringFromButtonId( e.target.id );

   var checkmateButtonId = "#button_checkmate_" + lessonId + "_" + probStr;
   var stalemateButtonId = "#button_stalemate_" + lessonId + "_" + probStr;

   $(checkmateButtonId).removeClass("buttonSelected");
   $(stalemateButtonId).addClass("buttonSelected");

   if (answers[prob-1] == 0) {
       // d.innerHTML = "Correct";
       score[prob-1] = 1;
   } else {
   	   // d.innerHTML = "Incorrect";
       score[prob-1] = 0;
   }
}

function getProblemIdFromButtonId( id ) {
   var problemNumStr = getProblemIdStringFromButtonId( id );
   var problemNum = parseInt(problemNumStr);
   return problemNum;
}

function getProblemIdStringFromButtonId( id ) {
   var idx = id.lastIndexOf("_");
   var problemNumStr = id.substr(idx+1);
   return problemNumStr;
}
