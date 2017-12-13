const EventEmitter = require('events');

const Blocks = require('./blocks');
const Variable = require('../engine/variable');
const uid = require('../util/uid');
const {Map} = require('immutable');
const log = require('../util/log');

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
        const newVariable = new Variable(id, name, Variable.SCALAR_TYPE, false);
        this.variables[id] = newVariable;
        return newVariable;
    }

    /**
     * Look up a broadcast message object with the given id and return it
     * if it exists.
     * @param {string} id Id of the variable.
     * @param {string} name Name of the variable.
     * @return {?Variable} Variable object.
     */
    lookupBroadcastMsg (id, name) {
        let broadcastMsg;
        if (id) {
            broadcastMsg = this.lookupVariableById(id);
        } else if (name) {
            broadcastMsg = this.lookupBroadcastByInputValue(name);
        } else {
            log.error('Cannot find broadcast message if neither id nor name are provided.');
        }
        if (broadcastMsg) {
            if (name && (broadcastMsg.name.toLowerCase() !== name.toLowerCase())) {
                log.error(`Found broadcast message with id: ${id}, but` +
                    `its name, ${broadcastMsg.name} did not match expected name ${name}.`);
            }
            if (broadcastMsg.type !== Variable.BROADCAST_MESSAGE_TYPE) {
                log.error(`Found variable with id: ${id}, but its type ${broadcastMsg.type}` +
                    `did not match expected type ${Variable.BROADCAST_MESSAGE_TYPE}`);
            }
            return broadcastMsg;
        }
    }

    /**
     * Look up a broadcast message with the given name and return the variable
     * if it exists. Does not create a new broadcast message variable if
     * it doesn't exist.
     * @param {string} name Name of the variable.
     * @return {?Variable} Variable object.
     */
    lookupBroadcastByInputValue (name) {
        const vars = this.variables;
        for (const propName in vars) {
            if ((vars[propName].type === Variable.BROADCAST_MESSAGE_TYPE) &&
                (vars[propName].name.toLowerCase() === name.toLowerCase())) {
                return vars[propName];
            }
        }
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
    * @param {!string} id Id of the list.
    * @param {!string} name Name of the list.
    * @return {!Varible} Variable object representing the found/created list.
     */
    lookupOrCreateList (id, name) {
        const list = this.lookupVariableById(id);
        if (list) return list;
        // No variable with this name exists - create it locally.
        const newList = new Variable(id, name, Variable.LIST_TYPE, false);
        this.variables[id] = newList;
        return newList;
    }

    /**
     * Creates a variable with the given id and name and adds it to the
     * dictionary of variables.
     * @param {string} id Id of variable
     * @param {string} name Name of variable.
     * @param {string} type Type of variable, '', 'broadcast_msg', or 'list'
     */
    createVariable (id, name, type) {
        if (!this.variables.hasOwnProperty(id)) {
            const newVariable = new Variable(id, name, type, false);
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

                if (this.runtime) {
                    const blocks = this.runtime.monitorBlocks;
                    blocks.changeBlock({
                        id: id,
                        element: 'field',
                        name: 'VARIABLE',
                        value: id
                    }, this.runtime);
                    this.runtime.requestUpdateMonitor(Map({
                        id: id,
                        params: blocks._getBlockParams(blocks.getBlock(variable.id))
                    }));
                }

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
            if (this.runtime) {
                this.runtime.monitorBlocks.deleteBlock(id);
                this.runtime.requestRemoveMonitor(id);
            }
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
