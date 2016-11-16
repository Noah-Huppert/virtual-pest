"use strict";

// Array of moods
var moods = [
    "hungry",
    "thirsty",
    "happy",
    "sad",
    "tired"
];

var moodIndex = 0;

var _defaultStepDuration = 1000;
var stepInterval = setInterval(onTick, _defaultStepDuration);

var app = new Vue({
    el: "#app",
    data: {
        currentMood: { name: "", src: "" },

        // Either "auto" (Steps every x seconds) or "manual" which requires button presses
        stepMode: "auto",
        stepDuration: _defaultStepDuration,
        stateCtrlBtnClass: "material-icons inactive",
        stateCtrlModeIcon: "pause",

        expanded: undefined,
        prettyExpandedName: ""
    },
    methods: {
        onTick: onTick,
        toggleStepMode: function() {
            var el = document.getElementById("state-toggle");
            el.classList.add("animation-spin");
            setTimeout(function() {
                el.classList.remove("animation-spin");
            }, 1000);

            setTimeout(function() {
                app.stepMode = (app.stepMode === "auto" ? "manual" : "auto");
            }, 250);
        }
    },
    watch: {
        stepMode: function(newVal, oldVal) {
            if (this.stepMode === "auto") {
                /*
                 * The animation that takes place in #state-ctrl when changing step modes
                 * is 1000ms long. In app.methods.toggleStepMode the actual value of stepMode
                 * is changed at 250ms in the animation for the best visual look. However the user
                 * does not perceive stepMode as being changed until the 1000ms animation is complete
                 * so we will not start stepping until the animation is complete, aka 750ms.
                 */
                setTimeout(function() {
                    stepInterval = setInterval(onTick, this.stepDuration);
                }, 750);
            } else {
                clearInterval(stepInterval)
            }

            this.stateCtrlBtnClass = "material-icons" +
                (this.stepMode === "auto" ? " inactive" : "");

            this.stateCtrlModeIcon = (this.stepMode === "auto" ? "pause" : "play_arrow")
        },
        expanded: function(newVal, oldVal) {
            this.prettyExpandedName = this.expanded.charAt(0).toUpperCase() + this.expanded.slice(1);
        }
    }
});

/**
 * Represents a "tick" in the mood cycle system. The mood
 * is calculated on each "tick".
 */
function onTick() {
    // Increment to next mood or reset back to beginning if at end
    if (moodIndex < moods.length - 1) {
        moodIndex++;
    } else {
        moodIndex = 0;
    }

    setMood(moodIndex);
}

/**
 * Set mood to given index
 * @param i Index of mood to set
 */
function setMood(i) {
    var mood = moods[i];
    app.currentMood.name = mood.charAt(0).toUpperCase() + mood.slice(1);
    app.currentMood.src = "img/states/" + mood + "/" + mood + ".png";
}

setMood(0);

