const TYPES = {
    NULL: 1,
    TRUE: 2,
    FALSE: 3,
    SMALL_INT: 4,
    SMALL_INT_16: 5,
    LARGE_INT_POSITIVE: 6,
    LARGE_INT_NEGATIVE: 7,
    FLOATING: 8,
    STRING: 9,
    SYMBOL: 10,
    BYTES: 11,
    SOUND: 12,
    BITMAP: 13,
    UTF8: 14,
    ARRAY: 20,
    ORDERED_COLLECTION: 21,
    SET: 22,
    IDENTITY_SET: 23,
    DICTIONARY: 24,
    IDENTITY_DICTIONARY: 25,
    COLOR: 30,
    TRANSLUCENT_COLOR: 31,
    POINT: 32,
    RECTANGLE: 33,
    FORM: 34,
    SQUEAK: 35,
    OBJECT_REF: 99,
    MORPH: 100,
    ALIGNMENT: 104,
    // STRING: 105,
    UPDATING_STRING: 106,
    SAMPLED_SOUND: 109,
    IMAGE_MORPH: 110,
    SPRITE: 124,
    STAGE: 125,
    WATCHER: 155,
    IMAGE_MEDIA: 162,
    SOUND_MEDIA: 164,
    MULTILINE_STRING: 171,
    WATCHER_READOUT_FRAME: 173,
    WATCHER_SLIDER: 174,
    LIST_WATCHER: 175,
};

class Field {
    constructor (classId) {
        this.classId = classId;
    }
}

class Value extends Field {
    constructor (classId, value) {
        super(classId);
        this.value = value;
    }

    valueOf () {
        return this.value;
    }
}

class Header extends Field {
    constructor (classId, size) {
        super(classId);
        this.size = size;
    }
}

class Reference extends Field {
    constructor (classId, index) {
        super(classId);
        this.index = index;
    }

    valueOf () {
        return `Ref(${this.index})`;
    }
}

class BuiltinObjectHeader extends Header {
    constructor (classId) {
        super(classId, 0);
    }
}

class ExtendedObjectHeader extends Header {
    constructor (classId, version, size) {
        super(classId, size);
        this.version = version;
    }
}

const int32BE = function (uint8, position) {
    return (
        uint8[position + 0] << 24 |
        uint8[position + 1] << 16 |
        uint8[position + 2] << 8 |
        uint8[position + 3]
    );
};

const int16BE = function (uint8, position) {
    return (
        uint8[position + 0] << 8 |
        uint8[position + 1]
    );
};

const largeInt = function (iter) {
    let num = 0;
    let multiplier = 0;
    const count = int16BE(iter.data, iter.position);
    iter.position += 2;
    for (let i = 0; i < count; i++) {
        num = num + (multiplier * iter.data.getUint8(iter.position++));
        multiplier *= 256;
    }
    return num;
};

const fromDouble = new Float64Array(1);
const toDouble = new Uint8Array(fromDouble.buffer);

const doubleBE = function (uint8, position) {
    toDouble[0] = uint8[position + 0];
    toDouble[1] = uint8[position + 1];
    toDouble[2] = uint8[position + 2];
    toDouble[3] = uint8[position + 3];
    toDouble[4] = uint8[position + 4];
    toDouble[5] = uint8[position + 5];
    toDouble[6] = uint8[position + 6];
    toDouble[7] = uint8[position + 7];
    return fromDouble[0];
};

const asciiString = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    let str = '';
    for (let i = 0; i < count; i++) {
        str += String.fromCharCode(iter.uint8[iter.position++]);
    }
    return str;
};

const uint8 = function (iter, count) {
    const value = new Uint8Array(iter.buffer, iter.position, count);
    iter.position += count;
    return value;
};

const bytes = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    return uint8(iter, count);
};

const sound = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    return uint8(iter, count * 2);
};

const bitmap = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    const value = new Int32Array(count);
    for (let i = 0; i < count; i++) {
        value[i] = int32BE(iter.uint8, iter.position);
        iter.position += 4;
    }
    return value;
};

const decoder = new TextDecoder();

const utf8 = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    return decoder.decode(uint8(iter, count));
};

// const arrayHeader = function (iter) {
//     const count = int32BE(iter.uint8, iter.position);
//     iter.position += 4;
//     const value = new Array(count);
//     for (let i = 0; i < count; i++) {
//         value[i]
//     }
// };

const color = function (iter, classId) {
    const rgb = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    let a = 0xff;
    if (classId === TYPES.TRANSLUCENT_COLOR) {
        a = iter.uint8[iter.position++];
    }
    const r = (rgb >> 22) & 0xff;
    const g = (rgb >> 12) & 0xff;
    const b = (rgb >> 2) & 0xff;
    return a << 24 | r << 16 | g << 8 | b;
};

const objectRef = function (iter) {
    index = (
        iter.uint8[iter.position + 0] << 16 |
        iter.uint8[iter.position + 1] << 8 |
        iter.uint8[iter.position + 2]
    );
    iter.position += 3;
    return {
        value: new Reference(TYPES.OBJECT_REF, index),
        done: false
    };
};

const builtin = function (iter, classId) {
    return {
        value: new BuiltinObjectHeader(classId),
        done: false
    };
}

const extended = function (iter, classId) {
    const classVersion = iter.uint8[iter.position++];
    const size = iter.uint8[iter.position++];
    return {
        value: new ExtendedObjectHeader(classId, classVersion, size),
        done: false
    };
};

class SB1Iterator {
    constructor (buffer, position) {
        this.buffer = buffer;
        this.uint8 = new Uint8Array(buffer);
        this.view = new DataView(buffer);
        this.position = position;
    }

    [Symbol.iterator] () {
        return this;
    }

    next () {
        if (this.position >= this.uint8.length) {
            return {
                value: null,
                done: true
            };
        }

        const classId = this.uint8[this.position++];
        let value;
        let headerSize;

        switch (classId) {
        case TYPES.NULL:
            value = null;
            break;

        case TYPES.TRUE:
            value = true;
            break;

        case TYPES.FALSE:
            value = false;
            break;

        case TYPES.SMALL_INT:
            value = int32BE(this.uint8, this.position);
            this.position += 4;
            break;

        case TYPES.SMALL_INT_16:
            value = int16BE(this.uint8, this.position);
            this.position += 2;
            break;

        case TYPES.LARGE_INT_POSITIVE:
        case TYPES.LARGE_INT_NEGATIVE:
            value = largeInt(this);
            break;

        case TYPES.FLOATING:
            value = doubleBE(this.uint8, this.position);
            this.position += 8;
            break;

        case TYPES.STRING:
        case TYPES.SYMBOL:
            value = asciiString(this);
            break;

        case TYPES.BYTES:
            value = bytes(this);
            break;

        case TYPES.SOUND:
            value = sound(this);
            break;

        case TYPES.UTF8:
            value = utf8(this);
            break;

        case TYPES.ARRAY:
        case TYPES.ORDERED_COLLECTION:
        case TYPES.SET:
        case TYPES.IDENTITY_SET:
            headerSize = int32BE(this.uint8, this.position);
            this.position += 4;
            break;

        case TYPES.DICTIONARY:
        case TYPES.IDENTITY_DICTIONARY:
            headerSize = int32BE(this.uint8, this.position) * 2;
            this.position += 4;
            break;

        case TYPES.COLOR:
        case TYPES.TRANSLUCENT_COLOR:
            value = color(this, classId);
            break;

        case TYPES.POINT:
            headerSize = 2;
            break;

        case TYPES.RECTANGLE:
            headerSize = 4;
            break;

        case TYPES.FORM:
        case TYPES.SQUEAK:
            headerSize = classId === TYPES.SQUEAK ? 6 : 5;
            break;

        case TYPES.OBJECT_REF:
            return objectRef(this);
            break;

        default:
            if (classId < TYPES.OBJECT_REF) {
                return builtin(this, classId);
            } else {
                return extended(this, classId);
            }
        }

        if (typeof value !== 'undefined') {
            return {
                value: new Value(classId, value),
                done: false
            };
        } else {
            return {
                value: new Header(classId, headerSize),
                done: false
            };
        }
    }
}

window.SB1Iterator = SB1Iterator;

const objectArray = function (objectIterator, header) {
    const array = [];

    for (let i = 0; i < header.size; i++) {
        array.push(objectIterator._next().value);
    }

    return array;
};

const objectDictionary = function (objectIterator, header) {
    const dict = [];

    for (let i = 0; i < header.size; i += 2) {
        dict.push(objectIterator._next().value);
        dict.push(objectIterator._next().value);
    }

    return dict;
};

const objectPoint = function (objectIterator, header) {
    return {
        x: objectIterator._next().value,
        y: objectIterator._next().value
    };
};

const objectRectangle = function (objectIterator, header) {
    return {
        x: objectIterator._next().value,
        y: objectIterator._next().value,
        width: objectIterator._next().value,
        height: objectIterator._next().value
    };
};

const objectImage = function (objectIterator, header) {
    return {
        width: objectIterator._next().value,
        height: objectIterator._next().value,
        encoding: objectIterator._next().value,
        something: objectIterator._next().value,
        bytes: objectIterator._next().value,
        colormap: header.classId === TYPES.SQUEAK ? objectIterator._next().value : null
    };
};

const objectBuiltin = function (objectIterator, header) {
    return {
        classId: header.classId,
        value: objectIterator.read(header, header.classId).value
    };
};

const objectExtended = function (objectIterator, header) {
    const fields = [];

    for (let i = 0; i < header.size; i++) {
        fields.push(objectIterator._next().value);
    }

    return {
        classId: header.classId,
        value: null,
        version: header.version,
        fields,
    };
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
            value = objectDictionary(this, header);
            break;

        case TYPES.POINT:
            value = objectPoint(this, header);
            break;

        case TYPES.RECTANGLE:
            value = objectRectangle(this, header);
            break;

        case TYPES.FORM:
        case TYPES.SQUEAK:
            value = objectImage(this, header);
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

    _next () {
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

    next () {
        if (this.length === 0) {
            return {
                value: null,
                done: true
            };
        }
        this.length--;

        return this._next();
    }
}

window.SB1ObjectIterator = SB1ObjectIterator;

class SB1File {
    constructor (buffer) {
        this.buffer = buffer;
        this.uint8 = new Uint8Array(buffer);
        this.infoPosition = 14;
        this.infoLength = int32BE(this.uint8, this.infoPosition + 10);
        this.dataPosition = int32BE(this.uint8, 10) + 14;
        this.dataLength = int32BE(this.uint8, this.dataPosition + 10);
        console.log(this.infoLength, this.dataLength);
    }

    info () {
        return new SB1ObjectIterator(new SB1Iterator(this.buffer, this.infoPosition + 14), this.infoLength);
    }

    data () {
        return new SB1ObjectIterator(new SB1Iterator(this.buffer, this.dataPosition + 14), this.dataLength);
    }
}

window.SB1File = SB1File;

module.exports = SB1Iterator;
