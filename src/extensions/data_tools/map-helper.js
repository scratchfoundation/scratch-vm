class MapHelper {
    constructor() {
        this._columnValues = {};

        this._mapResults = {};

        this._depthMaps = {};

        this._depths = {};

        this._generatedMaps = {};
    }

    getID(topBlock) {
        return this._depthMaps[topBlock][this._depths[topBlock]];
    }

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

    getMapInput(util) {
        if(!this._depthMaps[util.thread.topBlock]) {
            this._generateFunctionBlockDepthMap(util);
        }
        let id = this._depthMaps[util.thread.topBlock][this._depths[util.thread.topBlock]];
        return this._columnValues[id];
    }

    setMapResult(value, util) {
        //This should always find the parent map function block
        let current = util.thread.peekStack(); 
        let blocks = util.target.blocks._blocks;

        while(current !== null && blocks[current].opcode !== 'datatools_mapFunctionToColumn') {
            current = blocks[current].parent;
        }

        if(typeof this._mapResults[current] === 'undefined') {
            this._mapResults[current] = [];
        }

        this._mapResults[current].push(value);
    }

    getGeneratedMap(topBlock, column) {
        if(this._generatedMaps[topBlock] && this._generatedMaps[topBlock][column]) {
            return this._generatedMaps[topBlock][column];
        }
        else return null;
    }

    checkRegenerateFunctionBlockDepthMap(topBlock, util) {
        if(!this._depthMaps[topBlock] || this._getOutermostBlock(util) !== this._depthMaps[topBlock][0]) {
            this._generateFunctionBlockDepthMap(util);
        }
    }

    checkMapResult(id) {
        return this._mapResults[id] === "";
    }

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
            }
            else {
                this._depths[topBlock]--;
            }
            return `[${name}] VALUE`;
        }
    }

    /* PRIVATE methods */

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

module.exports = MapHelper