const EventEmitter = require('events');

const Blocks = require('./blocks');
const Variable = require('../engine/variable');
const List = require('../engine/list');
const uid = require('../util/uid');

/**
 * @fileoverview
 * A Target is an abstract "code-running" object for the Scratch VM.
 * Examples include sprites/clones or potentially physical-world devices.
 */

/**
 * @param {?Blocks} blocks Blocks instance for the blocks owned by this target.
 * @constructor
 */
class Target extends EventEmitter {
    constructor (blocks) {
        super();

        if (!blocks) {
            blocks = new Blocks();
        }
        /**
         * A unique ID for this target.
         * @type {string}
         */
        this.id = uid();
        /**
         * Blocks run as code for this target.
         * @type {!Blocks}
         */
        this.blocks = blocks;
        /**
         * Dictionary of variables and their values for this target.
         * Key is the variable name.
         * @type {Object.<string,*>}
         */
        this.variables = {};
        /**
         * Dictionary of lists and their contents for this target.
         * Key is the list name.
         * @type {Object.<string,*>}
         */
        this.lists = {};
        /**
         * Dictionary of custom state for this target.
         * This can be used to store target-specific custom state for blocks which need it.
         * TODO: do we want to persist this in SB3 files?
         * @type {Object.<string,*>}
         */
        this._customState = {};
    }

    /**
     * Called when the project receives a "green flag."
     * @abstract
     */
    onGreenFlag () {}

    /**
     * Return a human-readable name for this target.
     * Target implementations should override this.
     * @abstract
     * @returns {string} Human-readable name for the target.
     */
    getName () {
        return this.id;
    }

    /**
     * Look up a variable object, and create it if one doesn't exist.
     * Search begins for local variables; then look for globals.
     * @param {!string} name Name of the variable.
     * @return {!Variable} Variable object.
     */
    lookupOrCreateVariable (name) {
        // If we have a local copy, return it.
        if (this.variables.hasOwnProperty(name)) {
            return this.variables[name];
        }
        // If the stage has a global copy, return it.
        if (this.runtime && !this.isStage) {
            const stage = this.runtime.getTargetForStage();
            if (stage.variables.hasOwnProperty(name)) {
                return stage.variables[name];
            }
        }
        // No variable with this name exists - create it locally.
        const newVariable = new Variable(name, 0, false);
        this.variables[name] = newVariable;
        return newVariable;
    }

    /**
    * Look up a list object for this target, and create it if one doesn't exist.
    * Search begins for local lists; then look for globals.
    * @param {!string} name Name of the list.
    * @return {!List} List object.
     */
    lookupOrCreateList (name) {
        // If we have a local copy, return it.
        if (this.lists.hasOwnProperty(name)) {
            return this.lists[name];
        }
        // If the stage has a global copy, return it.
        if (this.runtime && !this.isStage) {
            const stage = this.runtime.getTargetForStage();
            if (stage.lists.hasOwnProperty(name)) {
                return stage.lists[name];
            }
        }
        // No list with this name exists - create it locally.
        const newList = new List(name, []);
        this.lists[name] = newList;
        return newList;
    }

    /**
     * Post/edit sprite info.
     * @param {object} data An object with sprite info data to set.
     * @abstract
     */
    postSpriteInfo () {}

    /**
     * Retrieve custom state associated with this target and the provided state ID.
     * @param {string} stateId - specify which piece of state to retrieve.
     * @returns {*} the associated state, if any was found.
     */
    getCustomState (stateId) {
        return this._customState[stateId];
    }

    /**
     * Store custom state associated with this target and the provided state ID.
     * @param {string} stateId - specify which piece of state to store on this target.
     * @param {*} newValue - the state value to store.
     */
    setCustomState (stateId, newValue) {
        this._customState[stateId] = newValue;
    }

    /**
     * Call to destroy a target.
     * @abstract
     */
    dispose () {
        this._customState = {};
    }
}

module.exports = Target;
