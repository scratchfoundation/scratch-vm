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

    /**
     * Helper function to process broadcast block input (whether it's
     * input from the dropdown menu or from a plugged in input block)
     * @param {object} args The given arguments for the broadcast blocks
     * @param {object} util The utility associated with this block.
     * @return {?Variable} The broadcast message variable that matches
     *  the provided input.
     */
    processBroadcastInput_ (args, util) {
        let broadcastInput;
        if (args.BROADCAST_OPTION) {
            broadcastInput = util.runtime.getTargetForStage().lookupBroadcastMsg(
                args.BROADCAST_OPTION.id, args.BROADCAST_OPTION.name);
        } else {
            broadcastInput = util.runtime.getTargetForStage().lookupBroadcastByInputValue(args.BROADCAST_INPUT.name);
        }
        return broadcastInput;
    }

    broadcast (args, util) {
        const broadcastVar = this.processBroadcastInput_(args, util);
        if (broadcastVar) {
            const broadcastOption = broadcastVar.name;
            util.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: broadcastOption
            });
        }
    }

    broadcastAndWait (args, util) {
        const broadcastVar = this.processBroadcastInput_(args, util);
        if (broadcastVar) {
            const broadcastOption = broadcastVar.name;
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
}

module.exports = Scratch3EventBlocks;
