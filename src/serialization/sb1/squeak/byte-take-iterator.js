class ByteTakeIterator {
    constructor (iter, maxPosition = Infinity) {
        this.iter = iter;
        this.maxPosition = maxPosition;
    }

    [Symbol.iterator] () {
        return this;
    }

    next () {
        if (this.iter.stream.position >= this.maxPosition) {
            return {
                value: null,
                done: true
            };
        }

        return this.iter.next();
    }
}

exports.ByteTakeIterator = ByteTakeIterator;
