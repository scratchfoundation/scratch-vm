import Cast from "../util/cast.mjs";

class Scratch3ControlBlocks {
    constructor(runtime) {
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
    getPrimitives() {
        return {
            control_wait: this.wait,
            control_stop: this.stop,
            control_create_clone_of: this.createClone,
            control_delete_this_clone: this.deleteClone,
        };
    }

    getHats() {
        return {
            control_start_as_clone: {
                restartExistingThreads: false,
                label: "When I Start As Clone",
            },
        };
    }

    /**
     * List of all options for stop block.
     * @type
     */
    static get STOP_OPTIONS() {
        return ["all", "other", "this"];
    }

    async wait(args) {
        const duration = Cast.toNumber(args.DURATION);
        await new Promise((resolve) => {
            setTimeout(resolve, duration * 1000);
        });
    }

    async stop(args, util) {
        const option = args.STOP_OPTION.toLowerCase();
        if (option === "all") {
            util.stopAll();
        } else if (option === "other") {
            await util.stopOtherTargetThreads();
        } else if (option === "this") {
            util.stopThisScript();
        }
    }

    createClone(args, util) {
        // Cast argument to string
        // eslint-disable-next-line no-param-reassign
        args.CLONE_OPTION = Cast.toString(args.CLONE_OPTION);

        // Set clone target
        let cloneTarget;
        if (args.CLONE_OPTION === "myself" || args.CLONE_OPTION === "this" || args.CLONE_OPTION === "_myself_") {
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
