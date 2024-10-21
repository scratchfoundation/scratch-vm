const Cast = require('../util/cast');

class Scratch3EventBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.runtime.on('KEY_PRESSED', key => {
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: key
            });
            this.runtime.startHats('event_whenkeypressed', {
                KEY_OPTION: 'any'
            });
        });
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            event_whentouchingobject: this.touchingObject,
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
            event_whentouchingobject: {
                restartExistingThreads: false,
                edgeActivated: true
            },
            event_whenstageclicked: {
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

    touchingObject (args, util) {
        return util.target.isTouchingObject(args.TOUCHINGOBJECTMENU);
    }

    hatGreaterThanPredicate (args, util) {
        const option = Cast.toString(args.WHENGREATERTHANMENU).toLowerCase();
        const value = Cast.toNumber(args.VALUE);
        switch (option) {
        case 'timer':
            return util.ioQuery('clock', 'projectTimer') > value;
        case 'loudness':
            return this.runtime.audioEngine && this.runtime.audioEngine.getLoudness() > value;
        }
        return false;
    }

    broadcast (args, util) {
        const broadcastVar = util.runtime.getTargetForStage().lookupBroadcastMsg(
            args.BROADCAST_OPTION.id, args.BROADCAST_OPTION.name);
        if (broadcastVar) {
            const broadcastOption = broadcastVar.name;
            util.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: broadcastOption
            });
        }
    }

    broadcastAndWait (args, util) {
        if (!util.stackFrame.broadcastVar) {
            util.stackFrame.broadcastVar = util.runtime.getTargetForStage().lookupBroadcastMsg(
                args.BROADCAST_OPTION.id, args.BROADCAST_OPTION.name);
        }
        if (util.stackFrame.broadcastVar) {
            const broadcastOption = util.stackFrame.broadcastVar.name;

            util.startHatsAndWait(
                'event_whenbroadcastreceived', {
                    BROADCAST_OPTION: broadcastOption
                }
            );
        }
    }
}

module.exports = Scratch3EventBlocks;
