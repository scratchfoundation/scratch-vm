const {Uint8, Int16BE, Int32BE, DoubleBE} = require('../coders/byte-primitives');
const {ByteStream} = require('../coders/byte-stream');

const {LargeInt, AsciiString, UTF8, Bytes, SoundBytes, Bitmap32BE, OpaqueColor, TranslucentColor} = require('./byte-primitives');
const {BuiltinObjectHeader, ExtendedObjectHeader, Header, Reference, Value} = require('./fields');
const {TYPES} = require('./ids');

const objectRef = function (iter, position) {
    const index = (
        iter.uint8[iter.position + 0] << 16 |
        iter.uint8[iter.position + 1] << 8 |
        iter.uint8[iter.position + 2]
    );
    iter.position += 3;
    return {
        value: new Reference(TYPES.OBJECT_REF, position, index),
        done: false
    };
};

const builtin = function (iter, classId, position) {
    return {
        value: new BuiltinObjectHeader(classId, position),
        done: false
    };
}

const extended = function (iter, classId, position) {
    const classVersion = iter.uint8[iter.position++];
    const size = iter.uint8[iter.position++];
    return {
        value: new ExtendedObjectHeader(classId, position, classVersion, size),
        done: false
    };
};

class SB1TokenIterator {
    constructor (buffer, position) {
        this.buffer = buffer;
        this.stream = new ByteStream(buffer, position);
        this.view = new DataView(buffer);
        this.uint8 = new Uint8Array(buffer);
        Object.defineProperty(this, 'position', {
            get () {
                return this.stream.position;
            },
            set (value) {
                this.stream.position = value;
                return value;
            }
        });
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

        const position = this.position;
        const classId = this.stream.read(Uint8);
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
            value = this.stream.read(Int32BE);
            break;

        case TYPES.SMALL_INT_16:
            value = this.stream.read(Int16BE);
            break;

        case TYPES.LARGE_INT_POSITIVE:
        case TYPES.LARGE_INT_NEGATIVE:
            value = this.stream.read(LargeInt);
            break;

        case TYPES.FLOATING:
            value = this.stream.read(DoubleBE);
            break;

        case TYPES.STRING:
        case TYPES.SYMBOL:
            value = this.stream.read(AsciiString);
            break;

        case TYPES.BYTES:
            value = this.stream.read(Bytes);
            break;

        case TYPES.SOUND:
            value = this.stream.read(SoundBytes);
            break;

        case TYPES.BITMAP:
            value = this.stream.read(Bitmap32BE);
            break;

        case TYPES.UTF8:
            value = this.stream.read(UTF8);
            break;

        case TYPES.ARRAY:
        case TYPES.ORDERED_COLLECTION:
        case TYPES.SET:
        case TYPES.IDENTITY_SET:
            headerSize = this.stream.read(Int32BE);
            break;

        case TYPES.DICTIONARY:
        case TYPES.IDENTITY_DICTIONARY:
            headerSize = this.stream.read(Int32BE) * 2;
            break;

        case TYPES.COLOR:
            value = this.stream.read(OpaqueColor);
            break;

        case TYPES.TRANSLUCENT_COLOR:
            value = this.stream.read(TranslucentColor);
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
            return objectRef(this, position);
            break;

        default:
            if (classId < TYPES.OBJECT_REF) {
                return builtin(this, classId, position);
            } else {
                return extended(this, classId, position);
            }
        }

        if (typeof value !== 'undefined') {
            return {
                value: new Value(classId, position, value),
                done: false
            };
        } else {
            return {
                value: new Header(classId, position, headerSize),
                done: false
            };
        }
    }
}

exports.FieldIterator = SB1TokenIterator;
