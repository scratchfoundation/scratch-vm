const Timer = require('../util/timer');

/**
 * This class uses the token bucket algorithm to control a queue of tasks.
 */
class TokenBucket {
    /**
     * Creates an instance of TokenBucket.
     * @param {number} maxTokens - the maximum number of tokens in the bucket (burst size).
     * @param {number} refillRate - the number of tokens to be added per second (sustain rate).
     * @param {*} [startingTokens=maxTokens] - the number of tokens the bucket starts with.
     * @memberof TokenBucket
     */
    constructor (maxTokens, refillRate, startingTokens = maxTokens) {
        this._maxTokens = maxTokens;
        this._refillRate = refillRate;
        this._pendingTasks = [];
        this._tokenCount = startingTokens;
        this._timer = new Timer();
        this._timer.start();
        this._lastUpdateTime = this._timer.timeElapsed();
    }

    /**
     * Wait until the token bucket is full enough, then run the provided task.
     *
     * @param {Function} task - the task to run.
     * @param {number} [cost=1] - the number of tokens this task consumes from the bucket.
     * @returns {Promise} - a promise for the task's return value.
     * @memberof TokenBucket
     */
    do (task, cost = 1) {
        let wrappedTask;
        const promise = new Promise((resolve, reject) => {
            wrappedTask = () => {
                const canRun = this._refillAndSpend(cost);
                if (canRun) {
                    // Remove this task from the queue and run it
                    this._pendingTasks.shift();
                    try {
                        resolve(task());
                    } catch (e) {
                        reject(e);
                    }

                    // Tell the next wrapper to start trying to run its task
                    if (this._pendingTasks.length > 0) {
                        const nextWrappedTask = this._pendingTasks[0];
                        nextWrappedTask();
                    }
                } else {
                    // This task can't run yet. Estimate when it will be able to, then try again.
                    this._waitUntilAffordable(cost).then(() => wrappedTask());
                }
            };
        });
        this._pendingTasks.push(wrappedTask);

        if (this._pendingTasks.length === 1) {
            wrappedTask();
        }

        return promise;
    }

    /**
     * Shorthand for calling @ _refill() then _spend(cost).
     * @see {@link TokenBucket#_refill}
     * @see {@link TokenBucket#_spend}
     * @param {number} cost - the number of tokens to try to spend.
     * @returns {boolean} true if we had enough tokens; false otherwise.
     * @memberof TokenBucket
     */
    _refillAndSpend (cost) {
        this._refill();
        return this._spend(cost);
    }

    /**
     * Refill the token bucket based on the amount of time since the last refill.
     * @memberof TokenBucket
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
     * @param {number} cost - the number of tokens to try to spend.
     * @returns {boolean} true if we had enough tokens; false otherwise.
     * @memberof TokenBucket
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
     * @memberof TokenBucket
     */
    _waitUntilAffordable (cost) {
        if (cost <= this._tokenCount) {
            return Promise.resolve();
        }
        if (cost > this._limit) {
            return Promise.reject(new Error('Task cost is greater than bucket limit'));
        }
        return new Promise(resolve => {
            const tokensNeeded = this._tokenCount - cost;
            const estimatedWait = Math.ceil(1000 * tokensNeeded / this._refillRate);
            setTimeout(resolve, estimatedWait);
        });
    }
}

module.exports = TokenBucket;
