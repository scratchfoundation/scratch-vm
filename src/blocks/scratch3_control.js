var Promise = require('promise');

function Scratch3ControlBlocks(runtime) {
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
Scratch3ControlBlocks.prototype.getPrimitives = function() {
    return {
        'control_repeat': this.repeat,
        'control_repeat_until': this.repeatUntil,
        'control_forever': this.forever,
        'control_wait': this.wait,
        'control_if': this.if,
        'control_if_else': this.ifElse,
        'control_stop': this.stop
    };
};

Scratch3ControlBlocks.prototype.repeat = function(args, util) {
    // Initialize loop
    if (util.stackFrame.loopCounter === undefined) {
        util.stackFrame.loopCounter = parseInt(args.TIMES);
    }
    // Only execute once per frame.
    // When the substack finishes, `repeat` will be executed again and
    // the second branch will be taken, yielding for the rest of the frame.
    if (!util.stackFrame.executed) {
        util.stackFrame.executed = true;
        // Decrease counter
        util.stackFrame.loopCounter--;
        // If we still have some left, start the substack
        if (util.stackFrame.loopCounter >= 0) {
            util.startSubstack();
        }
    } else {
        util.stackFrame.executed = false;
        util.yieldFrame();
    }
};

Scratch3ControlBlocks.prototype.repeatUntil = function(args, util) {
    // Only execute once per frame.
    // When the substack finishes, `repeat` will be executed again and
    // the second branch will be taken, yielding for the rest of the frame.
    if (!util.stackFrame.executedInFrame) {
        util.stackFrame.executedInFrame = true;
        // If the condition is true, start the substack.
        if (!args.CONDITION) {
            util.startSubstack();
        }
    } else {
        util.stackFrame.executedInFrame = false;
        util.yieldFrame();
    }
};

Scratch3ControlBlocks.prototype.forever = function(args, util) {
    // Only execute once per frame.
    // When the substack finishes, `forever` will be executed again and
    // the second branch will be taken, yielding for the rest of the frame.
    if (!util.stackFrame.executedInFrame) {
        util.stackFrame.executedInFrame = true;
        util.startSubstack();
    } else {
        util.stackFrame.executedInFrame = false;
        util.yieldFrame();
    }
};

Scratch3ControlBlocks.prototype.wait = function(args) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, 1000 * args.DURATION);
    });
};

Scratch3ControlBlocks.prototype.if = function(args, util) {
    // Only execute one time. `if` will be returned to
    // when the substack finishes, but it shouldn't execute again.
    if (util.stackFrame.executedInFrame === undefined) {
        util.stackFrame.executedInFrame = true;
        if (args.CONDITION) {
            util.startSubstack();
        }
    }
};

Scratch3ControlBlocks.prototype.ifElse = function(args, util) {
    // Only execute one time. `ifElse` will be returned to
    // when the substack finishes, but it shouldn't execute again.
    if (util.stackFrame.executed === undefined) {
        util.stackFrame.executed = true;
        if (args.CONDITION) {
            util.startSubstack(1);
        } else {
            util.startSubstack(2);
        }
    }
};

Scratch3ControlBlocks.prototype.stop = function() {
    // @todo - don't use this.runtime
    this.runtime.stopAll();
};

module.exports = Scratch3ControlBlocks;
