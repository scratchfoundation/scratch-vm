import BlockUtility from './block-utility.mjs';

/**
 * A thread is just a queue of all the block operations requested by the worker
 * @constructor
 */
class Thread {
    constructor (target) {

        this.blockOpQueue = [];

        this._target = target;

        this.runtime = target.runtime;

        this._status = 0;

        this._blockUtility = new BlockUtility(this._target, this.runtime, this);
    }

    pushOp(primitiveOpcode, args) {
        const targetId = this._target.id;
        const blockUtil = this._blockUtility;
        const opObj = {targetId, primitiveOpcode, args, blockUtil};
        this.blockOpQueue.push(opObj);
    }

    step() {
        if (this._status === Thread.STATUS_YIELD_TICK || this._status === Thread.STATUS_RUNNING) {
            this._status = Thread.STATUS_RUNNING;
            while (this.blockOpQueue.length > 0) {
                const op = this.blockOpQueue[this.blockOpQueue.length - 1];
                const returnVal = this.runtime.execBlockPrimitive(op.targetId, op.primitiveOpcode, op.args, op.blockUtil);

                // If the thread yielded we should not return yet
                if (this._status !== Thread.STATUS_RUNNING) return;

                returnVal.then(value => {
                    this._postResultValue(message, value);
                });
                this.blockOpQueue.pop();
            }
            this._status = Thread.STATUS_DONE;
        }
    }

    done() {
        return this._status === Thread.STATUS_DONE;
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