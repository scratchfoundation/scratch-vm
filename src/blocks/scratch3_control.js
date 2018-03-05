const Cast = require('../util/cast');

class Scratch3ControlBlocks {
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
            control_repeat: this.repeat,
            control_repeat_until: this.repeatUntil,
            control_for_each: this.forEach,
            control_forever: this.forever,
            control_wait: this.wait,
            control_wait_until: this.waitUntil,
            control_if: this.if,
            control_if_else: this.ifElse,
            control_stop: this.stop,
            control_create_clone_of: this.createClone,
            control_delete_this_clone: this.deleteClone
        };
    }

    getHats () {
        return {
            control_start_as_clone: {
                restartExistingThreads: false
            }
        };
    }

    repeat (args, util) {
        const times = Math.floor(Cast.toNumber(args.TIMES));
        // Initialize loop
        if (typeof util.stackFrame.loopCounter === 'undefined') {
            util.stackFrame.loopCounter = times;
        }
        // Only execute once per frame.
        // When the branch finishes, `repeat` will be executed again and
        // the second branch will be taken, yielding for the rest of the frame.
        // Decrease counter
        util.stackFrame.loopCounter--;
        // If we still have some left, start the branch.
        if (util.stackFrame.loopCounter >= 0) {
            util.startBranch(1, true);
        }
    }

    repeatUntil (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        // If the condition is true, start the branch.
        if (!condition) {
            util.startBranch(1, true);
        }
    }

    forEach (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);

        // The for-each block has two different but similar modes of operation,
        // based on the value to be iterated:
        //
        // 1. If the value is a string, keep INTERNAL track of the index.
        //    The value assigned to the Scratch variable will be the letter at
        //    the current index, which will increase by 1 each tick. For example:
        //
        //    for each (x) in [abcdef]:
        //      say (x)
        //
        //    ..is equivalent to:
        //
        //    set (i_) to 0
        //    repeat until (i_) > length of [abcdef]:
        //      change (i_) by 1
        //      set (x) to letter (i_) of [abcdef]
        //      say (x)
        //
        //    In this example, i_ is effectively invisible to the Scratch code:
        //    There is no way to view or change it. Also, changing (x) has no
        //    effect on the next iteration.
        //
        // 2. If the value is a number, DO NOT keep internal track of the index.
        //    When for-each is passed a number, it iterates over all the numbers
        //    from 1 to that number (inclusive). For example:
        //
        //    for each (x) in [10]:
        //      say (x)
        //
        //    ..is equivalent to:
        //
        //    set (x) to 0
        //    repeat until (x) > 10:
        //      change (x) by 1
        //      say (x)
        //
        //    The critical difference is that (x) is just a normal Scratch
        //    variable. Changing it DOES have an effect on the next iteration.
        //    This makes it possible to "skip" items, or to go back, et cetera.
        //    For example:
        //
        //    for each (x) in [10]:
        //      if (x) mod 4 = 0:
        //        say [Mod 4 - Skip the next.]
        //        change (x) by 1
        //      else:
        //        say x
        //
        //    ..would say 1, 2, 3, "Mod 4", 6, 7, "Mod 4", 10.
        //
        // The mode of operation above is decided at the beginning of the for-
        // each loop, and changing the value that is being iterated *while* it
        // is being iterated does not change the mode.

        if (typeof util.stackFrame.iterationMode === 'undefined') {
            let value = args.VALUE, mode;
            if (typeof value === 'string' && !isNaN(Number(value))) {
                mode = 'number';
            } else if (typeof value === 'number') {
                mode = 'number';
            } else {
                mode = 'string';
            }

            if (mode === 'number') {
                variable.value = 0;
            } else {
                util.stackFrame.stringIndex = 0;
            }

            util.stackFrame.iterationMode = mode;
        }

        if (util.stackFrame.iterationMode === 'string') {
            if (util.stackFrame.stringIndex < args.VALUE.length) {
                variable.value = args.VALUE[util.stackFrame.stringIndex++];
                util.startBranch(1, true);
            }
        }

        if (util.stackFrame.iterationMode === 'number') {
            if (variable.value < Number(args.VALUE)) {
                variable.value++;
                util.startBranch(1, true);
            }
        }
    }

    waitUntil (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (!condition) {
            util.yield();
        }
    }

    forever (args, util) {
        util.startBranch(1, true);
    }

    wait (args) {
        const duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, duration);
        });
    }

    if (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        }
    }

    ifElse (args, util) {
        const condition = Cast.toBoolean(args.CONDITION);
        if (condition) {
            util.startBranch(1, false);
        } else {
            util.startBranch(2, false);
        }
    }

    stop (args, util) {
        const option = args.STOP_OPTION;
        if (option === 'all') {
            util.stopAll();
        } else if (option === 'other scripts in sprite' ||
            option === 'other scripts in stage') {
            util.stopOtherTargetThreads();
        } else if (option === 'this script') {
            util.stopThisScript();
        }
    }

    createClone (args, util) {
        let cloneTarget;
        if (args.CLONE_OPTION === '_myself_') {
            cloneTarget = util.target;
        } else {
            cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
        }
        if (!cloneTarget) {
            return;
        }
        const newClone = cloneTarget.makeClone();
        if (newClone) {
            this.runtime.targets.push(newClone);
        }
    }

    deleteClone (args, util) {
        if (util.target.isOriginal) return;
        this.runtime.disposeTarget(util.target);
        this.runtime.stopForTarget(util.target);
    }
}

module.exports = Scratch3ControlBlocks;
