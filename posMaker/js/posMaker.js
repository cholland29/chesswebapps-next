// TODO
//
// Arrow KeyPress/Button/Functionality
// Chess font sizes

window.addEventListener("load",OnLoad,false);

var posMakerApp = null;

function OnLoad(e) {
   posMakerApp = canvasApp();
}

function canvasSupport() {
  return Modernizr.canvas;
}

function canvasApp() {

   var theCanvas = document.getElementById("canvas1");
   var context = theCanvas.getContext("2d");

   // Preferences
   var ss = 60; // square size
   var removeSelectionOnPiecePlacement = true;
   var keymapping = "quick";

   // DOM Elements we will be using to display information
   var canvasContainer = document.getElementById("canvasContainer");
   var pieceSelectionLabel = document.getElementById("pieceSelection");
   var editModeLabel = document.getElementById("editMode");
   var spriteSheetImg = document.getElementById("spriteSheet_"+ss+"_alpha");
   var linkPanel = document.getElementById("linkPanel");
   var instructionsTextArea = document.getElementById("instructionsTextArea");
   var analysisTextArea = document.getElementById("analysisTextArea");
   var analysisDisplay = document.getElementById("analysisDisplay");
   //var linkPanelList = document.getElementById("linkPanelList");

   var padding = [50,50,50,50];
   var CANVAS_WIDTH  = padding[1] + ss*8 + padding[3];
   var CANVAS_HEIGHT = padding[0] + ss*8 + padding[2];
   //var sprites = new SpriteCache("posMaker/images/spriteSheet_" + ss + "_alpha.png",ss,ss);
   var board = new Board(theCanvas,ss,padding,OnResourcesLoaded);
   var settings = new Settings_PosMaker(board);
   var mouseOffCanvas = false;
   var keyCodes;
   var problemCount = 0;
   var oldtag = null;
   var arrowPath = ""; // stores path that is currently being drawn (when in MODE_EDIT_ARROW mode in posMaker.js)

   var MODE_EDIT_PIECE = 0;
   var MODE_EDIT_ARROW = 1;
   var MODE_EDIT_SQUARE = 2;
   var allEditModes = [ MODE_EDIT_PIECE, MODE_EDIT_ARROW, MODE_EDIT_SQUARE ];
   var editMode = MODE_EDIT_PIECE;
   var recordingPgn = false;
   var mouseCoords = { x: 0, y: 0};
   var selectedPiece = null;
   var whiteSelected = true;
   // this.whitePieces;
   // this.blackPieces;

   // this.PIECE_ROOK   = 0;
   // this.PIECE_QUEEN  = 1;
   // this.PIECE_PAWN   = 2;
   // this.PIECE_KNIGHT = 3;
   // this.PIECE_KING   = 4;
   // this.PIECE_BISHOP = 5;

  function OnResourcesLoaded(e) {
      // We must wait for all of our resources to load before continuing on.
        //board = new Board(theCanvas,ss,padding,OnResourcesLoaded);
        initGame(ss);
  }

	function initGame(square_size) {

       theCanvas.width  = CANVAS_WIDTH;
       theCanvas.height = CANVAS_HEIGHT;

       var sheet = board.getSpriteSheet();
       spriteSheetImg.src = sheet.src;
       //spriteSheetImg.src = board.sprites.spriteSheet.src;
       spriteSheetImg.style.border = "1px dashed green";

       // var sprite;
       // whitePieces = new Array(6);
       // sprite = sprites.defineSprite("WhiteRook",0,0);   whitePieces[0] = new Piece("White","Rook",sprite);
       // sprite = sprites.defineSprite("WhiteQueen",1,0);  whitePieces[1] = new Piece("White","Queen",sprite);
       // sprite = sprites.defineSprite("WhitePawn",2,0);   whitePieces[2] = new Piece("White","Pawn",sprite);
       // sprite = sprites.defineSprite("WhiteKnight",3,0); whitePieces[3] = new Piece("White","Knight",sprite);
       // sprite = sprites.defineSprite("WhiteKing",0,1);   whitePieces[4] = new Piece("White","King",sprite);
       // sprite = sprites.defineSprite("WhiteBishop",1,1); whitePieces[5] = new Piece("White","Bishop",sprite);

       // blackPieces = new Array(6);
       // sprite = sprites.defineSprite("BlackRook",2,1);   blackPieces[0] = new Piece("Black","Rook",sprite);
       // sprite = sprites.defineSprite("BlackQueen",3,1);  blackPieces[1] = new Piece("Black","Queen",sprite);
       // sprite = sprites.defineSprite("BlackPawn",0,2);   blackPieces[2] = new Piece("Black","Pawn",sprite);
       // sprite = sprites.defineSprite("BlackKnight",1,2); blackPieces[3] = new Piece("Black","Knight",sprite);
       // sprite = sprites.defineSprite("BlackKing",2,2);   blackPieces[4] = new Piece("Black","King",sprite);
       // sprite = sprites.defineSprite("BlackBishop",3,2); blackPieces[5] = new Piece("Black","Bishop",sprite);

       // Setup event handlers
       theCanvas.addEventListener('mousemove',OnMouseMove,false);
       theCanvas.addEventListener('mouseout',OnMouseOut,false);
       theCanvas.addEventListener('mouseover',OnMouseIn,false);
       theCanvas.addEventListener('click',OnMouseClick,false);
       spriteSheetImg.addEventListener('click',OnSpriteSheetClick,false);

       // var startPosBut = document.getElementById("startPosition");
       // startPosBut.addEventListener('click',settings.OnStartPosButtonClick,false);
       var clearPosBut = document.getElementById("clearPosition");
       clearPosBut.addEventListener('click',OnClearPosButtonClick,false);
       var exportPngBut = document.getElementById("exportPng");
       exportPngBut.addEventListener('click',OnExportToPng,false);
       var removeArrowBut = document.getElementById("removeArrowBut");
       removeArrowBut.addEventListener('click',OnRemoveArrowClick,false);
       var saveFenBut = document.getElementById("saveFen");
       saveFenBut.addEventListener('click',OnSaveFen,false);
       var recordPgnBut = document.getElementById("recordPgn");
       recordPgnBut.addEventListener('click',OnRecordPgn,false);
       var loadFenTextfield = document.getElementById("fenLoader");
       console.log(loadFenTextfield);
       
       loadFenTextfield.addEventListener('change',OnFenTextfieldChange,false);
       loadFenTextfield.addEventListener('focus',createTextFocusFunc("Enter Fen"),false);
       loadFenTextfield.addEventListener('blur',createTextBlurFunc("Enter Fen"),false);

       instructionsTextArea.addEventListener('focus',createTextFocusFunc("Enter Instructions Here"),false);
       instructionsTextArea.addEventListener('blur',createTextBlurFunc("Enter Instructions Here"),false);

       analysisTextArea.addEventListener('focus',createTextFocusFunc("Enter Analysis Here"),false);
       analysisTextArea.addEventListener('blur',createTextBlurFunc("Enter Analysis Here"),false);

       setPieceSelection(null);

       defineKeyMap(keymapping);

       drawScreen();

	}

  this.loadFen = function( fenString ) {
     board.loadFen(fenString);
  };

  this.startPosition = function() {

      board.clearBoard();

      board.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

   }

	this.drawScreen = function() {

      context.fillStyle = "#FFFFFF";
      context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);

      //board.clearBackground(); // no need to do this if the entire canvas is cleared
		  board.drawSquares();
      board.drawBorder();
      board.drawArrows();
      board.drawBoardCoordinates();
      
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

      if (arrowPath.length > 0 && !mouseOffCanvas) {
         var ptrX = mouseCoords.x;
         var ptrY = mouseCoords.y;
         board.drawArrow(arrowPath,ptrX,ptrY);
      }
            
	};

  function setEditMode(mode) {
    if (editMode === MODE_EDIT_PIECE && mode !== MODE_EDIT_PIECE) {
      setPieceSelection(null);
    }
    if (editMode === MODE_EDIT_ARROW && mode !== MODE_EDIT_ARROW) {
      arrowPath = "";
    }
    editMode = mode;
    switch(editMode) {
      case MODE_EDIT_PIECE: editModeLabel.innerHTML = "Piece Placement Mode"; break;
      case MODE_EDIT_SQUARE: editModeLabel.innerHTML = "Highlight Squares Mode"; break;
      case MODE_EDIT_ARROW: editModeLabel.innerHTML = "Draw Arrow Mode"; break;
      default: break;
    }
    
  }

  function setPieceSelection(pce) {
     if (pce === null) {
        selectedPiece = null;
        pieceSelectionLabel.innerHTML = (whiteSelected?"White :":"Black :"); // No Piece Selected";
     } else {
        setEditMode(MODE_EDIT_PIECE);
        pieceSelectionLabel.innerHTML = pce.color + " : " + pce.name;
        selectedPiece = pce;
        whiteSelected = (pce.color === "White") ? true : false;
     }
  }

  function OnSpriteSheetClick(e) {
     var coords = {
        x: (e.clientX-spriteSheetImg.offsetLeft + self.pageXOffset),
        y: (e.clientY-spriteSheetImg.offsetTop + self.pageYOffset)
     }

     console.log("Sprite Sheet Click: " + coords.x + "," + coords.y);

     var sourceX = Math.floor(coords.x/ss);
     var sourceY = Math.floor(coords.y/ss);
     
     var p = findPieceInSheet(board.getWhitePieces(),sourceX,sourceY);
     if (p === null) {
        p = findPieceInSheet(board.getBlackPieces(),sourceX,sourceY);
     }
     setPieceSelection(p);

  }

  function findPieceInSheet( pieceList, sourceX, sourceY ) {
    for (var i = 0; i < pieceList.length ; i++) {
       if (sourceX === pieceList[i].sprite.sourceX && sourceY === pieceList[i].sprite.sourceY) {
          return pieceList[i];
       }
    }
    return null;
  }

   function OnMouseIn(e) {
     console.log("Mouse In!");
     mouseOffCanvas = false;
   }
   function OnMouseOut(e) {
     console.log("Mouse Out!");
     mouseOffCanvas = true;
     drawScreen();
   }
   function OnMouseClick(e) {
      mouseCoords.x = (e.clientX-theCanvas.offsetLeft) + self.pageXOffset;
      mouseCoords.y = (e.clientY-theCanvas.offsetTop) + self.pageYOffset;
      square = board.screenToSquare(mouseCoords.x,mouseCoords.y); 
      if (editMode === MODE_EDIT_PIECE && recordingPgn === true) {
        if (square === null) { // user clicked off the board somewhere
          setPieceSelection(null);
        } else if (selectedPiece === null) {
          selectedPiece = board.removePiece(square);
        } else {
          
          board.addPiece(selectedPiece,square);
          if (removeSelectionOnPiecePlacement) {
            setPieceSelection(null);
          }
        }
      } else if (editMode === MODE_EDIT_PIECE) { 
        if (square === null) { // user clicked off the board somewhere
          setPieceSelection(null);
        } else if (selectedPiece === null) {
          selectedPiece = board.removePiece(square);
        } else {
          board.addPiece(selectedPiece,square);
          if (removeSelectionOnPiecePlacement) {
            setPieceSelection(null);
          }
        }

      } else if (editMode === MODE_EDIT_SQUARE) { // highlight squares that are clicked
        console.log("Click in MODE_EDIT_SQUARE mode");
        if (square == null) { return; } // user clicked off the board somewhere
        if (square.isHighlighted()) {
          square.removeHighlight();
        } else {
          square.addHighlight(board.highlightColor);
        } 
      } else if (editMode === MODE_EDIT_ARROW) {
        if (square == null) { return; } // user clicked off the board somewhere
        console.log("Clicked Square: " + square.toAlgebraic());
        var newAlg = square.toAlgebraic();

        if (arrowPath.length > 0 && newAlg === arrowPath.substring(arrowPath.length-2)) {
           if (arrowPath.length === 2) { // user clicked on same square twice, which means he wants to get rid of arrow
               arrowPath = "";
           }
        } else {
            arrowPath = arrowPath + square.toAlgebraic();
        }
        
        if (!e.shiftKey && arrowPath.length > 2) {
          console.log("Sending new arrow to board");
          board.addArrow(arrowPath);
          arrowPath = "";
        }
      }
      
      drawScreen();
   }

   function OnMouseMove(e) {
      mouseCoords.x = (e.clientX-theCanvas.offsetLeft) + self.pageXOffset;
      mouseCoords.y = (e.clientY-theCanvas.offsetTop) + self.pageYOffset;
      drawScreen();
   }

   function OnClearPosButtonClick(e) {
      board.clearBoard();
      drawScreen();
   }

   function OnRemoveArrowClick(e) {
      board.popArrow();
      drawScreen();
   }

   function OnExportToPng(e) {
      //window.open(theCanvas.toDataURL(),"image1","left=0,top=0,width=" +
      //  theCanvas.width + ",height=" + theCanvas.height + ",toolbar=0,resizeable=0");
      var img = theCanvas.toDataURL();
      var el = document.createElement("img");
      el.src = img;
      document.body.appendChild(el);
   }

   function OnSaveFen(e) {
      var fulltext = "";
      var fen = board.convertToFen();
      var analysis = analysisTextArea.value;
      if (analysis !== null && analysis.length > 0) {
          fulltext = fen+"+-+-+"+analysis;
      } else {
          fulltext = fen;
      }
      pieceSelectionLabel.innerHTML = fulltext;
      console.log("Fen Created: " + fulltext);
      var instructions = instructionsTextArea.value;
      createProblem(++problemCount, "Problem " + problemCount,fulltext,instructions);
      
   }

   function OnRecordPgn(e) {
       recordingPgn = !recordingPgn;
       var recordPgnBut = document.getElementById("recordPgn");
       if (recordingPgn) {
          recordPgnBut.innerHTML = "Record PGN: ON";
       } else {
          recordPgnBut.innerHTML = "Record PGN: OFF";
       }
       
   }

   // Create a new problem to be added to the linkPanelList
   function createProblem( problemId, problemText, value, instructionsText ) {

      var div =document.createElement("div");
      div.setAttribute("class","problemContainer");

      var problemDiv = document.createElement("div")
      problemDiv.innerHTML = problemText;
      problemDiv.value = value;
      problemDiv.setAttribute("class","problem");
      problemDiv.setAttribute("id","Problem-"+problemId);
      problemDiv.addEventListener('click',OnClickProblem,false);

      var instructionsDiv =document.createElement("div");
      instructionsDiv.className = "instructions";
      instructionsDiv.setAttribute("class","instructions");
      instructionsDiv.setAttribute("id","Instructions-"+problemCount);
      instructionsDiv.innerHTML = instructionsText;
      instructionsDiv.style.display = "none";

      div.appendChild(problemDiv);
      div.appendChild(instructionsDiv);
      linkPanel.appendChild(div);
      linkPanel.style.display = "block";

      analysisTextArea.value = value;
   }

   function OnClickProblem(e) {

    // Problem Format:
    // fen<delim>gameId<delim>analysis
    var delim = "+-+-+";
    var target = e.target;
    var fulltext = target.value;
    var idx = fulltext.indexOf(delim);
    var parsedFen = "";
    var parsedAnalysis = "";
    var toks = fulltext.split(delim);
    for (var i=0; i < toks.length; i++) {
       console.log("Token " + i + ": " + toks[i]);
    }
    if (idx !== -1) {
        parsedFen = fulltext.substring(0,idx);
        parsedAnalysis = fulltext.substring(idx+delim.length);
    } else {
        parsedFen = fulltext;
    }
    console.log("Full Text: " + fulltext);
    console.log("Parsed Fen: " + parsedFen);
    console.log("Parsed Analysis: "+ parsedAnalysis);
    board.loadFen(parsedFen);
    drawScreen();
    analysisDisplay.innerHTML = parsedAnalysis;

    var id = target.id;
    var dashIdx = id.indexOf("-");
    var idVal = id.substring(dashIdx+1); // parses off the number value at end of id tag
    var tag = "#Instructions-"+idVal;
    $(tag).slideToggle("fast");
    if ( oldtag !== null && oldtag !== tag) {
       $(oldtag).slideToggle("fast");
    }
    oldtag = (oldtag === tag ? null : tag);
   }

   function createTextFocusFunc(idleText) {
      return function(e) {
          var target = e.target;
          target.style.background="#F6F7F0";
          target.style.color="black";
          target.style.fontStyle = "normal";
          if (target.value.trim() === idleText) {
              target.value = "";
          }
          document.onkeydown = null;
      };
   };
   function createTextBlurFunc(idleText) {
      return function(e) {
          var target = e.target;
          target.style.background="white"
          target.style.color="gray";
          target.style.fontStyle = "italic";
          if (target.value.trim() === "") {
              target.value = idleText;
          }
          document.onkeydown = OnKeyDown;
      };
   };

   function OnFenTextfieldFocus(e) {
       console.log("Textfield Focus");

       var target = e.target;
       target.style.background="#F6F7F0";
       if (target.value === "Enter Fen") {
          target.value = "";

       }
      document.onkeydown = null;

      $('#fenLoader').keydown(function (e){
         if(e.keyCode === 13){
            loadFen(target.value);
         }
      });
   }

   function OnFenTextfieldBlur(e) {
       console.log("Losing Textfield Focus");

       var target = e.target;
       target.style.background="white"
       if (target.value === "") {
          target.value = "Enter Fen";
       }
       document.onkeydown = OnKeyDown;
       $('#fenLoader').unbind('keydown');
   }

   function OnFenTextfieldChange(e) {
       var target = e.target;
       console.log("Textfield Changing");
       console.log(target.value);
       board.loadFen(target.value);
       drawScreen();
   }

   function defineKeyMap(mapping) {
    
    if( mapping === "quick") {
      keyCodes = {
         modeChange        : 192, // ~
         desselectPiece    : 27, // escape
         clearBoard        : 189, // -
         selectWhitePieces : 49, // 1
         selectBlackPieces : 50, // 2
         selectPawn        : 81, // q
         selectKnight      : 87, // w
         selectBishop      : 69, // e
         selectRook        : 65, // r
         selectQueen       : 83, // t
         selectKing        : 68  // y
       }; 
    } else if( mapping === "qwerty") {
      keyCodes = {
         modeChange        : 192, // ~
         desselectPiece    : 27, // escape
         clearBoard        : 189, // -
         selectWhitePieces : 49, // 1
         selectBlackPieces : 50, // 2
         selectPawn        : 81, // q
         selectKnight      : 87, // w
         selectBishop      : 69, // e
         selectRook        : 82, // r
         selectQueen       : 84, // t
         selectKing        : 89  // y
       };
    } else { // "default"
      keyCodes = {
         modeChange        : 192, // ~
         desselectPiece    : 27, // escape
         clearBoard        : 189, // -
         selectWhitePieces : 49, // 1
         selectBlackPieces : 50, // 2
         selectPawn        : 80, // p
         selectKnight      : 78, // n
         selectBishop      : 66, // b
         selectRook        : 82, // r
         selectQueen       : 81, // q
         selectKing        : 75  // k
       };
    }
 }

 function OnKeyDown(e) {
    e = e?e:window.event;
      console.log(e.keyCode + "down");
      var pieceName = "";

      switch(e.keyCode) {
         case keyCodes.modeChange: // '~' for changing modes
            setEditMode(allEditModes[(editMode+1)%allEditModes.length]);
         case keyCodes.desselectPiece: // 'escape' for desselect piece
            setPieceSelection(null);
            pieceName = "";
            arrowPath = "";
            break;
         case keyCodes.clearBoard: // '0' clear entire board
            board.clearBoard();
         case keyCodes.selectWhitePieces: // '1' for white pieces
            whiteSelected = !whiteSelected;
            pieceName = (selectedPiece===null?"":selectedPiece.name);
            break;
         case keyCodes.selectBlackPieces: // '2' for black pieces
            whiteSelected = false; 
            pieceName = (selectedPiece===null?"":selectedPiece.name);
            break;
         case keyCodes.selectKing: // 'k' for king
            pieceName = "King"; break;
         case keyCodes.selectRook: // 'r' for rook
            pieceName = "Rook"; break;
         case keyCodes.selectPawn: // 'p' for pawn
            pieceName = "Pawn"; break;
         case keyCodes.selectBishop: // 'b' for bishop
            pieceName = "Bishop"; break;
         case keyCodes.selectQueen: // 'q' for queen
            pieceName = "Queen"; break;
         case keyCodes.selectKnight: // 'n' for knight
            pieceName = "Knight"; break;
         default:
             break;
      }
      console.log("Selected Piece Type: " + (whiteSelected?"White ":"Black ") + pieceName);

      var team = (whiteSelected?board.getWhitePieces():board.getBlackPieces());
      if (pieceName === "") {
        setPieceSelection(null);
      } else {
         for (var i = 0; i < team.length ;i++) {
            if (team[i].name === pieceName) {
               setPieceSelection(team[i]);
            }
         }
      }

      drawScreen();
 }

 document.onkeydown = OnKeyDown;

	//initGame(ss);
}
