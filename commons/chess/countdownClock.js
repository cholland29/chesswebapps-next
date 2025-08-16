function CountdownClock( durationInSec, onClockStart, onClockStop, onClockTick ) {

	var timer = null,
	    fracSecTimer = null,              // timer that elapses after the fraction of a second after a pause
	    fracSec = 0,
	    totalTimeInMs = durationInSec*1000,
	    timeElapsedInMs = 0;
	    startTimeInMs = 0,
	    pauseTimeInMs = 0,
	    remainTimeInMs = durationInSec*1000;

	var flagged = false,
        onCountDownStart = onClockStart,
        onCountDownStop  = onClockStop,       // if set, this function will be called when the clock flags
        onCountDownTick  = onClockTick;

    //------------------------------------------------

    //------------------------------------------------
    this.countdownInProgress = function() {
       return timer !== null;
    };

    //------------------------------------------------
    this.resetClock = function() {
      if (this.countdownInProgress()) {
        this.stopClock();
      }
      remainTimeInMs = totalTimeInMs;
      pauseTimeInMs = 0;
      timeElapsedInMs = 0;
    }

    //------------------------------------------------
    this.startClock = function() {
       startTimeInMs = new Date();
       remainTimeInMs = totalTimeInMs;
       pauseTimeInMs = 0;
       timeElapsedInMs = 0;

       // Strange scoping issue here.  Apparently the callback you feed to the timer gets executed outside the CountdownClock context.
       // More info at http://stackoverflow.com/questions/11333311/javascript-setinterval-scoping-issue
       // 
       timer = window.setInterval(clockTick.bind(this),1000); // you must use bind here or this will point to window object in callback

       if (onCountDownStart !== null) {
          onCountDownStart(remainTimeInMs, this.convertMsToTimeString(remainTimeInMs));
       }
    };

    //------------------------------------------------
    this.stopClock = function() {
    //function stopClock() {
       window.clearInterval(timer);
       timer = null;
       if (onCountDownStop !== null) {
          onCountDownStop(remainTimeInMs > 0);
       }
    }

    //------------------------------------------------2
    var clockTick = function() {
        timeElapsedInMs += 1000;
        remainTimeInMs -= 1000;

        timeStr = this.convertMsToTimeString(remainTimeInMs);

        if (onCountDownTick !== null) {
          onCountDownTick(remainTimeInMs,timeStr);
        }

        if (remainTimeInMs <= 0) {
            this.stopClock();
        }
    };

    this.convertSecToTimeString = function(nSec) {
        var timeStr = "";
        var remainSec;
        if (nSec) {
            remainSec = nSec;
        } else {
            remainSec = remainTimeInMs / 1000;
        }
        var hour = Math.floor(remainSec/3600);
        //timeStr = ((hour>=10)?""+hour:"0"+hour) + ":";
        remainSec = remainSec % 3600;
        var min =  Math.floor(remainSec/60);
        timeStr += ((min>=10)?""+min:"0"+min) + ":";
        remainSec = remainSec % 60;
        timeStr += ((remainSec>=10)?""+remainSec:"0"+remainSec);
        return timeStr;
    };

    this.convertMsToTimeString = function(nMs) {
        return this.convertSecToTimeString(nMs/1000);
    };

    //------------------------------------------------
    this.isPaused = function() {
        return (pauseTimeInMs > 0);
    };

    //------------------------------------------------
    this.setAlarmDurationInSec = function(nSec) {
       totalTimeInMs = nSec * 1000;
    };

	//------------------------------------------------
	this.pauseToggle = function() {
		if (isPaused()) {
			// lets unpause
	   	    if (fracSec > 0) {
                fracSecTimer = window.setTimeout(function() {
                    window.clearTimeout(fracSecTimer);
                    fracSecTimer = null;
                    startClock();
                },fracSec);
            } else {
            	startClock();
            }
	    } else {
			// lets pause
			pauseTimeInMs = new Date();
			stopClock();
            fracSec = (pauseTimeInMs - startTimeInMs)%1000;
		}
	   
	};

}
