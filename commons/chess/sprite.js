function Sprite(key, spriteSheet, i, j) {
   'use strict';
   this.key = key;
   this.sheet = spriteSheet;
   this.sourceX = i;
   this.sourceY = j;
}

function SpriteCache(imgName, spriteWidth, spriteHeight, OnSheetLoaded) {

   'use strict';
   this.spriteSheet = new Image();
   this.spriteSheet.src = imgName;
   this.spriteSheet.onload = sheetLoaded;

   var i, j, nrow, ncol, allSprites;
   var that = this; // so that sheetLoaded will be bound to this object instead of window instance

   function sheetLoaded(e) {
       console.log("spriteSheet imgName: " + imgName);
       console.log("spriteSheet width: " + that.spriteSheet.width);
       console.log("spriteSheet height: " + that.spriteSheet.height);

       nrow = Math.floor(that.spriteSheet.height / spriteHeight);
       ncol = Math.floor(that.spriteSheet.width / spriteWidth);
       allSprites = [];

       for (i = 0; i < nrow; i++) {
          allSprites[i] = [];
          for (j = 0; j < ncol; j++) {
             allSprites[i][j] = null;
          }
       }

       OnSheetLoaded(e);
   }

   this.defineSprite = function (key, sourceX, sourceY) {
      allSprites[sourceX][sourceY] = key;
      return new Sprite(key, this.spriteSheet, sourceX, sourceY);
   };

   this.getSpriteKey = function (sourceX, sourceY) {
      return allSprites[sourceX][sourceY];
   };

   this.getSprite = function (key) {
      for (i = 0; i < allSprites.length; i++) {
         for (j = 0; j < allSprites.length; j++) {
            if (allSprites[i][j] === key) {
               return new Sprite(key, this.spriteSheet, i, j);//{ sheet: spriteSheet, sourceX: i, sourceY: j};
            }
         }
      }
   };
}
