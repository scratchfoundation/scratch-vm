const Timer = require('../util/timer');

class RateLimiter {
    /**
     * A utility for limiting the rate of repetitive send operations, such as
     * bluetooth messages being sent to hardware devices. It uses the token bucket
     * strategy: a counter accumulates tokens at a steady rate, and each send costs
     * a token. If no tokens remain, it's not okay to send.
     * @param {number} maxRate the maximum number of sends allowed per second
     * @constructor
     */
    constructor (maxRate) {
        /**
         * The maximum number of tokens.
         * @type {number}
         */
        this._maxTokens = maxRate;

        /**
         * The interval in milliseconds for refilling one token. It is calculated
         * so that the tokens will be filled to maximum in one second.
         * @type {number}
         */
        this._refillInterval = 1000 / maxRate;

        /**
         * The current number of tokens in the bucket.
         * @type {number}
         */
        this._count = this._maxTokens;

        this._timer = new Timer();
        this._timer.start();

        /**
         * The last time in milliseconds when the token count was updated.
         * @type {number}
         */
        this._lastUpdateTime = this._timer.timeElapsed();
    }

    /**
     * Check if it is okay to send a message, by updating the token count,
     * taking a token and then checking if we are still under the rate limit.
     * @return {boolean} true if we are under the rate limit
     */
    okayToSend () {
        // Calculate the number of tokens to refill the bucket with, based on the
        // amount of time since the last refill.
        const now = this._timer.timeElapsed();
        const timeSinceRefill = now - this._lastUpdateTime;
        const refillCount = Math.floor(timeSinceRefill / this._refillInterval);

        // If we're adding at least one token, reset _lastUpdateTime to now.
        // Otherwise, don't reset it so that we can continue measuring time until
        // the next refill.
        if (refillCount > 0) {
            this._lastUpdateTime = now;
        }

        // Refill the tokens up to the maximum
        this._count = Math.min(this._maxTokens, this._count + refillCount);

        // If we have at least one token, use one, and it's okay to send.
        if (this._count > 0) {
            this._count--;
            return true;
        }
        return false;
    }
}

module.exports = RateLimiter;
