const {ExtendedObjectHeader} = require('../binary-token');
const {UnknownData, EXTENDED_CONSTRUCTORS} = require('../types');
const {TYPES} = require('../type-ids');

const objectArray = function (objectIterator, header) {
    const array = [];

    for (let i = 0; i < header.size; i++) {
        array.push(objectIterator.next().value);
    }

    return array;
};

const objectExtended = function (objectIterator, header) {
    const fields = [];

    for (let i = 0; i < header.size; i++) {
        fields.push(objectIterator.next().value);
    }

    const constructor = EXTENDED_CONSTRUCTORS[header.classId] || UnknownData;

    return new constructor({
        classId: header.classId,
        value: null,
        version: header.version,
        fields,
    });
};

class SB1ObjectIterator {
    constructor (valueIterator, length) {
        this.valueIterator = valueIterator;
        this.length = length;
    }

    [Symbol.iterator] () {
        return this;
    }

    read (header, classId) {
        let value = header;

        switch (classId) {
        case TYPES.ARRAY:
        case TYPES.ORDERED_COLLECTION:
        case TYPES.SET:
        case TYPES.IDENTITY_SET:
            value = objectArray(this, header);
            break;

        case TYPES.DICTIONARY:
        case TYPES.IDENTITY_DICTIONARY:
            value = objectArray(this, header);
            break;

        case TYPES.POINT:
        case TYPES.RECTANGLE:
        case TYPES.FORM:
        case TYPES.SQUEAK:
            value = objectExtended(this, header);
            break;

        default:
            if (header instanceof ExtendedObjectHeader) {
                value = objectExtended(this, header);
            }
        }

        return {
            value,
            done: false
        };
    }

    next () {
        const nextHeader = this.valueIterator.next();
        if (nextHeader.done) {
            return {
                value: null,
                done: true
            };
        }

        const header = nextHeader.value;

        return this.read(header, header.classId);
    }
}

window.SB1ObjectIterator = SB1ObjectIterator;
