class SB1TakeIterator {
    constructor (iter, maxLength = Infinity) {
        this.iter = iter;
        this.maxLength = maxLength;
        this.index = 0;
    }

    [Symbol.iterator] () {
        return this;
    }

    next () {
        if (this.index === this.maxLength) {
            return {
                value: null,
                done: true
            };
        }

        this.index += 1;
        return this.iter.next();
    }
}

exports.SB1TakeIterator = SB1TakeIterator;
