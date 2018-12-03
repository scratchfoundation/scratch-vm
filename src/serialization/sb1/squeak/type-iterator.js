const {FieldObjectHeader, Header} = require('./fields');
const {FieldObject} = require('./field-object');
const {TYPES} = require('./ids');
const {FIELD_OBJECT_CONTRUCTORS} = require('./types');

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
            FIELD_OBJECT_CONTRUCTORS[classId] !== null ||
            header instanceof FieldObjectHeader
        ) {
            const constructor = FIELD_OBJECT_CONTRUCTORS[header.classId] || FieldObject;

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
