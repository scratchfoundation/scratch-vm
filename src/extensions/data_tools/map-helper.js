/**
 * 
 */
class MapHelper {
    constructor() {
        /**
         * Holds retrieved column values for each map function block.
         * Each value is accessible by the function block's ID
         */
        this._columnValues = {};

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

    /**
     * Initializes the stack frame's loop counter(s). Each function block's
     * loop counter is accessible by its ID.
     * @param {object} util The block utility that is being initialized
     * @param {string} id The current function block's ID
     */
    initializeUtil(util, id) {
        if (typeof util.stackFrame.loopCounter === 'undefined') {
            util.stackFrame.loopCounter = {};
        }

        if(!util.stackFrame.loopCounter[id]) {
            util.stackFrame.loopCounter[id] = 0;
            if(typeof this._mapResults[id] !== 'undefined') {
                delete this._mapResults[id];
            }
        }
    }

    /**
     * Gets a value for the map input based on the top block
     * @param {object} util Block utility provided by the runtime
     * @returns {string | number} The current value of the running function block
     */
    getMapInput(util) {
        let id = this._findContainingLoopBlock(util);
        return this._columnValues[id];
    }

    /**
     * Adds a map result to the current function block. This is
     * done by searching upward until a function block is found. 
     * If none are found, an error has occurred.
     * @param {string | number} value The value to be added
     * @param {object} util Block utility object provided by the runtime
     */
    setMapResult(value, util) {
        //This should always find the parent map function block
        let current = this._findContainingLoopBlock(util);

        if(typeof this._mapResults[current] === 'undefined') {
            this._mapResults[current] = [];
        }

        this._mapResults[current].push(value);
    }

    /**
     * Gets a generated map based on the top block and column input. This
     * allows us to save time recalculating a map function that has already been
     * run, which additionally spares more issues arising.
     * @param {string} topBlock The running thread's current top block
     * @param {string} column The current function block's COLUMN input
     * @returns {string} The generated data set's name (if found) or null
     */
    getGeneratedMap(topBlock, column) {
        if(this._generatedMaps[topBlock] && this._generatedMaps[topBlock][column]) {
            return this._generatedMaps[topBlock][column];
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
     * Checks to see if the map results for an ID are empty
     * @param {string} id The current function block's ID
     * @returns {boolean} Whether or not the map results for this ID are empty
     */
    checkMapResult(id) {
        return !this._mapResults[id];
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
     * @param {Function} getColumnAtRow Function to get a column value at a specific row
     * @returns {string} The name of the resulting data set
     */
    executeMapFunction(args, util, id, rowCount, addDataFile, generateFileDisplayName, getColumnAtRow) {
        let colArr = args.COLUMN.split(']');
        let fileName = colArr[0].substring(1);

        if (util.stackFrame.loopCounter[id] <= rowCount) {
            this._columnValues[id] = getColumnAtRow({COLUMN: args.COLUMN, ROW: util.stackFrame.loopCounter[id]});

            //this._blockIDs[id] = util.startFunctionBranch("datatools_mapFunctionToColumn", this._blockIDs[id]);
            util.startFunctionBranch(id);

        }
        else {
            let topBlock = util.thread.topBlock;
            this._columnValues[id] = "";

            let name = "MAP: " + fileName + " |" + colArr[1];

            name = generateFileDisplayName(name);

            if(!this._generatedMaps[topBlock]) {
                this._generatedMaps[topBlock] = {};
            }
            this._generatedMaps[topBlock][args.COLUMN] = `[${name}] VALUE`;

            addDataFile(name, this._mapResults[id].map(result => {return {"VALUE": result};}))
            
            if(this._depths[topBlock] <= 0) {
                delete this._generatedMaps[topBlock];
                delete this._depthMaps[topBlock];
                delete this._depths[topBlock];
            }
            else {
                this._depths[topBlock]--;
            }

            delete this._columnValues[id];
            delete this._mapResults[id];

            return `[${name}] VALUE`;
        }
    }

//#region PRIVATE methods

    /**
     * Finds the containing loop block of the currently running block.
     * Can be used to correctly identify which values to return while 
     * running nested loop blocks.
     * @param {object} util Block utility object provided by the runtime
     * @returns {string} The ID of the containing loop block
     */
    _findContainingLoopBlock(util) {
        let current = util.thread.peekStack(); 
        let blocks = util.target.blocks._blocks;

        while(current !== null && blocks[current].opcode !== 'datatools_mapFunctionToColumn') {
            current = blocks[current].parent;
        }

        if(!current) {
            alert("Can't find containing loop block.");
            return;
        }

        return current;
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