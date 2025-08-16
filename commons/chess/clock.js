function Clock( type, durationInSec, onTickFunc ) {
	var CLOCK_TYPE_COUNTDOWN = 0,
	    CLOCK_TYPE_COUNTUP   = 1,
	    CLOCK_TYPE_INDETERMINATE = 2;

	var timer = null,
	    fracSecTimer = null,              // timer that elapses after the fraction of a second after a pause
	    fracSec = 0,
	    totalTimeInMs = durationInSec,
	    timeElapsedInMs = 0;
	    startTimeInMs = 0,
	    pauseTimeInMs = 0,
	    remainTimeInMs = durationInSec;

	var type = CLOCK_TYPE_COUNTDOWN,
	    sec = 0,
	    flagged = false,
	    updateTimeElFunc = onTickFunc;  // if set, this function will be called when the clock flags

    //------------------------------------------------
    this.isPaused = function() {
        return (pauseTimeInMs > 0);
    };

    //------------------------------------------------
    this.setAlarmDurationInSec = function(nSec) {
       totalTimeInMs = nSec * 1000;
    };

    //------------------------------------------------
	this.startClock = function() {
	   startTimeInMs = new Date();
	   pauseTimeInMs = 0;
       timer = window.setInterval(countdownClock,1000);
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

	//------------------------------------------------
	this.stopClock = function() {
       window.clearInterval(timer);
       timer = null;
	};

    //------------------------------------------------
	var countdownClock = function() {
        timeElapsedInMs += 1000;
        remainTimeInMs -= 1000;

        var timeStr = "";
        //var hour = Math.floor(sec/3600);
        //timeStr = ((hour>=10)?""+hour:"0"+hour) + ":";
        var remain = remainTimeInMs % 3600;
        var min =  Math.floor(remain/60);
        timeStr += ((min>=10)?""+min:"0"+min) + ":";
        remain = remain % 60;
        timeStr += ((remain>=10)?""+remain:"0"+remain);

        console.log(timeStr);
        updateTimeElFunc(timeStr);

        if (remainTimeInMs <= 0) {
        	stopClock();
        }
	};

}
