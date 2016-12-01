"use strict";

// HTML elements for future use
var stateImgEl = document.getElementById("state-img");
var currentStateEl = document.getElementById("current-state");
var detailsEl = document.getElementById("details");

/**
 * Searches an array of objects for the first object with a specific key value
 * pair and returns its index. If an object can not be found then an error is thrown with the provided
 * text.

 * @param targets {object} Objects to search
 * @param targetKey {string} Key to look for
 * @param targetValue {*} Value to look for, could be anything
 * @param errorText {string} Text of error thrown if key cannot be found
 */
function kvSearchOrThrow(targets, targetKey, targetValue, errorText) {
    for (var i = 0; i < targets.length; i++) {
        if (targets[i][targetKey] === targetValue) {
            return i;
        }
    }

    throw new Error(errorText);
}

/**
 * An object which holds the configuration for one state
 *
 * @typedef {object} StateConf
 * @property {string} id - State identifier
 * @property {object} probabilities - Object which holds probabilities that machine will transition
 *                                    from its current state to a new one.
 *                                    Keys = State id, value: probability 0 - 100
 *
 *                                    All values must add up to 1.0, ignoring the mandatory "self"
 *                                    value which may be from 0 - 100 and is not included in the
 *                                    grand total.
 *
 *                                    The "self" key is required and represents the probability
 *                                    (from 0 - 100) that the machine will stay on the current state
 * @property {string} uiColor - Hex color code of color that represents state in
 * the ui
 */

/**
 * List of state configurations
 * @type {StateConf[]}
 */
var states = [
    {
        id: "hungry",
        probabilities: {
            self: 80,
            thirsty: 35,
            happy: 10,
            sad: 20,
            tired: 35
        },
        uiColor: "#E24928"
    },
    {
        id: "thirsty",
        probabilities: {
            self: 70,
            hungry: 40,
            happy: 10,
            sad: 30,
            tired: 20
        },
        uiColor: "#0BB1E5"
    },
    {
        id: "happy",
        probabilities: {
            self: 50,
            hungry: 30,
            thirsty: 20,
            sad: 10,
            tired: 40
        },
        uiColor: "#23E726"
    },
    {
        id: "sad",
        probabilities: {
            self: 30,
            hungry: 25,
            thirsty: 25,
            happy: 10,
            tired: 40
        },
        uiColor: "#490BE5"
    },
    {
        id: "tired",
        probabilities: {
            self: 50,
            hungry: 40,
            thirsty: 10,
            happy: 10,
            sad: 40
        },
        uiColor: "#E50BB3"
    }
];

/**
 * Configuration for a stimulus
 * @typedef {object} StimulusConf
 * @property {string} id - Stimulus identifier
 * @property {string} state - State this stimulus effects
 * @property {string} uiVerb - Verb to describe effect stimulus has on state.
 * Used in the UI.
 * @property {string} conjugatedState - Name of state conjugated to use with uiVerb.
 * @property {float} effect - How much the stimulus effects the state
 */

/**
 * List of stimuli config
 * @type {StimulusConf[]}
 */
var stimuli = [
    {
        id: "food",
        state: "hungry",
        uiVerb: "helps",
        conjugatedState: "hunger",
        effect: -0.2
    },
    {
        id: "drink",
        state: "thirsty",
        uiVerb: "helps",
        conjugatedState: "thirst",
        effect: -0.4
    },
    {
        id: "election-results",
        state: "sad",
        uiVerb: "causes",
        conjugatedState: "sadness",
        effect: 0.7,
    },
    {
        id: "balloons",
        state: "happy",
        uiVerb: "causes",
        conjugatedState: "happyness",
        effect: 0.3
    },
    {
        id: "energy-drink",
        state: "tired",
        uiVerb: "helps",
        conjugatedState: "tiredness",
        effect: -0.35
    }
];

/** @class State */

/**
 * Class which represents Virtual Pest's state
 * @param {StateConf[]} statesConf - Array of states configuration
 * @param {StimulusConf[]} stimuliConf - Array of stimuli configuration
 * @constructor
 */
function State(statesConf, stimuliConf) {
    var self = this;

    if (statesConf === undefined || stimuliConf === undefined) {
        throw new Error("Two arguments expected in State constructor");
    }

    // Interpret config
    self.states = [];
    for (var i = 0; i < statesConf.length; i++) {
        var conf = statesConf[i];

        // State object to be added
        /**
         * Object which represents a possible state
         *
         * @typedef {object} State
         * @property {number} id - State id
         * @property {string} uiColor - Color state will be represented in, Hex format
         * @property {object} probabilities - Object which holds all configuration pertaining to the probabilities for
         * the next state
         * @property {object} probabilities.parameters - Values used to tune computation of _ranges object
         * @property {object} probabilities.parameters.self - Values related to the next state being the same as the
         * current one (aka, "self")
         * @property {number} probabilities.parameters.self.value - Probability (0 - 100) that the next state will be
         * self.
         * @property {number} probabilities.parameters.self.modifier - Value tweaked by stimuli to make behavior dynamic
         * @property {object} probabilities.parameters.switch - Values related to the next state being different than
         * the current. Holds KV pair for every other state where key is the state id and value is the probability (0
         * - 100) that the next state will be the key.
         * @property {object} probabilities._ranges - Holds a value for each state (0 - 100) which is an upper bound of
         * a range for that state. The lower bound of this range is the previous value in the ranges object
         * (Numerically, not by index), and zero if already the lowest value. These values create the probability
         * distribution used for the calculation of the next state.
         * @property {number} _lastRangesCalcModVal - Holds the value of `probabilities.parameters.self.modifier` from
         * the last time `probabilities._ranges` was calculated. The method which calculates `probabilities._ranges` will
         * check this value to make sure it is different from the current `modifier` value. If the value is not
         * different said method won't recalculate it and do any extra work.
         */
        var state = {
            id: conf.id,
            uiColor: conf.uiColor,
            probabilities: {
                parameters: {
                     self: {
                         value: conf.probabilities.self,
                         modifier: 1.0
                    },
                    switch: {}
                },
                _ranges: {},
                _lastRangesCalcModVal: -1
            }
        };


        for (var key in conf.probabilities) {
            if (key === "self") continue;
            state.probabilities.parameters.switch[key] = conf.probabilities[key];
        }

        self.states.push(state);
    }

    self.stimuli = stimuliConf;

    // State
    // These two variables should be kept consistent
    self.currentStateId = "happy";
    self.currentStateI = 2;

    /**
     * Step simulation of state once. This will look at the current
     * state and determine the next state.
     * @method step
     * @memberOf State
     */
    self.step = function() {
        // Find next state
        var state = self.states[self.currentStateI];

        var random = Math.random() * 100;

        var lastValue = 0;// Used as lower bound
        var nextStateId = "";
        for (var key in self.getLatestRanges(state)) {
            var value = self.getLatestRanges(state)[key];// Used as upper bound

            // If value is within range
            if (random > lastValue && random <= value) {
                // Save key and exit loop
                nextStateId = key;
                break;
            }

            lastValue = value;
        }

        // Set next state
        if (nextStateId !== "self") {// If next state is "self" than don't change a thing
            self.currentStateId = nextStateId;

            var i = 0;
            for (var key in self.states) {
                if (key === nextStateId) {
                    self.currentStateI = i;
                }

                i++;
            }

            self._mapDOM();
        }

        // Add to modifiers
        for (var i = 0; i < self.states.length; i++) {
            var modsState = self.states[i];
            var stateSelf = modsState.probabilities.parameters.self;

            var stimuliI = kvSearchOrThrow(self.stimuli, "state", modsState.id, "Cannot find stimuli with state: \"" + modsState.id + "\"");
            var stimuli = self.stimuli[stimuliI];

            if (stateSelf.modifier * stateSelf.value <= 99) {
                stateSelf.modifier += (1 - stateSelf.modifier) / 6;
            }

            self.states[i] = modsState;
        }

        // Round out modifier
        state.probabilities.parameters.self.modifier.toFixed(2);
    };

    /**
     * Calculates a set of ranges that are used to determine the
     * probability of the state changing to another state or staying
     * the same.
     *
     * Note: The term "self" is used to describe the next state
     * being the same as the current state (Because the next state turns into
     * its "self").
     *
     * This function looks at a state object, more particularly the values in `probabilities.parameters`. It uses those
     * values to compute the values for `probabilities._ranges`.
     *
     * @method _calcRanges
     * @memberOf State
     * @param {State} state - State to calculate ranges for
     * @returns {State} - State with new ranges calculated
     */
    self._calcRanges = function(state) {
        // Convenience vars
        var parameters = state.probabilities.parameters;

        // Calculate self value
        var selfValue = parameters.self.value * parameters.self.modifier;

        // Calculate switch values
        var switchSpace = 100 - (selfValue < 0 ? 0 : selfValue);// Space available for range after big switch value
        var switchValues = {};

        for (var key in parameters.switch) {
            switchValues[key] = (parameters.switch[key] / 100) * switchSpace;
        }

        // Assign values
        var runningRange = 0;
        for (var key in switchValues) {
            runningRange += switchValues[key];
            state.probabilities._ranges[key] = runningRange;
        }

        state.probabilities._ranges["self"] = 100;

        // Mark that we have calculated the values for this case
        state.probabilities._lastRangesCalcModVal = parameters.self.modifier;

        return state;
    };

    /**
     * Helper function which calculates, if needed, and then returns the `probabilities._ranges` field from the `State`
     * type.
     *
     * Checks {@link State#probabilities._lastRangesCalcModVal} against {@link State#probabilities.parameters.self.modifier}
     * to see if it has changed. Since {@link State#probabilities.parameters.self.modifier} is the only value that is
     * changed during program operation it is also the only value which can change the value of {@link State#probabilities._ranges}.
     * If it has changed then {@link State#probabilities._ranges} will be recalculated, if not then {@link State#probabilities._ranges}
     * is returned without any extra work.
     *
     * @param {State} state - State to get latest ranges for
     * @returns {object} - Latest value of ranges field
     */
    self.getLatestRanges = function(state) {
        // If changed
        if (state.probabilities._lastRangesCalcModVal !== state.probabilities.parameters.self.modifier) {
            state = self._calcRanges(state);
        }

        return state.probabilities._ranges;
    };

    /**
     * Maps values for current state onto DOM
     */
    self._mapDOM = function() {
        // State image
        stateImgEl.src = "img/states/" + self.currentStateId + "/"  + self.currentStateId + ".png";

        // Current state label
        currentStateEl.innerText = prettifyString(self.currentStateId);

        // Details
        var html = "";

        // States UI Color key (As in map key)
        html += "<div id=\"ui-colors-key\">";
        html += "<div class=\"title\">Key</div>";

        for (var i = 0; i < self.states.length; i++) {
            var state = self.states[i];
            var color = state.uiColor;
            var name = prettifyString(state.id);

            html += "<div class=\"key-item\">";

            html += "<div class=\"color\" style=\"background: " + color + "\"></div>";
            html += "<div class=\"name\">" + name + "</div>";

            html += "</div>";
        }

        html += "</div>";

        // Show state probabilities
        for (var i = 0; i < self.states.length; i++) {
            var state = self.states[i];

            html += "<div class=\"state-details\">";

            html += "<div class=\"title\">" + prettifyString(state.id) + " (" + state.probabilities.parameters.self.modifier.toFixed(2) + ")</div>";

            // Show probabilities
            html += "<div class=\"probabilities-bar\">";

            var ranges = self.getLatestRanges(state);

            var rangesHtml = {};
            var lastUpperBound = 0;
            for (var key in ranges) {
                // Calculate size of range
                var upperBound = ranges[key];

                var range = upperBound - lastUpperBound;// lastUpperBound is actually the lower bound of the range

                if (range < 0) {
                    range = 0;
                }

                // Get current state's color
                var currentState;
                var extraHtml = "";

                if (key !== "self") {
                    var index = kvSearchOrThrow(self.states, "id", key, "Cannot find state with id: \"" + key + "\"");
                    currentState = self.states[index];
                } else {
                    currentState = state;
                    extraHtml = "class=\"self\"";
                }

                rangesHtml[key] = "<div " + extraHtml + " style=\"transition: width 1s; width: " + range + "%; background: " + currentState.uiColor + ";\">" + Math.round(range) + "</div>";

                lastUpperBound = upperBound;
            }

            for (var j = 0; j < self.states.length; j++) {
                var id = self.states[j].id;

                if (id === state.id) {
                    id = "self";
                }

                html += rangesHtml[id];
            }

            html += "</div>";
            html += "</div>";
        }

        detailsEl.innerHTML = html;
    };

    /**
     * Apply the effects of the given stimulus to the state
     * @param id Stimulus id
     */
    self.applyStimulus = function(id) {
        // Find stimulus config that we clicked on
        var stimulusI = kvSearchOrThrow(self.stimuli, "id", id, "Cannot find stimulus with id: \"" + id + "\"");
        var stimulus = self.stimuli[stimulusI];

        // Find state stimulus refers to
        var stateI = kvSearchOrThrow(self.states, "id", stimulus.state, "Cannot find state specified in stimulus with id: \"" + id + "\"");
        var state = self.states[stateI];

        /* Apply state effect
        The State self probability is multiplied by the modifier

        Adding the effect to the modifier will then output the result of the
        state self probability
        */

        state.probabilities.parameters.self.modifier += stimulus.effect;

        if (state.probabilities.parameters.self.modifier < 0) {
            state.probabilities.parameters.self.modifier = 0;
        } else if (state.probabilities.parameters.self.modifier * state.probabilities.parameters.self.value > 99) {
            state.probabilities.parameters.self.modifier = 99 / state.probabilities.parameters.self.value;
        }

        // Update UI
        self._mapDOM();
    };

    // Map first state
    self._mapDOM();
}

function prettifyString(text) {
    text = text.replace("-", " ");

    var parts = text.split(" ");
    for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        parts[i] = part[0].toUpperCase() + part.slice(1);
    }

    return parts.join(" ");
}

// Create state instance
var state = new State(states, stimuli);

var interval = setInterval(function() {
    state.step();
}, 1000);

// Generate HTML for stimuli menu
var html = "";
for (var i = 0; i < stimuli.length; i++) {
    var stimulus = stimuli[i];

    html += "<div class=\"stimulus\" " +
                 "data-stimulus-id=\"" + stimulus.id +
              "\" onclick=\"onStimulusElClick(this)\">";

    var stimulusImgUrl = "img/stimuli/" + stimulus.id + "/" + stimulus.id + ".png";
    html += "<img src=\"" + stimulusImgUrl + "\" />";

    html += "<div class=\"stimulus-name\">";
    html += prettifyString(stimulus.id);
    html += "</div>";

    html += "<div class=\"stimulus-effect\">";

    html += "<div class=\"ui-verb "  + stimulus.uiVerb + "\">";
    html += prettifyString(stimulus.uiVerb);
    html += "</div>";

    html += " " + prettifyString(stimulus.conjugatedState) + " (" + (-1 * stimulus.effect) + ")";

    html += "</div>";

    html += "</div>";
}

document.getElementById("stimuli-content").innerHTML = html;

// Click listener for stimuli
function onStimulusElClick(self) {
    var id = self.getAttribute("data-stimulus-id");

    state.applyStimulus(id);
}
