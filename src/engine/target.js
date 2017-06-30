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

class Target extends EventEmitter {

    /**
     * @param {Runtime} runtime Reference to the runtime.
     * @param {?Blocks} blocks Blocks instance for the blocks owned by this target.
     * @constructor
     */
    constructor (runtime, blocks) {
        super();

        if (!blocks) {
            blocks = new Blocks();
        }

        /**
         * Reference to the runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;
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
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {!Variable} Variable object.
     */
    lookupOrCreateVariable (id, name) {
        const variable = this.lookupVariableById(id);
        if (variable) return variable;
        // No variable with this name exists - create it locally.
        const newVariable = new Variable(id, name, 0, false);
        this.variables[id] = newVariable;
        return newVariable;
    }

    /**
     * Look up a variable object.
     * Search begins for local variables; then look for globals.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {!Variable} Variable object.
     */
    lookupVariableById (id) {
        // If we have a local copy, return it.
        if (this.variables.hasOwnProperty(id)) {
            return this.variables[id];
        }
        // If the stage has a global copy, return it.
        if (this.runtime && !this.isStage) {
            const stage = this.runtime.getTargetForStage();
            if (stage.variables.hasOwnProperty(id)) {
                return stage.variables[id];
            }
        }
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
     * Creates a variable with the given id and name and adds it to the
     * dictionary of variables.
     * @param {string} id Id of variable
     * @param {string} name Name of variable.
     */
    createVariable (id, name) {
        if (!this.variables.hasOwnProperty(id)) {
            const newVariable = new Variable(id, name, 0,
                false);
            this.variables[id] = newVariable;
        }
    }

    /**
     * Renames the variable with the given id to newName.
     * @param {string} id Id of renamed variable.
     * @param {string} newName New name for the variable.
     */
    renameVariable (id, newName) {
        if (this.variables.hasOwnProperty(id)) {
            const variable = this.variables[id];
            if (variable.id === id) {
                variable.name = newName;
            }
        }
    }

    /**
     * Removes the variable with the given id from the dictionary of variables.
     * @param {string} id Id of renamed variable.
     */
    deleteVariable (id) {
        if (this.variables.hasOwnProperty(id)) {
            delete this.variables[id];
        }
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
