function Scratch3ProcedureBlocks(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
}

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3ProcedureBlocks.prototype.getPrimitives = function() {
    return {
        'procedures_defnoreturn': this.defNoReturn,
        'procedures_callnoreturn': this.callNoReturn,
        'procedures_callreturn' : this.callReturn,
        'procedures_report': this.report,
        'procedures_defreturn': this.defReturn
    };
};

Scratch3ProcedureBlocks.prototype.defNoReturn = function () {
    // No-op: execute the blocks.
};

Scratch3ProcedureBlocks.prototype.defReturn = function (args) {
    this.REPORT = ((typeof this.REPORT === 'undefined') ?
        args.RETURN : this.REPORT);
};

Scratch3ProcedureBlocks.prototype.callNoReturn = function (args, util) {
    if (!util.stackFrame.executed) {
        var procedureName = args.mutation.name;
        util.stackFrame.executed = true;
        util.startProcedure(procedureName);
    }
};

Scratch3ProcedureBlocks.prototype.callReturn = function (args, util) {
    if (!util.stackFrame.executed) {
        var procedureName = args.mutation.name;
        util.stackFrame.executed = true;
        if (!util.stackFrame.startedThreads) {
            // No - start hats for this broadcast.
            util.stackFrame.startedThreads = util.startHats(
                'procedures_defreturn', {
                    'NAME': procedureName
                }
            );
            if (util.stackFrame.startedThreads.length == 0) {
                // Nothing was started.
                return '';
            }
        }
        // We've run before; check if the wait is still going on.
        var instance = this;
        var waiting = util.stackFrame.startedThreads.some(function(thread) {
            return instance.runtime.isActiveThread(thread);
        });
        if (waiting) {
            util.yieldFrame();
        }
        if (!waiting) {
            var rep = this.REPORT;
            delete this.REPORT;
            return rep;
        }
    }
};

Scratch3ProcedureBlocks.prototype.report = function (args) {
    this.REPORT = args.VALUE;
};

module.exports = Scratch3ProcedureBlocks;
