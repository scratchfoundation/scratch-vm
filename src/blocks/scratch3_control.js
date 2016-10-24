var Cast = require('../util/cast');
var Timer = require('../util/timer');

var Scratch3ControlBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3ControlBlocks.prototype.getPrimitives = function () {
    return {
        control_repeat: this.repeat,
        control_repeat_until: this.repeatUntil,
        control_forever: this.forever,
        control_wait: this.wait,
        control_wait_until: this.waitUntil,
        control_if: this.if,
        control_if_else: this.ifElse,
        control_stop: this.stop,
        control_create_clone_of: this.createClone,
        control_delete_this_clone: this.deleteClone
    };
};

Scratch3ControlBlocks.prototype.getHats = function () {
    return {
        control_start_as_clone: {
            restartExistingThreads: false
        }
    };
};

Scratch3ControlBlocks.prototype.repeat = function (args, util) {
    var times = Math.floor(Cast.toNumber(args.TIMES));
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
};

Scratch3ControlBlocks.prototype.repeatUntil = function (args, util) {
    var condition = Cast.toBoolean(args.CONDITION);
    // If the condition is true, start the branch.
    if (!condition) {
        util.startBranch(1, true);
    }
};

Scratch3ControlBlocks.prototype.waitUntil = function (args, util) {
    var condition = Cast.toBoolean(args.CONDITION);
    if (!condition) {
        util.yield();
    }
};

Scratch3ControlBlocks.prototype.forever = function (args, util) {
    util.startBranch(1, true);
};

Scratch3ControlBlocks.prototype.wait = function (args, util) {
    if (!util.stackFrame.timer) {
        util.stackFrame.timer = new Timer();
        util.stackFrame.timer.start();
        util.yield();
        this.runtime.requestRedraw();
    } else {
        var duration = Math.max(0, 1000 * Cast.toNumber(args.DURATION));
        if (util.stackFrame.timer.timeElapsed() < duration) {
            util.yield();
        }
    }
};

Scratch3ControlBlocks.prototype.if = function (args, util) {
    var condition = Cast.toBoolean(args.CONDITION);
    if (condition) {
        util.startBranch(1, false);
    }
};

Scratch3ControlBlocks.prototype.ifElse = function (args, util) {
    var condition = Cast.toBoolean(args.CONDITION);
    if (condition) {
        util.startBranch(1, false);
    } else {
        util.startBranch(2, false);
    }
};

Scratch3ControlBlocks.prototype.stop = function (args, util) {
    var option = args.STOP_OPTION;
    if (option === 'all') {
        util.stopAll();
    } else if (option === 'other scripts in sprite' ||
        option === 'other scripts in stage') {
        util.stopOtherTargetThreads();
    } else if (option === 'this script') {
        util.stopThread();
    }
};

Scratch3ControlBlocks.prototype.createClone = function (args, util) {
    var cloneTarget;
    if (args.CLONE_OPTION === '_myself_') {
        cloneTarget = util.target;
    } else {
        cloneTarget = this.runtime.getSpriteTargetByName(args.CLONE_OPTION);
    }
    if (!cloneTarget) {
        return;
    }
    var newClone = cloneTarget.makeClone();
    if (newClone) {
        this.runtime.targets.push(newClone);
    }
};

Scratch3ControlBlocks.prototype.deleteClone = function (args, util) {
    if (util.target.isOriginal) return;
    this.runtime.disposeTarget(util.target);
    this.runtime.stopForTarget(util.target);
};

module.exports = Scratch3ControlBlocks;
