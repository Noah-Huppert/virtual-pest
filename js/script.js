"use strict";

// HTML elements for future use
var stateImgEl = document.getElementById("state-img");
var currentStateEl = document.getElementById("current-state");

/**
 * An object which holds the configuration for one state
 *
 * @typedef {object} StateConf
 * @property {string} id - State identifier
 * @property {float} weight - Multiplied times probabilities.self, used to create dynamic behavior
 * @property {object} probabilities - Object which holds probabilities that machine will transition
 *                                    from its current state to a new one.
 *                                    Keys = State id, value: probability 0.0 - 1.0
 *
 *                                    All values must add up to 1.0, ignoring the mandatory "self"
 *                                    value which may be from 0.0 - 1.0 and is not included in the
 *                                    grand total.
 *
 *                                    The "self" key is required and represents the probability
 *                                    (from 0.0 - 1.0) that the machine will stay on the current state
 */

/**
 * List of state configurations
 * @type {StateConf[]}
 */
var states = [
    {
        id: "hungry",
        probabilities: {
            self: 0.8,
            thirsty: 0.35,
            happy: 0.1,
            sad: 0.2,
            tired: 0.35
        }
    },
    {
        id: "thirsty",
        probabilities: {
            self: 0.7,
            hungry: 0.4,
            happy: 0.1,
            sad: 0.3,
            tired: 0.2
        }
    },
    {
        id: "happy",
        probabilities: {
            self: 0.5,
            hungry: 0.3,
            thirsty: 0.2,
            sad: 0.1,
            tired: 0.4
        }
    },
    {
        id: "sad",
        probabilities: {
            self: 0.3,
            hungry: 0.25,
            thirsty: 0.25,
            happy: 0.1,
            tired: 0.4
        }
    },
    {
        id: "tired",
        probabilities: {
            self: 0.5,
            hungry: 0.4,
            thirsty: 0.1,
            happy: 0.1,
            sad: 0.4
        }
    }
];

/**
 * Configuration for a stimulus
 * @typedef {object} StimulusConf
 * @property {string} id - Stimulus identifier
 * @property {string} state - State this stimulus effects
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
        effect: -0.2
    },
    {
        id: "drink",
        state: "thirsty",
        effect: -0.4
    },
    {
        id: "election-results",
        state: "sad",
        effect: -0.7,
    },
    {
        id: "balloons",
        state: "happy",
        effect: -0.3
    },
    {
        id: "energy-drink",
        state: "tired",
        effect: -0.35
    }
];

/**
 * Class which represents Virtual Pest's state
 * @param (StateConf[]} statesConf Array of states configuration
 * @param {StimulusConf[]} stimuliConf Array of stimuli configuration
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
        var state = {
            // State Id
            id: conf.id,

            // All values for probabilities
            probabilities: {

                // Values used to calculate the actual probability values
                parameters: {

                    // Probability that state will stay the same (Change to its *self*)
                     self: {
                         // Probability is calculated with value * modifier
                         value: conf.probabilities.self,
                         modifier: 1.0
                    },

                    // Holds probability values that state will *switch*
                    switch: {}
                },

                // Calculated probability values go here
                ranges: {},

                // Keep track of the `probabilities.parameters.self.modifier` value so we
                // don't have to update if there isn't a change
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
     */
    self.step = function() {
        // Calculate probability ranges
        self.calcRanges();

        // Find next state
        var state = self.states[self.currentStateI];

        var random = Math.random();

        var lastValue = 0;// Used as lower bound
        var nextStateId = "";
        for (var key in state.probabilities.ranges) {
            var value = state.probabilities.ranges[key];// Used as upper bound

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
            var nextStateI = -1;

            var i = 0;
            for (var key in self.states) {
                if (key === nextStateId) {
                    self.currentStateI = i;
                }

                i++;
            }

            self._mapDOM();
        }
    };

    /**
     * Calculates a set of ranges that are used to determine the
     * probability of the state changing to another state or staying
     * the same.

     * Note: The term "self" is used to describe the next state
     * being the same as the current state (Because the next state turns into
     * its "self").
     *
     * This function looks at the current state object, more
     * particularly the values in `probabilities.parameters`. It uses those
     * values to compute the values for `probabilities.ranges`.
     *
     * Explanation of values:
     * - `probabilities` - Values related to state changes
     *     - `parameters` - Values that tune the generation process
     *     for the values in `ranges`
     *         - `self` - Values related to the next state being
     *         the same as the current
     *             - `modifier` - Value that program tweaks to make `self`
     *             range change on user input
     *             - `value` - Probability (0.0 - 1.0) that next state will
     *             be "self"
     *         - `switch` - Values related to the next state being
     *         different from the current state
     *             - This is a object which contains a key for every other mood
     *             (ex., "happy" or "sad" if state is "hungry")
     *             - The values of these keys is the same as the `self.value`
     *             value. It is the probability (0.0 - 1.0) that the next state
     *             will be the state identified in the key
     *     - `ranges` - An object which holds a series of values, 0.0 from
     *     1.0,
     */
    self.calcRanges = function() {
        // Convenience vars
        var state = self.states[self.currentStateI];
        var parameters = state.probabilities.parameters;

        // Make sure we haven't already calculated the values
        if (state.probabilities._lastRangesCalcModVal !== parameters.self.modifier) {
            // Calculate self value
            var selfValue = parameters.self.value * parameters.self.modifier;

            // Calculate switch values
            var switchSpace = 1 - selfValue;// Space available for range after big switch value
            var switchValues = {};

            for (var key in parameters.switch) {
                switchValues[key] = parameters.switch[key] * switchSpace;
            }

            // Assign values
            var runningRange = 0;
            for (var key in switchValues) {
                runningRange += switchValues[key];
                state.probabilities.ranges[key] = runningRange;
            }

            state.probabilities.ranges["self"] = 1.0;

            // Mark that we have calculated the values for this case
            state.probabilities._lastRangesCalcModVal = parameters.self.modifier;

            // Store most recent version of state
            self.states[self.currentStateI] = state;
        }
    };

    /**
     * Maps values for current state onto DOM
     */
    self._mapDOM = function() {
        // State image
        stateImgEl.src = "img/states/" + self.currentStateId + "/"  + self.currentStateId + ".png";

        // Current state label
        currentStateEl.innerText = prettifyString(self.currentStateId);
    };

    /**
     * Apply the effects of the given stimulus to the state
     * @param id Stimulus id
     */
    self.applyStimulus = function(id) {
        // Find stimulus config that we clicked on
        var stimulus;
        for (var i = 0; i < self.stimuli.length; i++) {
            var s = self.stimuli[i];
            if (s.id === id) {
                stimulus = s;
                break;
            }
        }

        if (stimulus === undefined) {
            throw new Error("Can not find stimulus with id: \"" + id + '\"');
        }

        // Find state stimulus refers to
        var state;
        for (var i = 0; i < self.states.length; i++) {
            var s = self.states[i];
            if (s.id === stimulus.state) {
                state = s;
                break;
            }
        }

        // Apply state effect
        // The State self probability is multiplied by the modifier
        // Adding the
        state.probabilities.parameters.self.modifier += stimulus.effect;
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

setInterval(function() {
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

    html += "<div class=\"sign\">" + (stimulus.effect < 0 ? "+" : "") + "</div>";
    html += (stimulus.effect * -1) + " "  + prettifyString(stimulus.state);

    html += "</div>";

    html += "</div>";
}

document.getElementById("stimuli-content").innerHTML = html;

// Click listener for stimuli
function onStimulusElClick(self) {
    var id = self.getAttribute("data-stimulus-id");

    state.applyStimulus(id);
}
