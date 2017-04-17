const Cast = require('../util/cast');

class Scratch3EventBlocks {
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
            event_broadcast: this.broadcast,
            event_broadcastandwait: this.broadcastAndWait,
            event_whengreaterthan: this.hatGreaterThanPredicate
        };
    }

    getHats () {
        return {
            event_whenflagclicked: {
                restartExistingThreads: true
            },
            event_whenkeypressed: {
                restartExistingThreads: false
            },
            event_whenthisspriteclicked: {
                restartExistingThreads: true
            },
            event_whenbackdropswitchesto: {
                restartExistingThreads: true
            },
            event_whengreaterthan: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_whenbroadcastreceived: {
                restartExistingThreads: true
            }
        };
    }

    hatGreaterThanPredicate (args, util) {
        const option = Cast.toString(args.WHENGREATERTHANMENU).toLowerCase();
        const value = Cast.toNumber(args.VALUE);
        // @todo: Other cases :)
        if (option === 'timer') {
            return util.ioQuery('clock', 'projectTimer') > value;
        }
        return false;
    }

    broadcast (args, util) {
        const broadcastOption = Cast.toString(args.BROADCAST_OPTION);
        util.startHats('event_whenbroadcastreceived', {
            BROADCAST_OPTION: broadcastOption
        });
    }

    broadcastAndWait (args, util) {
        const broadcastOption = Cast.toString(args.BROADCAST_OPTION);
        // Have we run before, starting threads?
        if (!util.stackFrame.startedThreads) {
            // No - start hats for this broadcast.
            util.stackFrame.startedThreads = util.startHats(
                'event_whenbroadcastreceived', {
                    BROADCAST_OPTION: broadcastOption
                }
            );
            if (util.stackFrame.startedThreads.length === 0) {
                // Nothing was started.
                return;
            }
        }
        // We've run before; check if the wait is still going on.
        const instance = this;
        const waiting = util.stackFrame.startedThreads.some(thread => instance.runtime.isActiveThread(thread));
        if (waiting) {
            util.yield();
        }
    }
}

module.exports = Scratch3EventBlocks;
