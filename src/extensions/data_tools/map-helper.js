//Created by: Alex Burroughs, Zachary Fernbaugh, Phillip Carroll, and Nathanael Hood with the KSU Scratch Data Tools group
//See LICENSE for more information.

/**
 * This class is used to assist the Data Tools extension in mapping data sets. 
 * Given the limitations of building an extension in Scratch, this class is necessary
 * to assist mainly in finding the ID of the currently executing block and storing values
 * as map functions run. It is designed for concurrency, and will work if multiple threads
 * are running simultaneously. By keeping track of different state variables accessible by 
 * block ID, the MapHelper fully manages all possible configurations of map functions.
 */
class MapHelper {
    constructor() {
        /**
         * Holds retrieved column values for each map function block.
         * Each value is accessible by the function block's ID
         */
        this._currentRowValues = {};

        /**
         * Holds the working results of mapping a dataset.
         * This is only needed until the map function completes,
         * when it gets added to the extension as its own dataset.
         * Each value is accessible by the function block's ID.
         */
        this._mapResults = {};

        /**
         * Holds the results of mapping nested function blocks.
         * This allows us to easily find the running block's ID
         * if multiple blocks are nested.
         * Each value is accessible by the top block's ID.
         */
        this._depthMaps = {};

        /**
         * Holds the current depth of each function block. This allows
         * for easy identification of a function block if there are multiple
         * nested blocks. Instead of recalculation, it simply uses its depth.
         * Each value is accessible by the function block's ID.
         */
        this._depths = {};

        /**
         * Holds the names of previously generated map results. When blocks are nested,
         * there is a behavior in which previously calculated blocks get called again. This prevents
         * recalculation by storing the names of the resulting dataset for each block.
         * Each value is accessible by the top block's ID and the requested column data.
         */
        this._generatedMaps = {};

        this._loopCounters = {};

        this._errors = {};
    }

    /**
     * Gets the ID of the currently running function block in
     * the most recently calculated depth map.
     * @param {string} topBlock The identifier used to find the depth map
     * @returns {string} The ID of the currently running function block
     */
    getID(topBlock) {
        return this._depthMaps[topBlock][this._depths[topBlock]];
    }

    incrementLoopCounter(id, util) {
        if(!this._loopCounters[id]) {
            this._loopCounters[id] = 0;
            if(typeof this._mapResults[id] !== 'undefined') {
                delete this._mapResults[id];
            }
        }

        if(this._loopCounters[id] > 0 && this.checkMapResult(id)) {
            this._handleError("Map result not set.", util.thread.topBlock);
            return false;
        }

        this._loopCounters[id]++;
        return true;
    }

    /**
     * Gets a value for the map input based on the top block
     * @param {object} util Block utility provided by the runtime
     * @returns {string | number} The current value of the running function block
     */
    getMapInput(args, util) {
        let id = this._findContainingLoopBlock(util);
        if(!this._currentRowValues[id][args.COLUMN]) {
            //TODO: Check this
            //return `Column [${args.COLUMN}] not found`;
            this._handleError(`Can't find column [${args.COLUMN}]`, util.thread.topBlock);
            return "";
        }

        return this._currentRowValues[id][args.COLUMN];
    }

    /**
     * Adds a map result to the current function block. This is
     * done by searching upward until a function block is found. 
     * If none are found, an error has occurred.
     * @param {string | number} value The value to be added
     * @param {object} util Block utility object provided by the runtime
     */
    setMapResult(args, util) {
        //This should always find the parent map function block
        let id = this._findContainingLoopBlock(util);

        if(typeof this._mapResults[id] === 'undefined') {
            this._mapResults[id] = [];
        }

        if(typeof this._mapResults[id][this._loopCounters[id] - 1] === 'undefined') {
            this._mapResults[id][this._loopCounters[id] - 1] = {};
        }

        this._mapResults[id][this._loopCounters[id] - 1][args.COLUMN] = args.VALUE
    }

    /**
     * Gets a generated map based on the top block and column input. This
     * allows us to save time recalculating a map function that has already been
     * run, which additionally spares more issues arising.
     * @param {string} topBlock The running thread's current top block
     * @param {string} name The current function block's NAME input
     * @returns {string} The generated data set's name (if found) or null
     */
    getGeneratedMap(topBlock, name) {
        if(this._generatedMaps[topBlock] && this._generatedMaps[topBlock][name]) {
            return this._generatedMaps[topBlock][name];
        }
        else return null;
    }

    /**
     * Checks to see if the function block depth map for the given top block needs 
     * to be recalculated and does so if needed.
     * @param {string} topBlock The running thread's current top block
     * @param {object} util Block utility object provided by the runtime
     */
    checkRegenerateFunctionBlockDepthMap(topBlock, util) {
        if(!this._depthMaps[topBlock] || this._getOutermostBlock(util) !== this._depthMaps[topBlock][0]) {
            this._generateFunctionBlockDepthMap(util);
        }
    }

    /**
     * Checks to see if the map results for an ID are empty or don't match an expected value
     * @param {string} id The current function block's ID
     * @returns {boolean} Whether or not the map results for this ID are empty
     */
    checkMapResult(id) {
        return !this._mapResults[id] || this._mapResults[id].length !== this._loopCounters[id];
    }

    /**
     * Executes the next step for a map function block. If the function needs to iterate,
     * this starts the next branch running. If not, the results of the function are added 
     * to a new data set in the extension and the map function will be complete.
     * @param {object} args The arguments for the function
     * @param {object} util Block utility object provided by the runtime
     * @param {string} id The current function block's ID
     * @param {int} rowCount The row count of the current data set
     * @param {Function} addDataFile Function to add a data file to the Data Tools extension
     * @param {Function} generateFileDisplayName Function to generate a displayable name for the generated data set
     * @param {Function} getRow Function to get a column value at a specific row
     * @returns {string} The name of the resulting data set
     */
    executeMapFunction(args, util, id, rowCount, addDataFile, generateFileDisplayName, getRow) {
        let topBlock = util.thread.topBlock;

        if(!this._errors[topBlock]  && rowCount === 0) {
            alert("Map Function: Must select a file.");
            this._handleError("Must select a file.", topBlock);
        }

        if(this._errors[topBlock]) {
            this._deleteWorkingData(id, id !== topBlock ? null : topBlock);
            return "";
        }

        if(!this._loopCounters[id]) {
            this._loopCounters[id] = 0;
        }

        if(this._loopCounters[id] > 0 && this.checkMapResult(id)) {
            this._handleError("Map result not set.", util.thread.topBlock);
            return "";
        }

        this._loopCounters[id]++;

        if (this._loopCounters[id] <= rowCount) {
            this._currentRowValues[id] = getRow(args.NAME, this._loopCounters[id]);

            util.startFunctionBranch(id);

        }
        else {
            let name = "MAP: " + args.NAME;

            name = generateFileDisplayName(name);

            if(!this._generatedMaps[topBlock]) {
                this._generatedMaps[topBlock] = {};
            }
            this._generatedMaps[topBlock][args.NAME] = name;

            addDataFile(name, this._generateNewDataSet(this._mapResults[id]));
            
            if(this._depths[topBlock] <= 0) {
                this._deleteWorkingData(id, topBlock);
            }
            else {
                this._depths[topBlock]--;
                this._deleteWorkingData(id);
            }


            return name;
        }
    }

//#region PRIVATE methods

    _handleError(message, topBlock) {
        alert("Map Function: " + message);

        //TODO: More graceful error handling;
        this._errors[topBlock] = true;
    }

    _deleteWorkingData(id, topBlock) {  
        if(id) {
            delete this._currentRowValues[id];
            delete this._mapResults[id];
            delete this._loopCounters[id];
        }

        if(topBlock) {
            delete this._generatedMaps[topBlock];
            delete this._depthMaps[topBlock];
            delete this._depths[topBlock];
            delete this._errors[topBlock];
        }
    }

    _generateNewDataSet(results) {
        let data = [];
        let columns = {};

        results.map(result => {
            //calculate column values
            Object.keys(result).forEach(key => {
                if(!columns[key]) {
                    columns[key] = (typeof result[key]);
                }
            });

            //set new value
            data.push(result);
        });

        let cols = Object.keys(columns);

        data.forEach(item => {
            cols.forEach(col => {
                if(!item[col]) {
                    item[col] = columns[col] === 'number' ? 0 : ""; 
                }
            });
        });

        return data;
    }

    /**
     * Finds the containing loop block of the currently running block.
     * Can be used to correctly identify which values to return while 
     * running nested loop blocks.
     * @param {object} util Block utility object provided by the runtime
     * @returns {string} The ID of the containing loop block
     */
    _findContainingLoopBlock(util) {
        let id = util.thread.peekStack(); 
        let blocks = util.target.blocks._blocks;

        while(id !== null && blocks[id].opcode !== 'datatools_mapFunctionToColumn') {
            id = blocks[id].parent;
        }

        if(!id) {
            this._handleError("Can't find containing loop block.", util.thread.topBlock);
            return;
        }

        return id;
    }

    /**
     * Gets the outermost function block in a series of nested function blocks.
     * This helps in determining whether or not a depth map needs to be regenerated.
     * @param {object} util Block utility object provided by the runtime
     * @returns {string} The ID of the outermost function block
     */
    _getOutermostBlock(util) {
        let outermost;
        let executingBlock = util.thread.peekStack();
        let blocks = util.target.blocks._blocks;         
        let options = Object.keys(blocks).filter(key => blocks[key].opcode === 'datatools_mapFunctionToColumn');

        if(options.includes(executingBlock)) {
            outermost = executingBlock;
        }
        else {
            let inputs = blocks[executingBlock].inputs;

            options.forEach(option => {
                if(!outermost) {
                    Object.keys(inputs).forEach(x => {
                        if(!outermost && inputs[x].block === option) {
                            outermost = option;
                        }
                    });
                }
            });
        }
        return outermost;
    }

    /**
     * Generates a function block depth map, accessible by the current top block.
     * This allows us to accurately determine which function block is currently
     * being run.
     * @param {object} util Block utility object provided by the runtime
     */
    _generateFunctionBlockDepthMap(util) {
        let blocks = util.target.blocks._blocks;         
        let options = Object.keys(blocks).filter(key => blocks[key].opcode === 'datatools_mapFunctionToColumn');
        let outermost = this._getOutermostBlock(util);

        let depth = 0;
        let block = outermost;
        let results = [];
        //results[block] = {depth, topBlock: util.thread.topBlock};
        results[depth] = block;

        while(block && blocks[block].inputs) {
            let next;
            let inputs = blocks[block].inputs;
            Object.keys(blocks[block].inputs).forEach(x => {
                if(!next && options.includes(inputs[x].block)) {
                    next = inputs[x].block;
                }
            });
            block = next;
            depth++;
            //results[block] = {depth, topBlock: util.thread.topBlock};
            if(block) {
                results.push(block);
            }
        }
        this._depthMaps[util.thread.topBlock] = results;
        this._depths[util.thread.topBlock] = this._depthMaps[util.thread.topBlock].length - 1;
    }
}
//#endregion

module.exports = MapHelper