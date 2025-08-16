function CanvasUtils() {

    this.canYouSeeThis = function (scope) {
       console.log("Yes! You can see CanvasUtils from this scope: " + scope);
    };

    //-------------------------------------------------------------------------------------
    this.getTextHeight = function(font) {

        var text = $('<span style="font: ' + font + '">Hg</span>');
        var block = $('<div style="display: inline-block; width: 1px; height: 0px;"></div>');

        var div = $('<div></div>');
        div.append(text, block);

        var body = $('body');
        body.append(div);

        try {

            var result = {};

            block.css({ verticalAlign: 'baseline' });
            result.ascent = block.offset().top - text.offset().top;

            block.css({ verticalAlign: 'bottom' });
            result.height = block.offset().top - text.offset().top;

            result.descent = result.height - result.ascent;

        } finally {
            div.remove();
        }

        return result;
    };

    /**
     * Draws a text rounded rectangle
     * @param {CanvasRenderingContext2D} ctx
     * @param {array}  bounds Array of chessboard rect bounds [x,y,w,h]
     * @param {array}  text Array of strings
     * @param {object} textProps Array of structs (each line of text gets their own props)
     * @param {object} rectProps Struct defining key values needed to style the inner and outer rect
     */
    this.drawTextPanel=function(ctx,bounds,text,textProps,rectProps) {

        var font = null, lastFont = null, lineHeight = 0, lineWidth = 0, totalHeight = 0, maxWidth = -1;

        ctx.save();

        // First we have figure out the dimensions of the panel
        textProps.lineHeight = [];
        textProps.lineWidth = [];
        for (var i = 0 ; i < text.length ;i++) {

            // Measure height of next line and add to total
            lastFont = font;
            font = textProps[i].font;
            if (lastFont !== font) {
                lineHeight = this.getTextHeight(font).height;
            }
            totalHeight += lineHeight;
            textProps[i].lineHeight = lineHeight;

            // Measure width of next line and compare to maxWidth
            ctx.font = font;
            lineWidth  = ctx.measureText(text[i]).width;
            if (lineWidth > maxWidth) {
                maxWidth = lineWidth;
            }
            textProps[i].lineWidth = lineWidth;
        }
        maxWidth    += (rectProps.padding[1] + rectProps.padding[3]);
        totalHeight += (rectProps.padding[0] + rectProps.padding[2]);

        // Draw filled inner rect
        var radius = 5;
        var x = bounds[0] + (bounds[2]-maxWidth)/2;
        var y = bounds[1] + (bounds[3])/2 - totalHeight;
        var w = maxWidth;
        var h = totalHeight;
        ctx.fillStyle = rectProps.innerFillStyle;//"#1AD920";
        this.roundRect(ctx,x,y,w,h,radius,true,false);
     
        // Draw stroked outer rect
        ctx.fillStyle = rectProps.outerFillStyle;//"#1AD920";
        ctx.lineWidth = rectProps.lineWidth;
        this.roundRect(ctx,x,y,w,h,radius,false,true);

        // Draw text
        x = bounds[0] + bounds[2]/2;
        y = bounds[1] + bounds[3]/2 - rectProps.padding[2];
        for (var i = text.length-1 ; i >= 0 ; i--) {
            y = y - textProps[i].lineHeight;
            ctx.fillStyle    = textProps[i].fillStyle;
            ctx.textAlign    = textProps[i].textAlign;
            ctx.textBaseline = textProps[i].textBaseline;
            ctx.font         = textProps[i].font;
            ctx.fillText(text[i], x, y);
        }

        ctx.restore();
        
    };

    this.drawButton=function(ctx,x,y,w,h,text,textProps,rectProps) {

        // x,y : button is centered on this point
        
        ctx.save();

        // Draw filled inner rect
        var radius = 5;
        ctx.fillStyle = rectProps.innerFillStyle;//"#1AD920";
        this.roundRect(ctx,x,y,w,h,radius,true,false);

        // Draw stroked outer rect
        ctx.strokeStyle = rectProps.outerFillStyle;//"#000000";
        ctx.lineWidth = 2;
        this.roundRect(ctx,x,y,w,h,radius,false,true);

        // Draw label
        ctx.font = textProps.font;
        ctx.lineWidth = 1;
        ctx.fillStyle = "#000000";
        ctx.textAlign = 'left';
        ctx.fillText(text,x+textProps.padding[3],y);

        ctx.restore();

    }

    /**
     * Draws a rounded rectangle using the current state of the canvas. 
     * If you omit the last three params, it will draw a rectangle 
     * outline with a 5 pixel border radius 
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate 
     * @param {Number} width The width of the rectangle 
     * @param {Number} height The height of the rectangle
     * @param {Number} radius The corner radius. Defaults to 5;
     * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
     * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
     */
    this.roundRect=function(ctx, x, y, width, height, radius, fill, stroke) {
      if (typeof stroke == "undefined" ) {
        stroke = true;
      }
      if (typeof radius === "undefined") {
        radius = 5;
      }
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      if (stroke) {
        ctx.stroke();
      }
      if (fill) {
        ctx.fill();
      }        
    }

    this.ptInRect=function(pt,rect) {
        //console.log("pt.x: " + pt.x);
        //console.log("pt.y: " + pt.y);
        //console.log("rect: " + rect);
        if (pt.x >= rect[0] && pt.x <= rect[0] + rect[2]) {
            if (pt.y >= rect[1] && pt.y <= rect[1] + rect[3]) {
                return true;
            }
        }
        return false;
    };

    this.drawLine=function(ctx,x1,y1,x2,y2) {
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.closePath();
        ctx.stroke();
    };

    /*
     * This code came from here:
     * Look http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html
     */
    this.drawArrowHead=function(ctx,x0,y0,x1,y1,x2,y2,style) {
        'use strict';
        // all cases do this.
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0,y0);
        ctx.lineTo(x1,y1);
        ctx.lineTo(x2,y2);
        switch(style) {
            case 0:
            // unfilled head, just stroke.
                ctx.stroke();
                break;
            case 1:
            // straight filled, add the bottom as a line and fill.
                ctx.lineTo(x0,y0);
                ctx.fill();
                break;
            case 2:
            // curved filled, add the bottom as an arcTo curve and fill
                var backdist=Math.sqrt(((x2-x0)*(x2-x0))+((y2-y0)*(y2-y0)));
                ctx.arcTo(x1,y1,x0,y0,.55*backdist);
                ctx.fill();
                break;
            case 3:
            //filled head, add the bottom as a quadraticCurveTo curve and fill
                var cpx=(x0+x1+x2)/3;
                var cpy=(y0+y1+y2)/3;
                ctx.quadraticCurveTo(cpx,cpy,x0,y0);
                ctx.fill();
                break;
            case 4:
            //filled head, add the bottom as a bezierCurveTo curve and fill
                var cp1x, cp1y, cp2x, cp2y,backdist;
                var shiftamt=5;
                if(x2==x0) {
                    // Avoid a divide by zero if x2==x0
                    backdist=y2-y0;
                    cp1x=(x1+x0)/2;
                    cp2x=(x1+x0)/2;
                    cp1y=y1+backdist/shiftamt;
                    cp2y=y1-backdist/shiftamt;
                }else{
                    backdist=Math.sqrt(((x2-x0)*(x2-x0))+((y2-y0)*(y2-y0)));
                    var xback=(x0+x2)/2;
                    var yback=(y0+y2)/2;
                    var xmid=(xback+x1)/2;
                    var ymid=(yback+y1)/2;

                    var m=(y2-y0)/(x2-x0);
                    var dx=(backdist/(2*Math.sqrt(m*m+1)))/shiftamt;
                    var dy=m*dx;
                    cp1x=xmid-dx;
                    cp1y=ymid-dy;
                    cp2x=xmid+dx;
                    cp2y=ymid+dy;
                }

                ctx.bezierCurveTo(cp1x,cp1y,cp2x,cp2y,x0,y0);
                ctx.fill();
                break;
        }
        ctx.closePath();
        ctx.restore();
    };

    this.drawArrow=function(ctx,x1,y1,x2,y2,style,which,angle,d)
    {
        'use strict';

        /*
         * Arrow Head Types (style prop)
         * 0: unfilled but stroked head
         * 1: filled head with back a straight line
         * 2: filled head with back a curve drawn with arcTo
         * 3: filled head with back a curve drawn with quadraticCurveTo
         * 4: filled head with back a curve drawn with bezierCurveTo
         * function(ctx,x0,y0,x1,y1,x2,y2,style): user defined func
         */
        style=typeof(style)!=='undefined'? style:1; // type of head to draw
        which=typeof(which)!=='undefined'? which:1; // end point gets arrow: 0 - neither, 1 - (x2,y2), 2 - (x1,y1), 3 - both 
        angle=typeof(angle)!=='undefined'? angle:Math.PI/8; //angle - the angle θ from shaft to one side of arrow head - default π/8 radians (22 1/2°, half of a 45°)
        d    =typeof(d)    !=='undefined'? d    :30; // the distance d in pixels from arrow point back along the shaft to the back of the arrow head - default 10px

        //console.log("which: " + which + " -- angle: " + angle + " -- style: " + style + "-- d: " + d);

        // default to using drawHead to draw the head, but if the style
        // argument is a function, use it instead
        var toDrawHead = (typeof(style)==='function')?style:this.drawArrowHead;

        // For ends with arrow we actually want to stop before we get to the arrow
        // so that wide lines won't put a flat end on the arrow.
        //
        var dist=Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
        var ratio=(dist-d/3)/dist;
        if (style === 0) {
           ratio = (dist-d/16)/dist;
        }
        
        var tox, toy,fromx,fromy;
        if(which&1){
            tox=x1+(x2-x1)*ratio;
            toy=y1+(y2-y1)*ratio;
        }else{
            tox=x2;
            toy=y2;
        }
        if(which&2){
            fromx=x1+(x2-x1)*(1-ratio);
            fromy=y1+(y2-y1)*(1-ratio);
        }else{
            fromx=x1;
            fromy=y1;
        }

        // Draw the shaft of the arrow
        ctx.beginPath();
        ctx.moveTo(fromx,fromy);
        ctx.lineTo(tox,toy);
        ctx.stroke();

        // calculate the angle of the line
        var lineangle=Math.atan2(y2-y1,x2-x1);
        // h is the line length of a side of the arrow head
        var h=Math.abs(d/Math.cos(angle));

        if(which&1){  // handle far end arrow head
            var angle1=lineangle+Math.PI+angle;
            var topx=x2+Math.cos(angle1)*h;
            var topy=y2+Math.sin(angle1)*h;
            var angle2=lineangle+Math.PI-angle;
            var botx=x2+Math.cos(angle2)*h;
            var boty=y2+Math.sin(angle2)*h;
            toDrawHead(ctx,topx,topy,x2,y2,botx,boty,style);
        }
        if(which&2){ // handle near end arrow head
            var angle1=lineangle+angle;
            var topx=x1+Math.cos(angle1)*h;
            var topy=y1+Math.sin(angle1)*h;
            var angle2=lineangle-angle;
            var botx=x1+Math.cos(angle2)*h;
            var boty=y1+Math.sin(angle2)*h;
            toDrawHead(ctx,topx,topy,x1,y1,botx,boty,style);
        }
    };

}