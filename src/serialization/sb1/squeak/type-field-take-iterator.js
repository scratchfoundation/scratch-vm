const {Header} = require('../binary-tokens');

class SB1TokenObjectTakeIterator {
    constructor (valueIterator, maxLength = Infinity) {
        this.valueIterator = valueIterator;
        this.maxLength = maxLength;

        this.index = 0;
        this.queue = [];
    }

    [Symbol.iterator] () {
        return this;
    }

    _next () {
        const next = this.valueIterator.next();
        if (next.done) {
            return;
        }

        const value = next.value;
        this.queue.push(value);
        if (value instanceof Header) {
            for (let i = 0; i < value.size; i++) {
                this._next();
            }
        }
    }

    next () {
        if (this.index === this.maxLength && this.queue.length === 0) {
            return {
                value: null,
                done: true
            };
        }

        if (this.queue.length === 0) {
            this.index += 1;
            this._next();
        }

        if (this.queue.length) {
            return {
                value: this.queue.shift(),
                done: false
            };
        } else {
            return {
                value: null,
                done: true
            };
        }
    }
}

exports.SB1TokenObjectTakeIterator = SB1TokenObjectTakeIterator;
