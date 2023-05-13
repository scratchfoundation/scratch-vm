import BlockUtility from './block-utility.mjs';

/**
 * A thread is just a queue of all the block operations requested by the worker
 * @constructor
 */
class Thread {
    constructor (target, returnValueCallback) {

        this.blockOpQueue = [];

        this._target = target;

        if (target.runtime) {
            this.runtime = target.runtime;
        } else {
            throw new Error('Targets must include a runtime to be used in threads');
        }

        this._status = 0;

        this._blockUtility = new BlockUtility(this._target, this.runtime, this);

        this.returnValueCallback = returnValueCallback;
    }

    pushOp(primitiveOpcode, args, token) {
        const targetId = this._target.id;
        const blockUtil = this._blockUtility;
        const opObj = {targetId, primitiveOpcode, args, blockUtil, token};
        this.blockOpQueue.push(opObj);

        this._status = Thread.STATUS_RUNNING;
    }

    step() {
        if (this._status === Thread.STATUS_YIELD_TICK || this._status === Thread.STATUS_RUNNING) {
            this._status = Thread.STATUS_RUNNING;
            while (this.blockOpQueue.length > 0) {
                const op = this.blockOpQueue[0];

                const returnVal = this.runtime.execBlockPrimitive(op.targetId, op.primitiveOpcode, op.args, op.blockUtil);

                // If the thread has yielded then we need to stall until the next tick
                if (this._status === Thread.STATUS_YIELD_TICK || this._status === Thread.STATUS_YIELD) return;

                this.returnValueCallback({token: op.token}, returnVal);
                this.blockOpQueue.shift();
            }
            if (this._status === Thread.STATUS_RUNNING) {
                this._status = Thread.STATUS_IDLE;
            }
        }
    }

    done() {
        return this._status == Thread.STATUS_DONE;
    }

    /**
     * Thread status for initialized or running thread.
     * This is the default state for a thread - execution should run normally,
     * stepping from block to block.
     * @const
     */
    static get STATUS_RUNNING () {
        return 0;
    }

    /**
     * Threads are in this state when a primitive is waiting on a promise;
     * execution is paused until the promise changes thread status.
     * @const
     */
    static get STATUS_PROMISE_WAIT () {
        return 1;
    }

    /**
     * Thread status for yield.
     * @const
     */
    static get STATUS_YIELD () {
        return 2;
    }

    /**
     * Thread status for a single-tick yield. This will be cleared when the
     * thread is resumed.
     * @const
     */
    static get STATUS_YIELD_TICK () {
        return 3;
    }

    /**
     * Thread status for a finished/done thread.
     * Thread is in this state when there are no more blocks to execute.
     * @const
     */
    static get STATUS_DONE () {
        return 4;
    }

    /**
     * Thread is done with everything in its block queue
     * Idling waiting for a new message
     * @const
     */
    static get STATUS_IDLE () {
        return 5;
    }

    /**
     * Get the status of this thread.
     */
    getStatus() {
        return this._status;
    }

    /**
     * Set the status of this thread.
     */
    setStatus(newStatus) {
        this._status = newStatus;
    }
}

export default Thread;