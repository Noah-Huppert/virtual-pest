"use strict";

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
        weight: 1.0,
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
        weight: 1.0,
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
        weight: 1.0,
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
        weight: 1.0,
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
        weight: 1.0,
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
        state: "happy",
        effect: -0.7,
    },
    {
        id: "balloons",
        state: "sad",
        effect: -0.3
    },
    {
        id: "energy-drink",
        state: "tired",
        effect: -0.35
    }
];
