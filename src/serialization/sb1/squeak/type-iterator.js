const {ExtendedObjectHeader, Header} = require('./fields');
const {TYPES} = require('./ids');
const {UnknownData, EXTENDED_CONSTRUCTORS} = require('./types');

class TypeIterator {
    constructor (valueIterator) {
        this.valueIterator = valueIterator;
    }

    [Symbol.iterator] () {
        return this;
    }

    next () {
        const nextHeader = this.valueIterator.next();
        if (nextHeader.done) {
            return nextHeader;
        }

        const header = nextHeader.value;
        const {classId} = header;

        let value = header;

        if (header instanceof Header) {
            value = [];

            for (let i = 0; i < header.size; i++) {
                value.push(this.next().value);
            }
        }

        if (
            EXTENDED_CONSTRUCTORS[classId] !== null ||
            header instanceof ExtendedObjectHeader
        ) {
            const constructor = EXTENDED_CONSTRUCTORS[header.classId] || UnknownData;

            value = new constructor({
                classId: header.classId,
                version: header.version,
                fields: value,
            });
        }

        return {
            value,
            done: false
        };
    }
}

exports.TypeIterator = TypeIterator;
