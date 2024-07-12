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
     * @param {object} options - optional settings for the new task queue instance.
     * @property {number} startingTokens - the number of tokens the bucket starts with (default: `maxTokens`).
     * @property {number} maxTotalCost - reject a task if total queue cost would pass this limit (default: no limit).
     * @memberof TaskQueue
     */
    constructor (maxTokens, refillRate, options = {}) {
        this._maxTokens = maxTokens;
        this._refillRate = refillRate;
        this._pendingTaskRecords = [];
        this._tokenCount = Object.prototype.hasOwnProperty.call(options, 'startingTokens') ?
            options.startingTokens : maxTokens;
        this._maxTotalCost = Object.prototype.hasOwnProperty.call(options, 'maxTotalCost') ?
            options.maxTotalCost : Infinity;
        this._timer = new Timer();
        this._timer.start();
        this._timeout = null;
        this._lastUpdateTime = this._timer.timeElapsed();

        this._runTasks = this._runTasks.bind(this);
    }

    /**
     * Get the number of queued tasks which have not yet started.
     *
     * @readonly
     * @memberof TaskQueue
     */
    get length () {
        return this._pendingTaskRecords.length;
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
        if (this._maxTotalCost < Infinity) {
            const currentTotalCost = this._pendingTaskRecords.reduce((t, r) => t + r.cost, 0);
            if (currentTotalCost + cost > this._maxTotalCost) {
                return Promise.reject(new Error('Maximum total cost exceeded'));
            }
        }
        const newRecord = {
            cost
        };
        newRecord.promise = new Promise((resolve, reject) => {
            newRecord.cancel = () => {
                reject(new Error('Task canceled'));
            };

            // The caller, `_runTasks()`, is responsible for cost-checking and spending tokens.
            newRecord.wrappedTask = () => {
                try {
                    resolve(task());
                } catch (e) {
                    reject(e);
                }
            };
        });
        this._pendingTaskRecords.push(newRecord);

        // If the queue has been idle we need to prime the pump
        if (this._pendingTaskRecords.length === 1) {
            this._runTasks();
        }

        return newRecord.promise;
    }

    /**
     * Cancel one pending task, rejecting its promise.
     *
     * @param {Promise} taskPromise - the promise returned by `do()`.
     * @returns {boolean} - true if the task was found, or false otherwise.
     * @memberof TaskQueue
     */
    cancel (taskPromise) {
        const taskIndex = this._pendingTaskRecords.findIndex(r => r.promise === taskPromise);
        if (taskIndex !== -1) {
            const [taskRecord] = this._pendingTaskRecords.splice(taskIndex, 1);
            taskRecord.cancel();
            if (taskIndex === 0 && this._pendingTaskRecords.length > 0) {
                this._runTasks();
            }
            return true;
        }
        return false;
    }

    /**
     * Cancel all pending tasks, rejecting all their promises.
     *
     * @memberof TaskQueue
     */
    cancelAll () {
        if (this._timeout !== null) {
            this._timer.clearTimeout(this._timeout);
            this._timeout = null;
        }
        const oldTasks = this._pendingTaskRecords;
        this._pendingTaskRecords = [];
        oldTasks.forEach(r => r.cancel());
    }

    /**
     * Shorthand for calling _refill() then _spend(cost).
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
     * Loop until the task queue is empty, running each task and spending tokens to do so.
     * Any time the bucket can't afford the next task, delay asynchronously until it can.
     *
     * @memberof TaskQueue
     */
    _runTasks () {
        if (this._timeout) {
            this._timer.clearTimeout(this._timeout);
            this._timeout = null;
        }
        for (;;) {
            const nextRecord = this._pendingTaskRecords.shift();
            if (!nextRecord) {
                // We ran out of work. Go idle until someone adds another task to the queue.
                return;
            }
            if (nextRecord.cost > this._maxTokens) {
                throw new Error(`Task cost ${nextRecord.cost} is greater than bucket limit ${this._maxTokens}`);
            }
            // Refill before each task in case the time it took for the last task to run was enough to afford the next.
            if (this._refillAndSpend(nextRecord.cost)) {
                nextRecord.wrappedTask();
            } else {
                // We can't currently afford this task. Put it back and wait until we can and try again.
                this._pendingTaskRecords.unshift(nextRecord);
                const tokensNeeded = Math.max(nextRecord.cost - this._tokenCount, 0);
                const estimatedWait = Math.ceil(1000 * tokensNeeded / this._refillRate);
                this._timeout = this._timer.setTimeout(this._runTasks, estimatedWait);
                return;
            }
        }
    }
}

module.exports = TaskQueue;
