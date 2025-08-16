function canvasWidgets() {
	return {
        createButton : createButton,
        createScore  : createScore,
	};

    function createButton(context,x,y,label,textProps,rectProps) {
    	return new Button(context,x,y,label,textProps,rectProps);
    }
    function createScore(context,x,y,tProps) {
        return new Score(context,x,y,tProps);
    }

    function Score(context,xx,yy,tProps) {

        var score = 0;
        var that = this;
        var ctx = context;
        var x=xx, y=yy; // drawLocation
        var hide = false; // if true then we don't draw

        // Default text props that will be used if caller doesn't override
        var textProps = { 
            font : "normal bold 30px serif",
            fillStyle : "#444444",
            textAlign : 'right', // 'center'
            textBaseline : 'middle'
        };

        // Override any props the user passed in tProps
        ObjectUtils.copyProps(tProps,textProps);

        this.reset     = function()  { score=0; }
        this.getScore  = function()  { return score; }
        this.setScore  = function(n) { score=n; }
        this.setHide   = function(bool) { hide=bool; }
        this.incrementBy = function(n) { score+=n; }
        this.decrementBy = function(n) { score-=n; }
        this.alterTextProps = function(tProps,forceDraw) {
            ObjectUtils.copyProps(tProps,textProps);
            if (forceDraw) { that.draw(); }
        }
        this.getDrawLocation = function() { return [x,y]; }
        //-------------------------------------------------------------------------------------
        this.setDrawLocation = function(xx,yy,forceDraw) {
            x=xx, y=yy;
            if (forceDraw) { that.draw(); }
        }
        //-------------------------------------------------------------------------------------
        this.draw = function() {
            console.log("---------------Score::draw() called");
            if (hide) { return; }
            ctx.save();
            ctx.font         = textProps.font;
            ctx.fillStyle    = textProps.fillStyle;
            ctx.lineWidth    = textProps.lineWidth;
            ctx.textAlign    = textProps.textAlign;
            ctx.textBaseline = textProps.textBaseline;
            ctx.fillText("Score: " + score,x,y);
            ctx.restore();
        }

    }

	function Button(context,xx,yy,txt,tProps,rProps) {

        var that = this;
        var ctx = context;
        var centerX = xx;
        var centerY = yy;
		var x = xx;
		var y = yy;
		var w;
		var h;
		var rect;
		var text = txt;
        var th; // this will hold th object returned by getTextHeight. Updated only if font attributes change
        var canvasutils = new CanvasUtils(); // TODO: remove instance call here. Should be a class static method call.
		
        // Default text props that will be used if caller doesn't override
    	var textProps = { 
            font : '30pt Times',
            padding : [0,0,0,5], // only padding[3] is used currently which is left padding -- controlls width of button
            fillStyle : "#000000",
            lineWidth : 1,
            textAlign : 'left', // 'center'
            textBaseline : 'top'
        };

        // Default rect props that will be used if caller doesn't override
        var rectProps = {
        	radius : 5,
            innerFillStyle : "#666666",
            outerFillStyle : "#000000",
            outerLineWidth : 2
        };

        // Override any props the user passed in tProps and rProps
        ObjectUtils.copyProps(tProps,textProps);
        ObjectUtils.copyProps(rProps,rectProps);

        init();

        function init() {

            ctx.save();
            ctx.font         = textProps.font;
            ctx.textAlign    = textProps.textAlign; // the testLine() only works if this is set to 'left'
            ctx.textBaseline = textProps.textBaseline; // important!
            th = canvasutils.getTextHeight(textProps.font);
            calcRectBounds();
            ctx.restore();    
        }

        this.getRect = function() { return rect; }

        this.getText = function() { return text; }
        this.setText = function(txt) {

            text = txt;

            ctx.save();
            ctx.font         = textProps.font;
            ctx.textAlign    = textProps.textAlign; // the testLine() only works if this is set to 'left'
            ctx.textBaseline = textProps.textBaseline; // important!
            calcRectBounds();
            that.draw(ctx);
            ctx.restore(); 
        };

        this.draw = function(ctx) {

    	    // x,y : button is centered on this point
            console.log("---------------Button::draw() called");
		    ctx.save();

		    // Draw filled inner rect
		    ctx.fillStyle = rectProps.innerFillStyle;//"#1AD920";
		    canvasutils.roundRect(ctx,x,y,w,h,rectProps.radius,true,false);

		    // Draw stroked outer rect
		    ctx.strokeStyle = rectProps.outerFillStyle;//"#000000";
		    ctx.lineWidth = rectProps.outerLineWidth;
		    canvasutils.roundRect(ctx,x,y,w,h,rectProps.radius,false,true);

		    // Draw label
		    ctx.font = textProps.font;
		    ctx.lineWidth = textProps.lineWidth;
		    ctx.fillStyle = textProps.fillStyle;
		    ctx.textAlign = textProps.textAlign;
            ctx.textBaseline = textProps.textBaseline
		    ctx.fillText(text,x+textProps.padding[3],y);

		    ctx.restore();
        }

        //-----------------------------------------------------------------------------
        // Helper Functions Only - (not a part of the "Button" API)
        //-----------------------------------------------------------------------------

        function calcRectBounds() {
            var newW = ctx.measureText(text).width;
            // console.log("Width for '"+text+"' is: " + newW);
            w = newW+2*textProps.padding[3];
            h = th.height;
            x = centerX - w/2; // centering on x,y
            y = centerY+h*1.5;
            rect = [x,y,w,h];
        }


	}
}