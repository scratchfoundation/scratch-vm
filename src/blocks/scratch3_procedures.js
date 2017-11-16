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
            procedures_definition: this.definition,
            procedures_call: this.call,
            argument_reporter_string_number: this.param,
            argument_reporter_boolean: this.param
        };
    }

    definition () {
        // No-op: execute the blocks.
    }

    call (args, util) {
        if (!util.stackFrame.executed) {
            const procedureCode = args.mutation.proccode;
            const paramNames = util.getProcedureParamNames(procedureCode);

            // If null, procedure could not be found, which can happen if custom
            // block is dragged between sprites without the definition.
            // Match Scratch 2.0 behavior and noop.
            if (paramNames === null) {
                return;
            }

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
        const value = util.getParam(args.VALUE);
        return value;
    }
}

module.exports = Scratch3ProcedureBlocks;
