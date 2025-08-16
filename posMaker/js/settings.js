function Settings_PosMaker(board) {
  var board = board;
  var darkColorPicker  = document.getElementById("darkSquareColorPicker");
  var lightColorPicker = document.getElementById("lightSquareColorPicker");
  var highlightColorPicker = document.getElementById("highlightSquareColorPicker");
  var arrowHeadColorPicker = document.getElementById("arrowHeadColorPicker");
  var arrowStemColorPicker = document.getElementById("arrowStemColorPicker");
  var arrowStemWidth = document.getElementById("arrowStemWidth");
  var arrowTransparency = document.getElementById("arrowTransparency");
  var arrowHeadTypeSelect = document.getElementById("arrowHeadTypeSelect");
  var arrowHeadLength = document.getElementById("arrowHeadLength");
  var arrowHeadDegree = document.getElementById("arrowHeadDegree");
  var selectAlgCoords = document.getElementById("selectAlgCoords");
  var flipBoardChkBox = document.getElementById("flipBoard");
  var startPosBut = document.getElementById("startPosition");
       

  var hookUpEvents = function () {

     $("#boardSettingsPanel").hide();
     $("#boardSettingsFlip").click(function(){
         $("#boardSettingsPanel").slideToggle("fast");
       });

     $("#highlightSettingsPanel").hide();
     $("#highlightSettingsFlip").click(function(){
         $("#highlightSettingsPanel").slideToggle("fast");
       });

     $("#arrowSettingsPanel").hide();
     $("#arrowSettingsFlip").click(function(){
         $("#arrowSettingsPanel").slideToggle("fast");
       });

     darkColorPicker.addEventListener('change',OnDarkSquareColorChange,false);
     lightColorPicker.addEventListener('change',OnLightSquareColorChange,false);
     highlightColorPicker.addEventListener('change',OnHighlightSquareColorChange,false);
     arrowHeadColorPicker.addEventListener('change',OnArrowHeadColorChange,false);
     arrowStemColorPicker.addEventListener('change',OnArrowStemColorChange,false);
     arrowStemWidth.addEventListener('change',OnArrowStemWidthChange,false);
     arrowTransparency.addEventListener('change',OnArrowTransparencyChange,false);
     arrowHeadTypeSelect.addEventListener('change',OnArrowHeadTypeChange,false);
     arrowHeadLength.addEventListener('change',OnArrowHeadLengthChange,false);
     arrowHeadDegree.addEventListener('change',OnArrowHeadDegreeChange,false);
     selectAlgCoords.addEventListener('change',OnSelectAlgCoords,false);
     flipBoardChkBox.addEventListener('change',OnFlipBoard,false);
     startPosBut.addEventListener('click',OnStartPosButtonClick,false);
  };

  function OnStartPosButtonClick(e) {
      console.log("egesrigheiraeirgi")
      startPosition();
      drawScreen();
   }

  function OnDarkSquareColorChange(e) {
    var target = e.target;
    board.setDarkColor("#" + target.value);
    drawScreen();
  }

  function OnLightSquareColorChange(e) {
    var target = e.target;
    board.setLightColor("#" + target.value);
    drawScreen();
  }

  function OnHighlightSquareColorChange(e) {
    var target = e.target;
    board.setHighlightColor("#" + target.value);
    console.log("New Highlight Color: " + "#" + target.value);
    drawScreen();
  }

  function OnArrowHeadColorChange(e) {
    var target = e.target;
    board.setArrowHeadColor("#" + target.value);
    console.log("New Arrow Head Color: " + "#" + target.value);
    drawScreen();
  }

  function OnArrowStemColorChange(e) {
    var target = e.target;
    board.setArrowStemColor("#" + target.value);
    console.log("New Arrow Stem Color: " + "#" + target.value);
    drawScreen();
  }

  function OnArrowStemWidthChange(e) {
    var target = e.target;
    board.setArrowStemWidth(target.value*1.0);
    console.log("New Arrow Stem Width: " + target.value*1.0);
    drawScreen();
  }

  function OnArrowTransparencyChange(e) {
    var target = e.target;
    board.setArrowTransparency(target.value*1.0);
    console.log("New Arrow Transparency: " + target.value*1.0);
    drawScreen();
  }

  function OnArrowHeadTypeChange(e) {
    var target = e.target;
    var selection = target.value;
    board.setArrowHeadType(selection);
    drawScreen();
  }

  function OnArrowHeadLengthChange(e) {
    var target = e.target;
    board.setArrowHeadLength(target.value);
    console.log("New Arrow Head Length: " + target.value);
    drawScreen();
  }

  function OnArrowHeadDegreeChange(e) {
    var target = e.target;
    board.setArrowHeadDegree(target.value*1.0);
    console.log("New Arrow Head Degree: " + target.value*1.0);
    drawScreen();
  }

  function OnSelectAlgCoords(e) {
    var target = e.target;
    var selection = target.value;
    board.setDrawBoardCoords(selection);
    drawScreen();
  }

  function OnFlipBoard(e) {
    var target = e.target;
    var flipped = target.checked;
    board.setBoardFlipped(flipped);
    drawScreen();
  }
  
  hookUpEvents();
}