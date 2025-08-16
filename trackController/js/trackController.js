// $(document).ready( trackController );

var debugOn = true; // global var
var ss = 60; // square size
var CANVAS_PADDING = [50,50,50,50];
var CANVAS_WIDTH  = CANVAS_PADDING[1] + ss*8 + CANVAS_PADDING[3];
var CANVAS_HEIGHT = CANVAS_PADDING[0] + ss*8 + CANVAS_PADDING[2];


function canvasSupport() {
  return Modernizr.canvas;
}

function trackController( initialTrack ) {

    var theCanvas = document.getElementById("canvas1");
    var context = theCanvas.getContext("2d");

    var ss = 60; // square size
    var padding = [50,50,50,50];
    var CANVAS_WIDTH  = padding[1] + ss*8 + padding[3];
    var CANVAS_HEIGHT = padding[0] + ss*8 + padding[2];
    var board = new Board(theCanvas,ss,padding,OnResourcesLoaded);
    var curApp = null;
    var oldtag = null;
    var lastProblemId = null;
    var curTrack = initialTrack;

    // DOM elements
    var problemListPanel = document.getElementById("problemListPanel");
    var analysisDisplay = document.getElementById("analysisDisplay");

    // Images
    var lockedImgSrc = "trackController/images/lock.png";
    var completeImgSrc = "trackController/images/smiley.png";

    function OnResourcesLoaded(e) {
        // We must wait for all of our resources to load before continuing on.
        initTrackController();
        console.log("Loading Track: " + curTrack.id);
        loadTrack(curTrack);
    }

    function initTrackController() {

        theCanvas.width  = CANVAS_WIDTH;
        theCanvas.height = CANVAS_HEIGHT;

    }

    function loadTrack( intialTrack ) {

        createTrack( intialTrack );

        $("#Problem-1").click();
        lastProblemId = 1;

    }

   function createTrack( track ) {

       var trackTitle = track.trackTitle;
       var trackAuthor = track.author;
       var problemSet = track.problemSet;
       var trackTitleDiv = document.createElement("h2");
       trackTitleDiv.setAttribute("class","trackTitle");
       trackTitleDiv.innerHTML = trackTitle;
       problemListPanel.appendChild(trackTitleDiv);

       var trackAuthorDiv = document.createElement("div");
       trackAuthorDiv.setAttribute("class","trackAuthor");
       trackAuthorDiv.innerHTML = "Course written by " + trackAuthor;
       problemListPanel.appendChild(trackAuthorDiv);
       
       var probVars;
       for (var i=0; i<problemSet.length; i++) {
           probVars = parseProblem(problemSet[i]);
           createProblem( probVars );
       }
   }

   function parseProblem(fulltext) {

      // Problem Format:
      // trackId<delim>probId<delim>fen<delim>instructions<delim>analysis

      var delim = "-----";
      var tok = fulltext.split(delim);

      var probVars = {
          fulltext     : fulltext,
          trackId      : tok[0],
          problemId    : tok[1],
          fen          : tok[2],
          instructions : tok[3],
          analysis     : tok[4]
      };

      return probVars;
  }

    // Create a new problem to be added to the linkPanelList
   function createProblem( probVars ) {

      console.log("createProblem called : " + probVars.problemId);
      var problemId = probVars.problemId;
      var problemText = "Exercise " + probVars.problemId;
      var value = probVars.fulltext;
      var instructionsText = probVars.instructions;

      var div =document.createElement("div");
      div.setAttribute("class","problemContainer");

      // This is the problem button
      var problemDiv = document.createElement("div");
      problemDiv.innerHTML = problemText;
      problemDiv.value = value;
      problemDiv.setAttribute("class","problem");
      problemDiv.setAttribute("id","Problem-"+problemId);
      
      // This is the div displayed once the user clicks on the button
      var instructionsDiv =document.createElement("div");
      instructionsDiv.className = "instructions";
      instructionsDiv.setAttribute("class","instructions");
      instructionsDiv.setAttribute("id","Instructions-"+problemId);
      instructionsDiv.innerHTML = instructionsText;
      instructionsDiv.style.display = "none";

      div.appendChild(problemDiv);
      div.appendChild(instructionsDiv);
      problemListPanel.appendChild(div);
      problemListPanel.style.display = "block";

      var idStr = "Problem-"+problemId;
      var $jqueryProblemDiv = $('#'+idStr);
      var $img = $('<img />').attr({ 'id': idStr+'-img', 'src': 'trackController/images/lock.png', 'alt':'MyAlt' }).appendTo($('#Problem-'+problemId));

      // ------ problem div states
      // If locked -> gray
      // If unlocked and active -> red
      // If unlocked and not active and not complete -> blue
      // If unlocked and not active and complete -> green
      // ------ img states
      // If locked -> lock.png
      // If unlocked and not complete -> hidden
      // If unlocked and complete -> smiley face or check mark

      if (problemId > 1) {
          $img.addClass((debugOn ? "problemImgUnlocked" : "problemImgLocked"));
          $jqueryProblemDiv.addClass((debugOn ? "problemUnlocked" : "problemLocked"));
      } else {
          $img.addClass("problemImgUnlocked");
          $img.addClass("problemImgActive");
          $jqueryProblemDiv.addClass("problemUnlocked");
          $jqueryProblemDiv.addClass("problemActive");

      }
      if ($jqueryProblemDiv.hasClass("problemUnlocked")) {
          $jqueryProblemDiv.click(OnClickProblem);
          // problemDiv.addEventListener('click',OnClickProblem,false);
      }

   }
	
	function OnClickProblem(e) {

        var target = e.target;
        var fulltext = target.value;
        
        console.log("OnClickProblem()");

        probVars = parseProblem(fulltext);
        console.log("problemId: " + probVars.problemId);
        console.log("lastProblemId: " + lastProblemId);

        var idMatch = (probVars.problemId === lastProblemId);
        if (!idMatch) {
            deactivateProblem(lastProblemId);
            activateProblem(probVars.problemId);
            lastProblemId = probVars.problemId;
        }

        if (curApp === null) {
            curApp = curTrack.problemController(board);
        }
        curApp.setProblem(probVars, OnStageChange);
        // analysisDisplay.innerHTML = probVars.analysis;
        // testPgnParser();

        var id = target.id;
        var dashIdx = id.indexOf("-");
        var idVal = id.substring(dashIdx+1); // parses off the number value at end of id tag
        var tag = "#Instructions-"+idVal;

        console.log("tag: " + tag);
        console.log("oldtag: " + oldtag);
        if (!idMatch) {
            console.log('Sliding tag: ' + tag);
            $(tag).slideToggle("fast");
        
            if ( oldtag !== null && oldtag !== tag) {
                console.log('Sliding oldtag: ' + oldtag);
                $(oldtag).slideToggle("fast");
            }
        }

        oldtag = tag;

  }

  function OnStageChange( info ) {
      // This function will be called when the current game's stage changes

      gameObj = curApp.getGameObject();

      if (info.stageVal === gameObj.stageVals.GAME_COMPLETE) {
          if (info.advance) {
              console.log("He advances!!!");
              // $("#Problem-"+info.problemId).css('background-color','green');
              completeProblem(info.problemId);
              unlockProblem(info.problemId+1);
          }
          curApp.OnTrackComplete(info);
      }
  }

  function activateProblem( problemId ) {
      var idStr = "Problem-"+problemId;
      console.log("activating problem: " + idStr);

      // This is the button that is clicked
      var problemDiv = $('#'+idStr);
      problemDiv.addClass("problemActive");

      // Now fix the img stuff
      var imgIdStr = idStr+"-img";
      img = $('#'+imgIdStr);
      // img.addClass("problemActive");

  }
  function deactivateProblem( problemId ) {
      var idStr = "Problem-"+problemId;
      console.log("deactivating problem: " + idStr);

      // This is the button that is clicked
      var problemDiv = $('#'+idStr);
      problemDiv.removeClass("problemActive");

      // Now fix the img stuff
      var imgIdStr = idStr+"-img";
      img = $('#'+imgIdStr);
      img.removeClass("problemActive");

  }
  function completeProblem( problemId ) {
      var idStr = "Problem-"+problemId;
      console.log("completing problem: " + idStr);

      // This is the button that is clicked
      var problemDiv = $('#'+idStr);
      problemDiv.addClass("problemComplete");

      // Now fix the img stuff
      var imgIdStr = idStr+"-img";
      img = $('#'+imgIdStr);
      img.addClass("problemImgComplete");
      img.attr('src', completeImgSrc);
  }

  function unlockProblem( problemId ) {
      var idStr = "Problem-"+problemId;
      console.log("unlocking problem: " + idStr);

      // This is the button that is clicked
      var problemDiv = $('#'+idStr);
      problemDiv.removeClass("problemLocked");
      problemDiv.addClass("problemUnlocked");
      problemDiv.click(OnClickProblem);

      // Now fix the img stuff
      var imgIdStr = idStr+"-img";
      img = $('#'+imgIdStr);
      img.removeClass("problemImgLocked");
      img.addClass("problemImgUnlocked");
  }

}
