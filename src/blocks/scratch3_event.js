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
        'event_whenkeypressed': {
            restartExistingThreads: false
        },
        'event_whenthisspriteclicked': {
            restartExistingThreads: true
        },
		/*
        'event_whenbackdropswitchesto': {
            restartExistingThreads: true
        },*/
        'event_whengreaterthan': {
            restartExistingThreads: false,
            edgeActivated: true
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
    util.startHats('event_whenbroadcastreceived', {
        'BROADCAST_OPTION': args.BROADCAST_OPTION
    });
};

Scratch3EventBlocks.prototype.broadcastAndWait = function (args, util) {
    // Have we run before, starting threads?
    if (!util.stackFrame.startedThreads) {
        // No - start hats for this broadcast.
        util.stackFrame.startedThreads = util.startHats(
            'event_whenbroadcastreceived', {
                'BROADCAST_OPTION': args.BROADCAST_OPTION
            }
        );
        if (util.stackFrame.startedThreads.length == 0) {
            // Nothing was started.
            return;
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
};

module.exports = Scratch3EventBlocks;
