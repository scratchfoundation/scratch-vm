var Thread = require('../engine/thread');

function Scratch3EventBlocks(runtime) {
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
Scratch3EventBlocks.prototype.getPrimitives = function() {
    return {
        'event_broadcast': this.broadcast,
        'event_broadcastandwait': this.broadcastAndWait,
        'event_whengreaterthan': this.hatGreaterThanPredicate
    };
};

Scratch3EventBlocks.prototype.getHats = function () {
    return {
        'event_whenflagclicked': {
            restartExistingThreads: true
        },
        /*'event_whenkeypressed': {
            restartExistingThreads: false
        },
        'event_whenthisspriteclicked': {
            restartExistingThreads: true
        },
        'event_whenbackdropswitchesto': {
            restartExistingThreads: true
        },*/
        'event_whengreaterthan': {
            restartExistingThreads: false,
            edgeTriggered: true
        },
        'event_whenbroadcastreceived': {
            restartExistingThreads: true
        }
    };
};

Scratch3EventBlocks.prototype.hatGreaterThanPredicate = function (args, util) {
    // @todo: Other cases :)
    if (args.WHENGREATERTHANMENU == 'TIMER') {
        return util.ioQuery('clock', 'projectTimer') > args.VALUE;
    }
    return false;
};

Scratch3EventBlocks.prototype.broadcast = function(args, util) {
    util.triggerHats('event_whenbroadcastreceived', {
        'BROADCAST_OPTION': args.BROADCAST_OPTION
    });
};

Scratch3EventBlocks.prototype.broadcastAndWait = function (args, util) {
    // Have we run before, triggering threads?
    if (!util.stackFrame.triggeredThreads) {
        // No - trigger hats for this broadcast.
        util.stackFrame.triggeredThreads = util.triggerHats(
            'event_whenbroadcastreceived', {
                'BROADCAST_OPTION': args.BROADCAST_OPTION
            }
        );
        if (util.stackFrame.triggeredThreads.length == 0) {
            // Nothing was started.
            return;
        }
    }
    // We've run before; check if the wait is still going on.
    var waiting = false;
    for (var i = 0; i < util.stackFrame.triggeredThreads.length; i++) {
        var thread = util.stackFrame.triggeredThreads[i];
        if (thread.status !== Thread.STATUS_DONE) {
            waiting = true;
        }
    }
    if (waiting) {
        util.yieldFrame();
    }
};

module.exports = Scratch3EventBlocks;
