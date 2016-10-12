
function Scratch3ProcedureBlocks(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
    this.running = false;
    this.runState = 0;
    this.currentThread = null;
}

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3ProcedureBlocks.prototype.getPrimitives = function() {
    return {
        'procedures_defnoreturn': this.defNoReturn,
        'procedures_callnoreturn': this.callNoReturn,
        'procedures_defreturn': this.defReturn,
        'procedures_callreturn': this.callReturn,
        'procedures_report': this.report
    };
};

Scratch3ProcedureBlocks.prototype.defNoReturn = function () {
    // No-op: execute the blocks.
};

Scratch3ProcedureBlocks.prototype.defReturn = function (args) {
    // No-op: execute the blocks.
    if (args.RETURN) {
        this.report = args.RETURN;
    }
    this.runState = 2;
};

Scratch3ProcedureBlocks.prototype.callNoReturn = function (args, util) {
    if (!util.stackFrame.executed) {
        var procedureName = args.mutation.name;
        util.stackFrame.executed = true;
        util.startProcedure(procedureName);
    }
};

Scratch3ProcedureBlocks.prototype.callReturn = function (args, util) {
    if (!util.stackFrame.executed || this.runState == 0) {
        this.runState = 1;
        var procedureName = args.mutation.name;
        util.stackFrame.executed = true;
        util.startProcedure(procedureName);
        this.currentThread = util.getThread();
    } else if (this.runState == 2) {
        this.runState = 0;
        this.currentThread = null;
        return this.report;
    }
};

Scratch3ProcedureBlocks.prototype.report = function (args, util) {
    // No-op: execute the blocks.
    if (util.getThread === this.currentThread) {
        this.report = args.VALUE;
    }
};

module.exports = Scratch3ProcedureBlocks;
