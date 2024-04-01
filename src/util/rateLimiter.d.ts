export = RateLimiter;
declare class RateLimiter {
    /**
     * A utility for limiting the rate of repetitive send operations, such as
     * bluetooth messages being sent to hardware devices. It uses the token bucket
     * strategy: a counter accumulates tokens at a steady rate, and each send costs
     * a token. If no tokens remain, it's not okay to send.
     * @param {number} maxRate the maximum number of sends allowed per second
     * @constructor
     */
    constructor(maxRate: number);
    /**
     * The maximum number of tokens.
     * @type {number}
     */
    _maxTokens: number;
    /**
     * The interval in milliseconds for refilling one token. It is calculated
     * so that the tokens will be filled to maximum in one second.
     * @type {number}
     */
    _refillInterval: number;
    /**
     * The current number of tokens in the bucket.
     * @type {number}
     */
    _count: number;
    _timer: Timer;
    /**
     * The last time in milliseconds when the token count was updated.
     * @type {number}
     */
    _lastUpdateTime: number;
    /**
     * Check if it is okay to send a message, by updating the token count,
     * taking a token and then checking if we are still under the rate limit.
     * @return {boolean} true if we are under the rate limit
     */
    okayToSend(): boolean;
}
import Timer = require("../util/timer");
