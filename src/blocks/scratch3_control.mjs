import Cast from "../util/cast.mjs";

class Scratch3ControlBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The "counter" block value. For compatibility with 2.0.
         * @type {number}
         */
        this._counter = 0;

        this.runtime.on("RUNTIME_DISPOSED", this.clearCounter.bind(this));
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives() {
        return {
            control_wait: this.wait,
            control_wait_until: this.waitUntil,
            control_stop: this.stop,
            control_create_clone_of: this.createClone,
            control_delete_this_clone: this.deleteClone,
        };
    }

    getHats() {
        return {
            control_start_as_clone: {
                restartExistingThreads: false,
            },
        };
    }

    waitUntil(args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (!condition) {
            util.yield();
        }
    }

    wait(args, util) {
        return Promise((resolve) => {
            setTimeout(resolve, args.SECS);
        });
    }

    async stop(args, util) {
        const option = args.STOP_OPTION.toLowerCase();
        if (option === "all") {
            await util.stopAll();
        } else if (option === "other") {
            await util.stopOtherTargetThreads();
        } else if (option === "this") {
            await util.stopThisScript();
        }
    }

    createClone(args, util) {
        // Cast argument to string
        // eslint-disable-next-line no-param-reassign
        args.CLONE_OPTION = Cast.toString(args.CLONE_OPTION);

        // Set clone target
        let cloneTarget;
        if (args.CLONE_OPTION === "_myself_") {
            cloneTarget = util.target;
        } else {
            cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
        }

        // If clone target is not found, return
        if (!cloneTarget) return;

        // Create clone
        const newClone = cloneTarget.makeClone();
        if (newClone) {
            this.runtime.addTarget(newClone);

            // Place behind the original target.
            newClone.goBehindOther(cloneTarget);
        }
    }

    deleteClone(args, util) {
        if (util.target.isOriginal) return;
        this.runtime.disposeTarget(util.target);
        this.runtime.stopForTarget(util.target);
    }
}

export default Scratch3ControlBlocks;
