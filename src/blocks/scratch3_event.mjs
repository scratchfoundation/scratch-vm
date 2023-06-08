/* eslint-disable no-param-reassign */
/* eslint-disable default-case */
import Cast from "../util/cast.mjs";
import Thread from "../engine/thread.mjs";

export default class Scratch3EventBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.runtime.on("KEY_PRESSED", (key) => {
            this.runtime.startHats("event_whenkeypressed", key);
            this.runtime.startHats("event_whenkeypressed", "any");
        });
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives() {
        return {
            event_whentouchingobject: this.touchingObject,
            event_broadcast: this.broadcast,
            event_broadcastandwait: this.broadcastAndWait,
            event_whengreaterthan: this.hatGreaterThanPredicate,
        };
    }

    getHats() {
        return {
            event_whenflagclicked: {
                label: "When Flag Clicked",
                restartExistingThreads: true,
            },
            event_whenkeypressed: {
                label: "When Key Pressed",
                restartExistingThreads: false,
            },
            event_whenthisspriteclicked: {
                label: "When This Sprite Clicked",
                restartExistingThreads: true,
            },
            event_whentouchingobject: {
                label: "When Touching",
                restartExistingThreads: false,
                edgeActivated: true,
            },
            event_whenstageclicked: {
                label: "When Stage Clicked",
                restartExistingThreads: true,
            },
            event_whenbackdropswitchesto: {
                label: "When Backdrop Switches To",
                restartExistingThreads: true,
            },
            event_whengreaterthan: {
                label: "When Greater Than",
                restartExistingThreads: false,
                edgeActivated: true,
            },
            event_whenbroadcastreceived: {
                label: "When Broadcast Received",
                restartExistingThreads: true,
            },
        };
    }

    touchingObject(args, util) {
        return util.target.isTouchingObject(args.TOUCHINGOBJECTMENU);
    }

    hatGreaterThanPredicate(args, util) {
        const option = Cast.toString(args.WHENGREATERTHANMENU).toLowerCase();
        const value = Cast.toNumber(args.VALUE);
        switch (option) {
            case "timer":
                return util.ioQuery("clock", "projectTimer") > value;
            case "loudness":
                return this.runtime.audioEngine && this.runtime.audioEngine.getLoudness() > value;
        }
        return false;
    }

    broadcast(args, util) {
        const messageId = args.BROADCAST_OPTION.id;
        util.startHats("event_whenbroadcastreceived", messageId);
    }

    async broadcastAndWait(args, util) {
        const messageId = args.BROADCAST_OPTION.id;
        await util.startHats("event_whenbroadcastreceived", messageId);
    }
}
