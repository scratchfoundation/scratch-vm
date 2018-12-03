const {Uint8, Int16BE, Int32BE, DoubleBE, StructMember} = require('../coders/byte-primitives');
const {ByteStream} = require('../coders/byte-stream');

const {ReferenceBE, LargeInt, AsciiString, UTF8, Bytes, SoundBytes, Bitmap32BE, OpaqueColor, TranslucentColor} = require('./byte-primitives');
const {BuiltinObjectHeader, ExtendedObjectHeader, Header, Reference, Value} = require('./fields');
const {TYPES} = require('./ids');

class Consumer {
    constructor({
        type = Value,
        read,
        value = read ? (stream => stream.read(read)) : null
    }) {
        this.type = type;
        this.value = value;
    }

    next (stream, classId, position) {
        return {
            value: new this.type(classId, position, this.value(stream)),
            done: false
        };
    }
}

const CONSUMER_PROTOS = {
    [TYPES.NULL]: {value: () => null},
    [TYPES.TRUE]: {value: () => true},
    [TYPES.FALSE]: {value: () => false},
    [TYPES.SMALL_INT]: {read: Int32BE},
    [TYPES.SMALL_INT_16]: {read: Int16BE},
    [TYPES.LARGE_INT_POSITIVE]: {read: LargeInt},
    [TYPES.LARGE_INT_NEGATIVE]: {read: LargeInt},
    [TYPES.FLOATING]: {read: DoubleBE},
    [TYPES.STRING]: {read: AsciiString},
    [TYPES.SYMBOL]: {read: AsciiString},
    [TYPES.BYTES]: {read: Bytes},
    [TYPES.SOUND]: {read: SoundBytes},
    [TYPES.BITMAP]: {read: Bitmap32BE},
    [TYPES.UTF8]: {read: UTF8},
    [TYPES.ARRAY]: {type: Header, read: Int32BE},
    [TYPES.ORDERED_COLLECTION]: {type: Header, read: Int32BE},
    [TYPES.SET]: {type: Header, read: Int32BE},
    [TYPES.IDENTITY_SET]: {type: Header, read: Int32BE},
    [TYPES.DICTIONARY]: {
        type: Header,
        value: stream => stream.read(Int32BE) * 2
    },
    [TYPES.IDENTITY_DICTIONARY]: {
        type: Header,
        value: stream => stream.read(Int32BE) * 2
    },
    [TYPES.COLOR]: {read: OpaqueColor},
    [TYPES.TRANSLUCENT_COLOR]: {read: TranslucentColor},
    [TYPES.POINT]: {type: Header, value: () => 2},
    [TYPES.RECTANGLE]: {type: Header, value: () => 4},
    [TYPES.FORM]: {type: Header, value: () => 5},
    [TYPES.SQUEAK]: {type: Header, value: () => 6},
    [TYPES.OBJECT_REF]: {type: Reference, read: ReferenceBE},
};

const CONSUMERS = new Array(256).fill(null);
for (const index of Object.values(TYPES)) {
    if (CONSUMER_PROTOS[index]) {
        CONSUMERS[index] = new Consumer(CONSUMER_PROTOS[index]);
    }
}

const builtinConsumer = new Consumer({
    type: BuiltinObjectHeader,
    value: () => null
});

class FieldIterator {
    constructor (buffer, position) {
        this.buffer = buffer;
        this.stream = new ByteStream(buffer, position);
    }

    [Symbol.iterator] () {
        return this;
    }

    next () {
        if (this.stream.position >= this.stream.uint8.length) {
            return {
                value: null,
                done: true
            };
        }

        const position = this.stream.position;
        const classId = this.stream.read(Uint8);

        const consumer = CONSUMERS[classId];

        if (consumer !== null) {
            return consumer.next(this.stream, classId, position);
        } else if (classId < TYPES.OBJECT_REF) {
            // TODO: Does this ever happen?
            return builtinConsumer.next(this.stream, classId, position);
        } else {
            const classVersion = this.stream.read(Uint8);
            const size = this.stream.read(Uint8);
            return {
                value: new ExtendedObjectHeader(classId, position, classVersion, size),
                done: false
            };
        }
    }
}

exports.FieldIterator = FieldIterator;
