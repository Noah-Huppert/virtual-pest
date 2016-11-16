"use strict";

var moods = [
    "hungry",
    "thirsty",
    "happy",
    "sad",
    "tired"
];

var moodIndex = 0;
var stepInterval = setInterval(onTick, 1000);

var app = new Vue({
    el: "#app",
    data: {
        // Either "auto" (Steps every x seconds) or "manual" which requires button presses
        currentMood: { name: "", src: "" },
        stepMode: "auto",
        stateCtrlBtnClass: "material-icons inactive",
        stateCtrlModeIcon: "pause"
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
                 * is changed at 250ms in the animation for best visual look. However the user
                 * does not perceive stepMode as being changed until the 1000ms animation is done
                 * so we will not start stepping until the animation is complete, aka 750ms.
                 */
                setTimeout(function() {
                    stepInterval = setInterval(onTick, 1000);
                }, 750);
            } else {
                clearInterval(stepInterval)
            }

            this.stateCtrlBtnClass = "material-icons" +
                (this.stepMode === "auto" ? " inactive" : "");

            this.stateCtrlModeIcon = (this.stepMode === "auto" ? "pause" : "play_arrow")
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

