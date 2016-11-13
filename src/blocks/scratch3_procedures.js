var Scratch3ProcedureBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
    this.thread = 0;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3ProcedureBlocks.prototype.getPrimitives = function () {
    return {
        procedures_defnoreturn: this.defNoReturn,
        procedures_callnoreturn: this.callNoReturn,
        procedures_callreturn: this.callReturn,
        procedures_param: this.param,
        procedures_report: this.report
    };
};

Scratch3ProcedureBlocks.prototype.defNoReturn = function (args, util) {
    // No-op: execute the blocks.
    util.stackFrame.done = true;
};

Scratch3ProcedureBlocks.prototype.callNoReturn = function (args, util) {
    if (!util.stackFrame.executed) {
        var procedureCode = args.mutation.proccode;
        var paramNames = util.getProcedureParamNames(procedureCode);
        util.stackFrame.thread = this.thread;
        this.thread++;
        for (var i = 0; i < paramNames.length; i++) {
            if (args.hasOwnProperty('input' + i)) {
                util.pushParam(paramNames[i], args['input' + i]);
            }
        }
        util.stackFrame.executed = true;
        util.startProcedure(procedureCode, util.stackFrame.thread);
    }
};

Scratch3ProcedureBlocks.prototype.callReturn = function (args, util) {
    if (!util.stackFrame.executed) {
        var procedureCode = args.mutation.proccode;
        var paramNames = util.getProcedureParamNames(procedureCode);
        util.stackFrame.thread = this.thread;
        this.thread++;
        for (var i = 0; i < paramNames.length; i++) {
            if (args.hasOwnProperty('input' + i)) {
                util.pushParam(paramNames[i], args['input' + i]);
            }
        }
        util.stackFrame.executed = true;
        util.startProcedure(procedureCode, util.stackFrame.thread);
    }
    if (util.isProcedureDone(util.stackFrame.thread)) {
        return util.getProcedureReturn(util.stackFrame.thread);
    }
};

Scratch3ProcedureBlocks.prototype.param = function (args, util) {
    var value = util.getParam(args.mutation.paramname);
    return value;
};

Scratch3ProcedureBlocks.prototype.report = function (args, util) {
    util.setProcedureReturn(args.VALUE);
};

module.exports = Scratch3ProcedureBlocks;
