const Timer = require('../util/timer');

/**
 * This class uses the token bucket algorithm to control a queue of tasks.
 */
class TaskQueue {
    /**
     * Creates an instance of TaskQueue.
     * To allow bursts, set `maxTokens` to several times the average task cost.
     * To prevent bursts, set `maxTokens` to the cost of the largest tasks.
     * Note that tasks with a cost greater than `maxTokens` will be rejected.
     *
     * @param {number} maxTokens - the maximum number of tokens in the bucket (burst size).
     * @param {number} refillRate - the number of tokens to be added per second (sustain rate).
     * @param {number} [startingTokens=maxTokens] - the number of tokens the bucket starts with.
     * @memberof TaskQueue
     */
    constructor (maxTokens, refillRate, startingTokens = maxTokens) {
        this._maxTokens = maxTokens;
        this._refillRate = refillRate;
        this._pendingTaskRecords = [];
        this._tokenCount = startingTokens;
        this._timer = new Timer();
        this._timer.start();
        this._timeout = null;
        this._lastUpdateTime = this._timer.timeElapsed();
    }

    /**
     * Wait until the token bucket is full enough, then run the provided task.
     *
     * @param {Function} task - the task to run.
     * @param {number} [cost=1] - the number of tokens this task consumes from the bucket.
     * @returns {Promise} - a promise for the task's return value.
     * @memberof TaskQueue
     */
    do (task, cost = 1) {
        const newRecord = {};
        const promise = new Promise((resolve, reject) => {
            newRecord.wrappedTask = () => {
                const canRun = this._refillAndSpend(cost);
                if (canRun) {
                    // Remove this task from the queue and run it
                    this._pendingTaskRecords.shift();
                    try {
                        resolve(task());
                    } catch (e) {
                        reject(e);
                    }

                    // Tell the next wrapper to start trying to run its task
                    if (this._pendingTaskRecords.length > 0) {
                        const nextRecord = this._pendingTaskRecords[0];
                        nextRecord.wrappedTask();
                    }
                } else {
                    // This task can't run yet. Estimate when it will be able to, then try again.
                    newRecord.reject = reject;
                    this._waitUntilAffordable(cost).then(() => newRecord.wrappedTask());
                }
            };
        });
        this._pendingTaskRecords.push(newRecord);

        if (this._pendingTaskRecords.length === 1) {
            newRecord.wrappedTask();
        }

        return promise;
    }

    /**
     * Cancel all pending tasks, rejecting all their promises.
     *
     * @memberof TaskQueue
     */
    cancelAll () {
        if (this._timeout !== null) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        this._pendingTaskRecords.forEach(r => r.reject());
        this._pendingTaskRecords = [];
    }

    /**
     * Shorthand for calling @ _refill() then _spend(cost).
     *
     * @see {@link TaskQueue#_refill}
     * @see {@link TaskQueue#_spend}
     * @param {number} cost - the number of tokens to try to spend.
     * @returns {boolean} true if we had enough tokens; false otherwise.
     * @memberof TaskQueue
     */
    _refillAndSpend (cost) {
        this._refill();
        return this._spend(cost);
    }

    /**
     * Refill the token bucket based on the amount of time since the last refill.
     *
     * @memberof TaskQueue
     */
    _refill () {
        const now = this._timer.timeElapsed();
        const timeSinceRefill = now - this._lastUpdateTime;
        if (timeSinceRefill <= 0) return;

        this._lastUpdateTime = now;
        this._tokenCount += timeSinceRefill * this._refillRate / 1000;
        this._tokenCount = Math.min(this._tokenCount, this._maxTokens);
    }

    /**
     * If we can "afford" the given cost, subtract that many tokens and return true.
     * Otherwise, return false.
     *
     * @param {number} cost - the number of tokens to try to spend.
     * @returns {boolean} true if we had enough tokens; false otherwise.
     * @memberof TaskQueue
     */
    _spend (cost) {
        if (cost <= this._tokenCount) {
            this._tokenCount -= cost;
            return true;
        }
        return false;
    }

    /**
     * Create a Promise which will resolve when the bucket will be able to "afford" the given cost.
     * Note that this won't refill the bucket, so make sure to refill after the promise resolves.
     *
     * @param {number} cost - wait until the token count is at least this much.
     * @returns {Promise} - to be resolved once the bucket is due for a token count greater than or equal to the cost.
     * @memberof TaskQueue
     */
    _waitUntilAffordable (cost) {
        if (cost <= this._tokenCount) {
            return Promise.resolve();
        }
        if (!(cost <= this._maxTokens)) {
            return Promise.reject(new Error(`Task cost ${cost} is greater than bucket limit ${this._maxTokens}`));
        }
        return new Promise(resolve => {
            const tokensNeeded = Math.max(cost - this._tokenCount, 0);
            const estimatedWait = Math.ceil(1000 * tokensNeeded / this._refillRate);

            let timeout = null;
            const onTimeout = () => {
                if (this._timeout === timeout) {
                    this._timeout = null;
                }
                resolve();
            };
            this._timeout = timeout = setTimeout(onTimeout, estimatedWait);
        });
    }
}

module.exports = TaskQueue;
