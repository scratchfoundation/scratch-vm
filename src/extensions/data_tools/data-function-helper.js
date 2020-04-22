//Created by: Alex Burroughs, Zachary Fernbaugh, Phillip Carroll, and Nathanael Hood with the KSU Scratch Data Tools group
//See LICENSE for more information.

const functionBlockOpcode = "datatools_executeDataFunction";
const saveBlockOpcode = "datatools_saveFunctionData";

/**
 * This class is used to assist the Data Tools extension in mapping data sets. 
 * Given the limitations of building an extension in Scratch, this class is necessary
 * to assist mainly in finding the ID of the currently executing block and storing values
 * as map functions run. It is designed for concurrency, and will work if multiple threads
 * are running simultaneously. By keeping track of different state variables accessible by 
 * block ID, the MapHelper fully manages all possible configurations of map functions.
 */
class DataFunctionHelper {
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
        this._results = {};

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
        this._generatedData = {};

        /**
         * Holds the loop counters for each currently iterating function block. This allows us
         * to accurately insert data in the setMapResult function, as we know which row the iteration
         * is currently on. 
         * Each value is accessible by the function block's ID
         */
        this._loopCounters = {};

        /**
         * Holds the current error state of a running thread. This allows us to safely 
         * handle nested errors in a variety of cases. Only one error message should be 
         * sent to the user, despite the various issues a nested error might cause. In tracking 
         * this, we can simply end all execution if an error occurs.
         * Each value is accessible by the top block's ID
         */
        this._errors = {};

        this._savedDatasets = {};
    }

    /**
     * Gets the ID of the currently running function block in
     * the most recently calculated depth map.
     * @param {String} topBlock The identifier used to find the depth map
     * @returns {String} The ID of the currently running function block
     */
    getID(topBlock) {
        return this._depthMaps[topBlock][this._depths[topBlock]];
    }

    /**
     * Gets a value for the map input based on the top block
     * @param {Object} util Block utility provided by the runtime
     * @returns {String | Number} The current value of the running function block
     */
    getCurrentRow(args, util) {
        let id = this._findContainingLoopBlock(util, true);
        if(!id) return;
        if(typeof this._currentRowValues[id][args.COLUMN] === 'undefined') {
            this._handleError(`Can't find column [${args.COLUMN}]`, util.thread.topBlock);
            return "";
        }

        return this._currentRowValues[id][args.COLUMN];
    }

    /**
     * Gets a generated map based on the top block and column input. This
     * allows us to save time recalculating a map function that has already been
     * run, which additionally spares more issues arising.
     * @param {String} topBlock The running thread's current top block
     * @param {String} name The current function block's NAME input
     * @returns {String} The generated data set's name (if found) or null
     */
    getGeneratedData(topBlock, name) {
        if(this._generatedData[topBlock] && this._generatedData[topBlock][name]) {
            return this._generatedData[topBlock][name];
        }
        else return null;
    }

    /**
     * Checks to see if the function block depth map for the given top block needs 
     * to be recalculated and does so if needed.
     * @param {String} topBlock The running thread's current top block
     * @param {Object} util Block utility object provided by the runtime
     */
    checkRegenerateFunctionBlockDepthMap(topBlock, util) {
        if(!this._depthMaps[topBlock] || this._getOutermostBlock(util) !== this._depthMaps[topBlock][0]) {
            this._generateFunctionBlockDepthMap(util);
        }
    }

    /**
     * Checks whether the program is currently running in the toolbar.
     * Which, given the nature of the map function, is not allowed. This
     * will alert the user and help exit the program gracefully.
     * @param {String} currentBlock The currently executing block on the stack. If
     *                          the program is running in the toolbar it will
     *                          contain an opcode (i.e. 'datatools_[SOMETHING]')
     * @returns {Boolean} Whether or not the current block is in the toolbar.
     */
    checkRunningInToolbar(currentBlock) {
        if(currentBlock.includes('datatools')) {
            alert("Map Function: Can't run in toolbar.");
            return true;
        }
        return false;
    }

    saveDataset(args, util) {
        let oldName = args.FUNCTION;
        let newName = args.NAME;
        let topBlock = util.thread.topBlock;

        if(!this._savedDatasets[topBlock]) {
            this._savedDatasets[topBlock] = {};
        }

        this._savedDatasets[topBlock][oldName] = newName;
    }

    checkDataset(args, util) {
        let oldName = args.FUNCTION;
        let newName = args.NAME;
        let topBlock = util.thread.topBlock;

        if(!this._savedDatasets[topBlock]) return false;

        return this._savedDatasets[topBlock][oldName] === newName;
    }

    checkDeleteSaveData(util) {
        let topBlock = util.thread.topBlock;
        if(!this._generatedData[topBlock]) {
            delete this._savedDatasets[topBlock]
            return true;
        }
        return false;
    }

//#region Mapping Functions

    /**
     * Checks to see if the map results for an ID are empty or don't match an expected value
     * @param {String} id The current function block's ID
     * @returns {Boolean} Whether or not the map results for this ID are empty
     */
    checkMapResult(id) {
        return !this._results[id] || this._results[id].length !== this._loopCounters[id];
    }

    /**
     * Adds a map result to the current function block. This is
     * done by searching upward until a function block is found. 
     * If none are found, an error has occurred.
     * @param {String | Number} value The value to be added
     * @param {Object} util Block utility object provided by the runtime
     */
    setMapResult(args, util) {
        if(this._errors[util.thread.topBlock]) {
            let id = this._findContainingLoopBlock(util, false);
            if(!id) {
                this._deleteWorkingData(null, util.thread.topBlock);
            }
            return;
        }
        //This should always find the parent map function block
        let id = this._findContainingLoopBlock(util, true);

        if(typeof this._results[id] === 'undefined') {
            this._results[id] = [];
        }

        if(typeof this._results[id][this._loopCounters[id] - 1] === 'undefined') {
            this._results[id][this._loopCounters[id] - 1] = {};
        }

        this._results[id][this._loopCounters[id] - 1][args.COLUMN] = args.VALUE
    }

    /**
     * Executes the next step for a map function block. If the function needs to iterate,
     * this starts the next branch running. If not, the results of the function are added 
     * to a new data set in the extension and the map function will be complete.
     * @param {Object} args The arguments for the function
     * @param {Object} util Block utility object provided by the runtime
     * @param {String} id The current function block's ID
     * @param {int} rowCount The row count of the current data set
     * @param {Function} addDataFile Function to add a data file to the Data Tools extension
     * @param {Function} generateFileDisplayName Function to generate a displayable name for the generated data set
     * @param {Function} getRow Function to get a column value at a specific row
     * @returns {String} The name of the resulting data set
     */
    executeMapFunction(args, util, id, rowCount, addDataFile, generateFileDisplayName, getRow) {
        let topBlock = util.thread.topBlock;

        if(!this._errors[topBlock] && rowCount === 0) {
            this._handleError("Must select a file.", topBlock);
        }

        if(!this._loopCounters[id]) {
            this._loopCounters[id] = 0;
        }

        if(!this._errors[topBlock] && this._loopCounters[id] > 0 && this.checkMapResult(id)) {
            this._handleError("Map result not set.", topBlock);
        }
 
        if(this._errors[topBlock]) {
            this._deleteWorkingData(id, id !== topBlock ? null : topBlock);
            return "";
        }

        this._loopCounters[id]++;

        if (this._loopCounters[id] <= rowCount) {
            this._currentRowValues[id] = getRow(args.NAME, this._loopCounters[id]);

            util.startFunctionBranch(id);

        }
        else {
            let name;
            if(args.SAVE) {
                name = args.NEWNAME;
            }
            else {
                name = "map: " + args.NAME;
            }

            name = generateFileDisplayName(name);

            if(!this._generatedData[topBlock]) {
                this._generatedData[topBlock] = {};
            }
            this._generatedData[topBlock][args.NAME] = name;

            addDataFile(name, this._generateNewDataSet(this._results[id]), args.SAVE ? false : true);
            
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

    /**
     * Generates a new data set based on calculated map results.
     * This is necessary to handle potentially empty values, as not
     * each row is guaranteed to have each column set. To avoid 
     * 'undefined' values, this will replace empty columns with their
     * default (String: "", Number: 0)
     * @param {Array} results The calculated map results to be transformed
     * @returns {Array} The new data set
     */
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
//#endregion

//#region PRIVATE methods

    /**
     * Handles an error in the program by alerting the user and storing
     * the error state in this._errors using the top block. This will 
     * allow the program to finish execution gracefully. 
     * @param {String} message The message to be displayed to the user 
     * @param {String} topBlock The top block under which the error occurred
     */
    _handleError(message, topBlock) {
        alert("Map Function: " + message);
        this._errors[topBlock] = true;
    }

    /**
     * Deletes the working data for a given ID and top block. This is
     * to be called any time the program exits. Both parameters are 
     * considered optional, as some situations (i.e. nested functions) 
     * require information accessible by the top block.
     * @param {String} id The id of the currently executing loop block - optional.
     * @param {String} topBlock The top block of the current thread - optional.
     */
    _deleteWorkingData(id, topBlock) {  
        if(id) {
            delete this._currentRowValues[id];
            delete this._results[id];
            delete this._loopCounters[id];
        }

        if(topBlock) {
            delete this._generatedData[topBlock];
            delete this._depthMaps[topBlock];
            delete this._depths[topBlock];
            delete this._errors[topBlock];
        }
    }

    /**
     * Finds the containing loop block of the currently running block.
     * Can be used to correctly identify which values to return while 
     * running nested loop blocks.
     * @param {Object} util Block utility object provided by the runtime
     * @param {Boolean} showError Allow the function to handle an error.
     * @returns {String} The ID of the containing loop block
     */
    _findContainingLoopBlock(util, showError) {
        let id = util.thread.peekStack(); 
        if(this.checkRunningInToolbar(id)) return;

        let blocks = util.target.blocks._blocks;

        while(id !== null && !this._checkOpcode(blocks[id].opcode)) {
            id = blocks[id].parent;
        }

        if(showError && !id) {
            this._handleError("Can't find containing loop block.", util.thread.topBlock);
            return;
        }

        return id;
    }

    _checkOpcode(opcode, checkSave = false) {
        return opcode === functionBlockOpcode || (checkSave && opcode === saveBlockOpcode);
    }

    /**
     * Gets the outermost function block in a series of nested function blocks.
     * This helps in determining whether or not a depth map needs to be regenerated.
     * @param {Object} util Block utility object provided by the runtime
     * @returns {String} The ID of the outermost function block
     */
    _getOutermostBlock(util) {
        let outermost;
        let executingBlock = util.thread.peekStack();
        //We can't run this in the toolbar
        if(this.checkRunningInToolbar(executingBlock)) return null;

        let blocks = util.target.blocks._blocks;         
        let options = Object.keys(blocks).filter(key => this._checkOpcode(blocks[key].opcode));

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
     * @param {Object} util Block utility object provided by the runtime
     */
    _generateFunctionBlockDepthMap(util) {
        let blocks = util.target.blocks._blocks;         
        let options = Object.keys(blocks).filter(key => this._checkOpcode(blocks[key].opcode, true));
        let outermost = this._getOutermostBlock(util);
        //We can't run this function in the toolbar
        if(!outermost) return;

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
            if(blocks[block] && blocks[block].opcode !== saveBlockOpcode) {
                depth++;
                //results[block] = {depth, topBlock: util.thread.topBlock};
                if(block) {
                    results.push(block);
                }
            }

        }
        this._depthMaps[util.thread.topBlock] = results;
        this._depths[util.thread.topBlock] = this._depthMaps[util.thread.topBlock].length - 1;
    }
}
//#endregion

module.exports = DataFunctionHelper