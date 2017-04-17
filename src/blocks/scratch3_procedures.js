class Scratch3ProcedureBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            procedures_defnoreturn: this.defNoReturn,
            procedures_callnoreturn: this.callNoReturn,
            procedures_param: this.param
        };
    }

    defNoReturn () {
        // No-op: execute the blocks.
    }

    callNoReturn (args, util) {
        if (!util.stackFrame.executed) {
            const procedureCode = args.mutation.proccode;
            const paramNames = util.getProcedureParamNames(procedureCode);
            for (let i = 0; i < paramNames.length; i++) {
                if (args.hasOwnProperty(`input${i}`)) {
                    util.pushParam(paramNames[i], args[`input${i}`]);
                }
            }
            util.stackFrame.executed = true;
            util.startProcedure(procedureCode);
        }
    }

    param (args, util) {
        const value = util.getParam(args.mutation.paramname);
        return value;
    }
}

module.exports = Scratch3ProcedureBlocks;
