const TOO_BIG = 10 * 1024 * 1024;

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
    STATIC_STRING: 105,
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

const TYPE_NAMES = Object.entries(TYPES)
.reduce((carry, [key, value]) => {
    carry[value] = key;
    return carry;
}, {
    105: 'STATIC_STRING'
});

class Viewable {
    toString () {
        return this.constructor.name;
    }
}

class Field {
    constructor (classId, position) {
        this.classId = classId;
        this.position = position;
    }
}

class Value extends Field {
    constructor (classId, position, value) {
        super(classId, position);
        this.value = value;
    }

    valueOf () {
        return this.value;
    }
}

class Header extends Field {
    constructor (classId, position, size) {
        super(classId, position);
        this.size = size;
    }
}

class Reference extends Field {
    constructor (classId, position, index) {
        super(classId, position);
        this.index = index;
    }

    valueOf () {
        return `Ref(${this.index})`;
    }
}

class BuiltinObjectHeader extends Header {
    constructor (classId, position) {
        super(classId, position, 0);
    }
}

class ExtendedObjectHeader extends Header {
    constructor (classId, position, version, size) {
        super(classId, position, size);
        this.version = version;
    }
}

class ByteStream {
    constructor (buffer, position = 0) {
        this.buffer = buffer;
        this.position = position;

        this.uint8 = new Uint8Array(this.buffer);
    }

    read (member) {
        const value = member.read(this.uint8, this.position);
        if (member.size === 0) {
            this.position += member.sizeOf(this.uint8, this.position);
        } else {
            this.position += member.size;
        }
        return value;
    }

    readStruct (StructType) {
        const obj = new StructType(this.uint8, this.position);
        this.position += StructType.prototype.size;
        return obj;
    }

    resize (needed) {
        if (this.buffer.byteLength < needed) {
            const buffer = this.buffer;
            const uint8 = this.uint8;
            this.buffer = new ArrayBuffer(Math.pow(2, Math.ceil(Math.log(needed) / Math.log(2))));
            this.uint8 = new Uint8Array(this.buffer);

            for (let i = 0; i < uint8.length; i++) {
                this.uint8[i] = uint8[i];
            }
        }
    }

    write (member, value) {
        if (member.size === 0) {
            this.resize(this.position + member.writeSizeOf(value));
        } else {
            this.resize(this.position + member.size);
        }

        member.write(this.uint8, this.position, value);
        if (member.size === 0) {
            this.position += member.writeSizeOf(this.uint8, this.position);
        } else {
            this.position += member.size;
        }
        return value;
    }

    writeStruct (StructType, data) {
        this.resize(this.position + StructType.prototype.size);

        Object.assign(new StructType(this.uint8, this.position), data);
        this.position += StructType.prototype.size;
        return data;
    }

    writeBytes (bytes, start = 0, end = bytes.length) {
        assert(bytes instanceof Uint8Array, 'writeBytes must be passed an Uint8Array');

        this.resize(this.position + (end - start));

        for (let i = start; i < end; i++) {
            this.uint8[this.position + i - start] = bytes[i];
        }
        this.position += end - start;
        return bytes;
    }
}

class StructMember {
    constructor ({
        size = 0,
        sizeOf = () => size,
        writeSizeOf = () => {throw new Error('Not implemented');},
        toBytes = new Uint8Array(1),
        read,
        write}) {
        this.size = size;
        this.sizeOf = sizeOf;
        this.writeSizeOf = writeSizeOf;

        this.toBytes = toBytes;
        this.bytes = new Uint8Array(toBytes.buffer);

        this.read = read;
        this.write = write;
    }

    defineProperty (obj, key, position) {
        const _this = this;

        Object.defineProperty(obj, key, {
            get () {
                return _this.read(this.uint8, position + this.offset);
            },

            set (value) {
                return _this.write(this.uint8, position + this.offset, value);
            },

            enumerable: true
        });
    }
}

const Uint8 = new StructMember({
    size: 1,
    read (uint8, position) {
        return uint8[position];
    },
    write (uint8, position, value) {
        uint8[position] = value;
        return value;
    }
});

const Uint16BE = new StructMember({
    size: 2,
    toBytes: new Uint16Array(1),
    read (uint8, position) {
        this.bytes[1] = uint8[position + 0];
        this.bytes[0] = uint8[position + 1];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[1];
        uint8[position + 1] = this.bytes[0];
        return value;
    }
});

const Int16BE = new StructMember({
    size: 2,
    toBytes: new Int16Array(1),
    read (uint8, position) {
        this.bytes[1] = uint8[position + 0];
        this.bytes[0] = uint8[position + 1];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[1];
        uint8[position + 1] = this.bytes[0];
        return value;
    }
});

const Int32BE = new StructMember({
    size: 4,
    toBytes: new Int32Array(1),
    read (uint8, position) {
        this.bytes[3] = uint8[position + 0];
        this.bytes[2] = uint8[position + 1];
        this.bytes[1] = uint8[position + 2];
        this.bytes[0] = uint8[position + 3];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[3];
        uint8[position + 1] = this.bytes[2];
        uint8[position + 2] = this.bytes[1];
        uint8[position + 3] = this.bytes[0];
        return value;
    }
});

const Uint16LE = new StructMember({
    size: 2,
    toBytes: new Uint16Array(1),
    read (uint8, position) {
        this.bytes[0] = uint8[position + 0];
        this.bytes[1] = uint8[position + 1];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[0];
        uint8[position + 1] = this.bytes[1];
        return value;
    }
});

const Uint32BE = new StructMember({
    size: 4,
    toBytes: new Uint32Array(1),
    read (uint8, position) {
        this.bytes[3] = uint8[position + 0];
        this.bytes[2] = uint8[position + 1];
        this.bytes[1] = uint8[position + 2];
        this.bytes[0] = uint8[position + 3];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[3];
        uint8[position + 1] = this.bytes[2];
        uint8[position + 2] = this.bytes[1];
        uint8[position + 3] = this.bytes[0];
        return value;
    }
});

const Uint32LE = new StructMember({
    size: 4,
    toBytes: new Uint32Array(1),
    read (uint8, position) {
        this.bytes[0] = uint8[position + 0];
        this.bytes[1] = uint8[position + 1];
        this.bytes[2] = uint8[position + 2];
        this.bytes[3] = uint8[position + 3];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[0];
        uint8[position + 1] = this.bytes[1];
        uint8[position + 2] = this.bytes[2];
        uint8[position + 3] = this.bytes[3];
        return value;
    }
});

const DoubleBE = new StructMember({
    size: 8,
    toBytes: new Float64Array(1),
    read (uint8, position) {
        this.bytes[7] = uint8[position + 0];
        this.bytes[6] = uint8[position + 1];
        this.bytes[5] = uint8[position + 2];
        this.bytes[4] = uint8[position + 3];
        this.bytes[3] = uint8[position + 4];
        this.bytes[2] = uint8[position + 5];
        this.bytes[1] = uint8[position + 6];
        this.bytes[0] = uint8[position + 7];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

class FixedAsciiString extends StructMember {
    constructor (size) {
        super({
            size,
            read (uint8, position) {
                let str = '';
                for (let i = 0; i < size; i++) {
                    str += String.fromCharCode(uint8[position + i]);
                }
                return str;
            },
            write (uint8, position, value) {
                for (let i = 0; i < size; i++) {
                    uint8[position + i] = value.charCodeAt(i);
                }
                return value;
            }
        });
    }
}

class Struct {
    constructor (shape) {
        let position = 0;
        Object.keys(shape).forEach(key => {
            shape[key].defineProperty(this, key, position);
            position += prop.size;
        });
    }
}

const struct = shape => {
    const Base = class {
        constructor (uint8, offset = 0) {
            this.uint8 = uint8;
            this.offset = offset;
        }

        equals (other) {
            for (const key in other) {
                if (this[key] !== other[key]) {
                    return false;
                }
            }
            return true;
        }

        view () {
            const constructor = this.constructor;
            const obj = {
                toString() {
                    return constructor.name;
                }
            };
            for (const key in shape) {
                obj[key] = this[key];
            }
            return obj;
        }
    };

    let position = 0;
    Object.keys(shape).forEach(key => {
        shape[key].defineProperty(Base.prototype, key, position);
        if (shape[key].size === 0) {
            throw new Error('Struct cannot be defined with variable sized members.');
        }
        position += shape[key].size;
    });

    Base.prototype.size = position;

    return Base;
};

const assert = function (test, message) {
    if (!test) throw new Error(message);
};

const int32BE = function (uint8, position) {
    return Int32BE.read(uint8, position);
};

const uint32BE = function (uint8, position) {
    return Uint32BE.read(uint8, position);
};

const int16BE = function (uint8, position) {
    return Int16BE.read(uint8, position);
};

const LargeInt = new StructMember({
    sizeOf (uint8, position) {
        const count = Int16BE.read(uint8, position);
        return Int16BE.size + count;
    },
    read (uint8, position) {
        let num = 0;
        let multiplier = 0;
        const count = Int16BE.read(uint8, position);
        for (let i = 0; i < count; i++) {
            num = num + (multiplier * Uint8.read(uint8, position++));
            multiplier *= 256;
        }
        return num;
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

const AsciiString = new StructMember({
    sizeOf (uint8, position) {
        const count = Uint32BE.read(uint8, position);
        return Uint32BE.size + count;
    },
    read (uint8, position) {
        const count = Uint32BE.read(uint8, position);
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'asciiString too big');
        }
        position += 4;
        let str = '';
        for (let i = 0; i < count; i++) {
            str += String.fromCharCode(uint8[position++]);
        }
        return str;
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

const Bytes = new StructMember({
    sizeOf (uint8, position) {
        return Uint32BE.size + Uint32BE.read(uint8, position);
    },
    read (uint8, position) {
        const count = Uint32BE.read(uint8, position);
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'bytes too big');
        }
        position += Uint32BE.size;

        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'uint8 array too big');
        }
        return new Uint8Array(uint8.buffer, position, count);
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

const SoundBytes = new StructMember({
    sizeOf (uint8, position) {
        return Uint32BE.size + Uint32BE.read(uint8, position) * 2;
    },
    read (uint8, position) {
        const samples = Uint32BE.read(uint8, position);
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(samples < TOO_BIG, 'sound too big');
        }
        position += Uint32BE.size;

        const count = samples * 2;
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'uint8 array too big');
        }
        return new Uint8Array(uint8.buffer, position, count);
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

const Bitmap32BE = new StructMember({
    sizeOf (uint8, position) {
        return Uint32BE.size + Uint32BE.read(uint8, position) * Uint32BE.size;
    },
    read (uint8, position) {
        const count = Uint32BE.read(uint8, position);
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'bitmap too big');
        }
        position += Uint32BE.size;

        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'uint8 array too big');
        }
        const value = new Uint32Array(count);
        for (let i = 0; i < count; i++) {
            value[i] = Uint32BE.read(uint8, position);
            position += Uint32BE.size;
        }
        return value;
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

const decoder = new TextDecoder();

const UTF8 = new StructMember({
    sizeOf (uint8, position) {
        return Uint32BE.size + Uint32BE.read(uint8, position);
    },
    read (uint8, position) {
        const count = Uint32BE.read(uint8, position);
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'utf8 too big');
        }
        position += Uint32BE.size;

        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            assert(count < TOO_BIG, 'uint8 array too big');
        }
        return decoder.decode(new Uint8Array(uint8.buffer, position, count));
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

const OpaqueColor = new StructMember({
    size: 4,
    read (uint8, position) {
        const rgb = Uint32BE.read(uint8, position);
        const a = 0xff;
        const r = (rgb >> 22) & 0xff;
        const g = (rgb >> 12) & 0xff;
        const b = (rgb >> 2) & 0xff;
        return (a << 24 | r << 16 | g << 8 | b) >>> 0;
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

const TranslucentColor = new StructMember({
    size: 5,
    read (uint8, position) {
        const rgb = Uint32BE.read(uint8, position);
        const a = Uint8.read(uint8, position);
        const r = (rgb >> 22) & 0xff;
        const g = (rgb >> 12) & 0xff;
        const b = (rgb >> 2) & 0xff;
        return (a << 24 | r << 16 | g << 8 | b) >>> 0;
    },
    write (uint8, position, value) {
        throw new Error('Not implemented.');
    }
});

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

window.SB1TokenIterator = SB1TokenIterator;

const objectArray = function (objectIterator, header) {
    const array = [];

    for (let i = 0; i < header.size; i++) {
        array.push(objectIterator.next().value);
    }

    return array;
};

class ExtendedData {
    constructor ({classId, value, version, fields}) {
        this.classId = classId;
        this.value = value;
        this.version = version;
        this.fields = fields;
    }

    string (field) {
        return '' + this.fields[field];
    }

    number (field) {
        return +this.fields[field];
    }

    boolean (field) {
        return !!this.fields[field];
    }

    toString () {
        if (this.constructor === ExtendedData || this.constructor === UnknownData) {
            return `${this.constructor.name} ${this.classId} ${TYPE_NAMES[this.classId]}`;
        }
        return this.constructor.name;
    }
}

const POINT_FIELDS = {
    X: 0,
    Y: 1
};

class PointData extends ExtendedData {
    get x () {
        return this.fields[POINT_FIELDS.X];
    }

    get y () {
        return this.fields[POINT_FIELDS.Y];
    }
}

const RECTANGLE_FIELDS = {
    X: 0,
    Y: 1,
    X2: 2,
    Y2: 3
};

class RectangleData extends ExtendedData {
    get x () {
        return this.fields[RECTANGLE_FIELDS.X];
    }

    get y () {
        return this.fields[RECTANGLE_FIELDS.Y];
    }

    get x2 () {
        return this.fields[RECTANGLE_FIELDS.X2];
    }

    get y2 () {
        return this.fields[RECTANGLE_FIELDS.Y2];
    }

    get width () {
        return this.x2 - this.x;
    }

    get height () {
        return this.y2 - this.y;
    }
}

const IMAGE_FIELDS = {
    WIDTH: 0,
    HEIGHT: 1,
    DEPTH: 2,
    SOMETHING: 3,
    BYTES: 4,
    COLORMAP: 5
};

class ImageData extends ExtendedData {
    get width () {
        return this.fields[IMAGE_FIELDS.WIDTH];
    }

    get height () {
        return this.fields[IMAGE_FIELDS.HEIGHT];
    }

    get depth () {
        return this.fields[IMAGE_FIELDS.DEPTH];
    }

    get something () {
        return this.fields[IMAGE_FIELDS.SOMETHING];
    }

    get bytes () {
        return this.fields[IMAGE_FIELDS.BYTES];
    }

    get colormap () {
        return this.fields[IMAGE_FIELDS.COLORMAP];
    }

    get png () {
        if (!this._png) {
            this._png = new Uint8Array(PNGFile.encode(
                this.width,
                this.height,
                _bgra2rgbaInPlace(new Uint8Array(
                    new SqueakImageDecoder().decode(
                        this.width.value,
                        this.height.value,
                        this.depth.value,
                        this.bytes.value,
                        this.colormap && this.colormap.map(color => color.valueOf())
                    ).buffer
                ))
            ));
        }
        return this._png;
    }

    get preview () {
        const image = new Image();
        image.src = URL.createObjectURL(
            new Blob([this.png.buffer], { type: 'image/png' })
        );
        return image;
    }
}

const STAGE_FIELDS = {
    STAGE_CONTENTS: 2,
    OBJ_NAME: 6,
    VARS: 7,
    BLOCKS_BIN: 8,
    IS_CLONE: 9,
    MEDIA: 10,
    CURRENT_COSTUME: 11,
    ZOOM: 12,
    H_PAN: 13,
    V_PAN: 14,
    OBSOLETE_SAVED_STATE: 15,
    SPRITE_ORDER_IN_LIBRARY: 16,
    VOLUME: 17,
    TEMPO_BPM: 18,
    SCENE_STATES: 19,
    LISTS: 20
};

class StageData extends ExtendedData {
    get objName () {
        return '' + this.fields[STAGE_FIELDS.OBJ_NAME];
    }

    get stageContents () {
        return this.fields[STAGE_FIELDS.STAGE_CONTENTS];
    }

    get vars () {
        return this.fields[STAGE_FIELDS.VARS];
    }

    get blocksBin () {
        return this.fields[STAGE_FIELDS.BLOCKS_BIN];
    }

    get media () {
        return this.fields[STAGE_FIELDS.MEDIA];
    }

    get currentCostume () {
        return this.fields[STAGE_FIELDS.CURRENT_COSTUME];
    }

    get spriteOrderInLibrary () {
        return this.fields[STAGE_FIELDS.SPRITE_ORDER_IN_LIBRARY] || null;
    }

    get tempoBPM () {
        return this.fields[STAGE_FIELDS.TEMPO_BPM] || 0;
    }

    get lists () {
        return this.fields[STAGE_FIELDS.LISTS] || [];
    }
}

const SPRITE_FIELDS = {
    BOX: 0,
    PARENT: 1,
    COLOR: 3,
    VISIBLE: 4,
    OBJ_NAME: 6,
    VARS: 7,
    BLOCKS_BIN: 8,
    IS_CLONE: 9,
    MEDIA: 10,
    CURRENT_COSTUME: 11,
    VISIBILITY: 12,
    SCALE_POINT: 13,
    ROTATION_DEGREES: 14,
    ROTATION_STYLE: 15,
    VOLUME: 16,
    TEMPO_BPM: 17,
    DRAGGABLE: 18,
    SCENE_STATES: 19,
    LISTS: 20
};

class SpriteData extends ExtendedData {
    get objName () {
        return '' + this.fields[SPRITE_FIELDS.OBJ_NAME];
    }

    get box () {
        return this.fields[SPRITE_FIELDS.BOX];
    }

    get scratchX () {
        return this.box.x + this.currentCostume.rotationCenter.x - 240;
    }

    get scratchY () {
        return 180 - (this.box.y + this.currentCostume.rotationCenter.y);
    }

    get visible () {
        return (this.fields[SPRITE_FIELDS.VISIBLE] & 1) === 0;
    }

    get vars () {
        return this.fields[SPRITE_FIELDS.VARS];
    }

    get blocksBin () {
        return this.fields[SPRITE_FIELDS.BLOCKS_BIN];
    }

    get media () {
        return this.fields[SPRITE_FIELDS.MEDIA];
    }

    get currentCostume () {
        return this.fields[SPRITE_FIELDS.CURRENT_COSTUME];
    }

    get visibility () {
        return +this.fields[SPRITE_FIELDS.VISIBILITY];
    }

    get scalePoint () {
        return this.fields[SPRITE_FIELDS.SCALE_POINT];
    }

    get rotationDegrees () {
        return this.fields[SPRITE_FIELDS.ROTATION_DEGREES];
    }

    get rotationStyle () {
        return this.fields[SPRITE_FIELDS.ROTATION_STYLE];
    }

    get volume () {
        return this.fields[SPRITE_FIELDS.VOLUME];
    }

    get tempoBPM () {
        return this.fields[SPRITE_FIELDS.TEMPO_BPM] || 0;
    }

    get draggable () {
        return this.fields[SPRITE_FIELDS.DRAGGABLE];
    }

    get lists () {
        return this.fields[SPRITE_FIELDS.LISTS] || [];
    }
}

const TEXT_DETAILS_FIELDS = {
    RECTANGLE: 0,
    FONT: 8,
    COLOR: 9,
    LINES: 11
};

class TextDetailsData extends ExtendedData {
    get rectangle () {
        return this.fields[IMAGE_MEDIA_FIELDS.RECTANGLE];
    }

    get font () {
        return this.fields[IMAGE_MEDIA_FIELDS.FONT];
    }

    get color () {
        return this.fields[IMAGE_MEDIA_FIELDS.COLOR];
    }

    get lines () {
        return this.fields[IMAGE_MEDIA_FIELDS.LINES];
    }
}

const IMAGE_MEDIA_FIELDS = {
    COSTUME_NAME: 0,
    BITMAP: 1,
    ROTATION_CENTER: 2,
    TEXT_DETAILS: 3,
    BASE_LAYER_DATA: 4,
    OLD_COMPOSITE: 5
};

class ImageMediaData extends ExtendedData {
    get costumeName () {
        return this.string(IMAGE_MEDIA_FIELDS.COSTUME_NAME);
    }

    get bitmap () {
        return this.fields[IMAGE_MEDIA_FIELDS.BITMAP];
    }

    get rotationCenter () {
        return this.fields[IMAGE_MEDIA_FIELDS.ROTATION_CENTER];
    }

    get textDetails () {
        return this.fields[IMAGE_MEDIA_FIELDS.TEXT_DETAILS];
    }

    get baseLayerData () {
        return this.fields[IMAGE_MEDIA_FIELDS.BASE_LAYER_DATA];
    }

    get oldComposite () {
        return this.fields[IMAGE_MEDIA_FIELDS.OLD_COMPOSITE];
    }

    get bytes () {
        if (this.oldComposite instanceof ImageData) {
            return this.oldComposite.png;
        }
        if (this.baseLayerData.value) {
            return this.baseLayerData.value;
        }
        return this.bitmap.png;
    }

    get crc () {
        if (!this._crc) {
            const crc = new CRC32()
            .update(new Uint8Array(new Uint32Array([this.bitmap.width]).buffer))
            .update(new Uint8Array(new Uint32Array([this.bitmap.height]).buffer))
            .update(new Uint8Array(new Uint32Array([this.bitmap.depth]).buffer))
            .update(this.bytes);
            this._crc = crc.digest;
        }
        return this._crc;
    }

    get extension () {
        if (this.oldComposite instanceof ImageData) return 'png';
        if (this.baseLayerData.value) return 'jpg';
        return 'png';
    }

    get preview () {
        if (this.oldComposite instanceof ImageData) {
            return this.oldComposite.preview;
        }
        if (this.baseLayerData.value) {
            const image = new Image();
            image.src = URL.createObjectURL(new Blob([this.baseLayerData.value], {type: 'image/jpeg'}));
            return image;
        }
        return this.bitmap.preview;
    }

    toString () {
        return `ImageMediaData "${this.costumeName}"`;
    }
}

const UNCOMPRESSED_FIELDS = {
    DATA: 3,
    RATE: 4,
};

class UncompressedData extends ExtendedData {
    get data () {
        return this.fields[UNCOMPRESSED_FIELDS.DATA];
    }

    get rate () {
        return this.fields[UNCOMPRESSED_FIELDS.RATE];
    }
}

const SOUND_MEDIA_FIELDS = {
    NAME: 0,
    UNCOMPRESSED: 1,
    RATE: 4,
    BITS_PER_SAMPLE: 5,
    DATA: 6
};

class SoundMediaData extends ExtendedData {
    get name () {
        return this.string(SOUND_MEDIA_FIELDS.NAME);
    }

    get uncompressed () {
        return this.fields[SOUND_MEDIA_FIELDS.UNCOMPRESSED];
    }

    get rate () {
        if (this.uncompressed.data.value.length !== 0) {
            return this.uncompressed.rate;
        }
        return this.fields[SOUND_MEDIA_FIELDS.RATE];
    }

    get bitsPerSample () {
        return this.fields[SOUND_MEDIA_FIELDS.BITS_PER_SAMPLE];
    }

    get data () {
        return this.fields[SOUND_MEDIA_FIELDS.DATA];
    }

    get bytes () {
        if (!this._wav) {
            let samples;
            if (this.data && this.data.value) {
                samples = new SqueakSoundDecoder(this.bitsPerSample.value).decode(
                    this.data.value
                );
            } else {
                samples = new Int16Array(reverseBytes16(this.uncompressed.data.value.slice()).buffer);
            }

            this._wav = new Uint8Array(WAVFile.encode(samples, {
                sampleRate: this.rate && this.rate.value || this.uncompressed.rate.value
            }));
        }

        return this._wav;
    }

    get crc () {
        if (!this._crc) {
            this._crc = new CRC32().update(this.bytes).digest;
        }
        return this._crc;
    }

    get sampleCount () {
        return WAVFile.samples(this.bytes);
    }

    get preview () {
        const audio = new Audio();
        audio.controls = true;

        audio.src = URL.createObjectURL(
            new Blob([this.bytes.buffer],{ type: 'audio/wav' })
        );
        return audio;
    }

    toString () {
        return `SoundMediaData "${this.name}"`;
    }
}

const toTitleCase = str => str.replace(/_?\w/g, letter => {
    if (letter.startsWith('_')) return letter[1];
    return letter.toLowerCase();
})

const fieldData = (FIELDS, Super = ExtendedData) => {
    class Base extends Super {}

    Object.keys(FIELDS).forEach(key => {
        const index = FIELDS[key];
        Object.defineProperty(Base.prototype, toTitleCase(key), {
            get () {
                return this.fields[index];
            }
        });
    });

    return Base;
};

const LIST_WATCHER_FIELDS = {
    BOX: 0,
    HIDDEN_WHEN_NULL: 1,
    LIST_NAME: 8,
    CONTENTS: 9,
    TARGET: 10
};

class ListWatcherData extends fieldData(LIST_WATCHER_FIELDS) {
    get x () {
        if (this.hiddenWhenNull === null) return 5;
        return this.box.x + 1;
    }

    get y () {
        if (this.hiddenWhenNull === null) return 5;
        return this.box.y + 1;
    }

    get width () {
        return this.box.width - 2;
    }

    get height () {
        return this.box.height - 2;
    }
}

class UnknownData extends fieldData({
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 15,
    P: 16,
    Q: 17,
    R: 18,
    S: 19
}) {}

class AlignmentData extends fieldData({
    BOX: 0,
    PARENT: 1,
    FRAMES: 2,
    COLOR: 3,
    DIRECTION: 8,
    ALIGNMENT: 9
}) {}

class MorphData extends fieldData({
    BOX: 0,
    PARENT: 1,
    COLOR: 3
}) {}

class StaticStringData extends fieldData({
    BOX: 0,
    COLOR: 3,
    VALUE: 8,
}) {}

class UpdatingStringData extends fieldData({
    BOX: 0,
    READOUT_FRAME: 1,
    COLOR: 3,
    FONT: 6,
    VALUE: 8,
    TARGET: 10,
    CMD: 11,
    PARAM: 13
}) {}

class WatcherReadoutFrameData extends fieldData({
    BOX: 0,
}) {}

const WATCHER_MODES = {
    NORMAL: 1,
    LARGE: 2,
    SLIDER: 3,
    TEXT: 4
};

class WatcherData extends fieldData({
    BOX: 0,
    TARGET: 1,
    SHAPE: 2,
    READOUT: 14,
    READOUT_FRAME: 15,
    SLIDER: 16,
    ALIGNMENT: 17,
    SLIDER_MIN: 20,
    SLIDER_MAX: 21
}) {
    get x () {
        return this.box.x;
    }

    get y () {
        return this.box.y;
    }

    get mode () {
        if (this.slider === null) {
            if (this.readoutFrame.box.height <= 14) {
                return WATCHER_MODES.NORMAL;
            }
            return WATCHER_MODES.LARGE;
        }
        return WATCHER_MODES.SLIDER;
    }

    get isDiscrete () {
        return (
            Math.floor(this.sliderMin) === this.sliderMin &&
            Math.floor(this.sliderMax) === this.sliderMax &&
            Math.floor(this.readout.value) === this.readout.value
        );
    }
}

const EXTENDED_CONSTRUCTORS = {
    [TYPES.POINT]: PointData,
    [TYPES.RECTANGLE]: RectangleData,
    [TYPES.FORM]: ImageData,
    [TYPES.SQUEAK]: ImageData,
    [TYPES.SAMPLED_SOUND]: UncompressedData,
    [TYPES.SPRITE]: SpriteData,
    [TYPES.STAGE]: StageData,
    [TYPES.IMAGE_MEDIA]: ImageMediaData,
    [TYPES.SOUND_MEDIA]: SoundMediaData,
    [TYPES.ALIGNMENT]: AlignmentData,
    [TYPES.MORPH]: MorphData,
    [TYPES.WATCHER_READOUT_FRAME]: WatcherReadoutFrameData,
    [TYPES.STATIC_STRING]: StaticStringData,
    [TYPES.UPDATING_STRING]: UpdatingStringData,
    [TYPES.WATCHER]: WatcherData,
    [TYPES.LIST_WATCHER]: ListWatcherData
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

class SB1ReferenceFixer {
    constructor (table, filter) {
        this.table = Array.from(table);
        this.filter = filter;
        this.fixed = this.fix(this.table);
    }

    fix () {
        const fixed = [];

        for (let i = 0; i < this.table.length; i++) {
            this.fixItem(this.table[i]);
            if (this.filter && this.filter(this.table[i]) || !this.filter) {
                fixed.push(this.table[i]);
            }
        }

        return fixed;
    }

    fixItem (item) {
        if (typeof item.fields !== 'undefined') {
            item.fields = item.fields.map(this.deref, this);
        } else if (typeof item.bytes !== 'undefined') {
            item.width = this.deref(item.width);
            item.height = this.deref(item.height);
            item.depth = this.deref(item.depth);
            item.something = this.deref(item.something);
            item.bytes = this.deref(item.bytes);
            item.colormap = this.deref(item.colormap);
        } else if (Array.isArray(item)) {
            for (let i = 0; i < item.length; i++) {
                item[i] = this.deref(item[i]);
            }
        }
    }

    deref (ref) {
        if (ref instanceof Reference) {
            return this.table[ref.index - 1];
        }
        return ref;
    }
}

window.SB1ReferenceFixer = SB1ReferenceFixer;

class SB1Signature extends struct({
    version: new FixedAsciiString(10),
    infoByteLength: Uint32BE
}) {
    validate () {
        assert(
            this.equals({version: 'ScratchV01'}) ||
            this.equals({version: 'ScratchV02'}),
            'Invalid Scratch file signature.'
        );
    }
}

class SB1BlockHeader extends struct({
    ObjS: new FixedAsciiString(4),
    ObjSValue: Uint8,
    Stch: new FixedAsciiString(4),
    StchValue: Uint8,
    numObjects: Uint32BE
}) {
    validate () {
        assert(
            this.equals({
                ObjS: 'ObjS', ObjSValue: 1,
                Stch: 'Stch', StchValue: 1
            }),
            'Invalid Scratch file info block header.'
        );
    }
}

class SB1File {
    constructor (buffer) {
        this.buffer = buffer;
        this.uint8 = new Uint8Array(buffer);

        this.signature = new SB1Signature(this.uint8, 0);
        this.signature.validate();

        this.infoBlockHeader = new SB1BlockHeader(this.uint8, SB1Signature.prototype.size);
        this.infoBlockHeader.validate();
        this.infoPosition = this.infoBlockHeader.offset;
        this.infoLength = this.infoBlockHeader.numObjects;

        this.dataBlockHeader = new SB1BlockHeader(this.uint8, this.signature.infoByteLength + SB1Signature.prototype.size);
        this.dataBlockHeader.validate();
        this.dataPosition = this.dataBlockHeader.offset;
        this.dataLength = this.dataBlockHeader.numObjects;
    }

    get json () {
        return toSb2Json({
            info: this.info(),
            stageData: this.data(),
            images: this.images(),
            sounds: this.sounds()
        });
    }

    get zip () {
        return toSb2FakeZipApi({
            images: this.images(),
            sounds: this.sounds()
        });
    }

    view () {
        // console.log(this.json);
        return {
            signature: this.signature,
            infoBlockHeader: this.infoBlockHeader,
            dataBlockHeader: this.dataBlockHeader,
            toString() {
                return 'SB1File';
            }
        };
    }

    infoRaw () {
        return new SB1TokenObjectTakeIterator(new SB1TokenIterator(this.buffer, this.infoPosition + SB1BlockHeader.prototype.size), this.infoLength);
    }

    infoTable () {
        return new SB1ObjectIterator(this.infoRaw(), this.infoLength);
    }

    info () {
        if (!this._info) {
            this._info = new SB1ReferenceFixer(this.infoTable()).table[0];
        }
        return this._info;
    }

    dataRaw () {
        return new SB1TokenObjectTakeIterator(new SB1TokenIterator(this.buffer, this.dataPosition + SB1BlockHeader.prototype.size), this.dataLength);
    }

    dataTable () {
        return new SB1ObjectIterator(this.dataRaw(), this.dataLength);
    }

    dataFixed () {
        if (!this._data) {
            this._data = new SB1ReferenceFixer(this.dataTable()).table;
        }
        return this._data;
    }

    data () {
        return this.dataFixed()[0];
    }

    images () {
        const unique = new Set();
        return this.dataFixed().filter(obj => {
            if (obj instanceof ImageMediaData) {
                const array = obj.baseLayerData.value || obj.bitmap.bytes.value;
                if (unique.has(array)) return false;
                if (unique.has(obj.crc)) return false;
                unique.add(array);
                unique.add(obj.crc);
                return true;
            }
            return false;
        });
    }

    sounds () {
        const unique = new Set();
        return this.dataFixed().filter(obj => {
            if (obj instanceof SoundMediaData) {
                const array = obj.data && obj.data.value || obj.uncompressed.data.value;
                if (unique.has(array)) {
                    return false;
                }
                unique.add(array);
                return true;
            }
            return false;
        });
    }
}

window.SB1File = SB1File;

class SB1ArraySubView {
    constructor (array, start, end) {
        this.array = array instanceof SB1ArraySubView ? array.array: array;
        this.start = start;
        this.end = end;
    }

    get length () {
        return this.end - this.start;
    }

    get name () {
        return `${this.start + 1} - ${this.end}`;
    }

    map (fn) {
        const out = [];
        for (let i = this.start; i < this.end; i++) {
            out.push(fn(this.array[i], i, this));
        }
        return out;
    }

    static views (array) {
        if (array instanceof SB1ArrayFullView) {
            return array;
        }
        if (array.length > 100) {
            const scale = Math.pow(10, Math.ceil(Math.log(array.length) / Math.log(10)));
            const increment = scale / 10;

            const views = [];
            for (let i = (array.start || 0); i < (array.end || array.length); i += increment) {
                views.push(new SB1ArraySubView(array, i, Math.min(i + increment, array.end || array.length)));
                assert(views.length <= 10, 'Too many subviews');
            }
            views.push(new SB1ArrayFullView(array));
            return views;
        } else {
            return array;
        }
    }
}

class SB1ArrayFullView extends SB1ArraySubView {
    constructor (array) {
        super(array, array.start || 0, array.end || array.length);
    }

    get name () {
        return 'all';
    }
}

const allPropertyDescriptors = prototype => (
    prototype === null ?
        {} :
        Object.entries(Object.getOwnPropertyDescriptors(prototype))
            .reduce(
                (carry, [key, value]) => {
                    carry[key] = value;
                    return carry;
                },
                allPropertyDescriptors(Object.getPrototypeOf(prototype))
            )
);

const _expanded = {};

class SB1View {
    constructor (data, prefix = '', path = prefix) {
        this._elements = {};

        this.element = document.createElement('div');
        this.element.style.position = 'relative';
        this.element.style.top = '0';
        this.element.style.left = '0';
        // this.element.style.overflow = 'hidden';

        this.content = this.element;

        this.data = data;
        this.prefix = prefix;
        this.path = path;
        this.expanded = !!_expanded[this.path];
        this.canExpand = false;

        this.toggle = this.toggle.bind(this);

        this.element.addEventListener('click', this.toggle);

        this.render();
    }

    toggle (event) {
        if (!this.canExpand) return;

        if (event.target !== this._elements.arrow && event.target !== this._elements.title) return;

        _expanded[this.path] = this.expanded = !this.expanded;
        this.render();

        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    createElement (type, name) {
        if (!this._elements[name]) {
            this._elements[name] = document.createElement(type);
        }
        this._elements[name].innerHTML = '';
        return this._elements[name];
    }

    renderClear () {
        this.canExpand = false;
        while (this.element.children.length) {
            this.element.removeChild(this.element.children[0]);
        }
        this.content = this.element;
    }

    renderArrow () {
        this.canExpand = true;
        const arrowDiv = this.createElement('div', 'arrow');
        arrowDiv.innerHTML = '&#x25b6;';
        arrowDiv.style.position = 'absolute';
        arrowDiv.style.left = '0';
        arrowDiv.style.width = '1em';
        arrowDiv.style.transform = this.expanded ? 'rotateZ(90deg)' : '';
        arrowDiv.style.transition = 'transform 3s';
        this.element.appendChild(arrowDiv);

        const contentDiv = this.createElement('div', 'arrowContent');
        contentDiv.style.position = 'relative';
        contentDiv.style.left = '1em';
        contentDiv.style.right = '0';
        this.element.appendChild(contentDiv);
        this.content = contentDiv;
    }

    renderTitle (title) {
        const titleDiv = this.createElement('div', 'title');
        const fullTitle = (this.prefix ? `${this.prefix}: ` : '') + title;
        if (['\n', '\r', '<br>'].some(str => fullTitle.indexOf(str) !== -1) || fullTitle.length > 80) {
            this.renderArrow();
            if (this.expanded) {
                titleDiv.innerText = fullTitle;
            } else {
                const maxLength = Math.min(fullTitle.lastIndexOf(' ', 80), ['\n', '\r', '<br>'].reduce((value, str) => (fullTitle.indexOf(str) !== -1 ? Math.min(value, fullTitle.indexOf(str)) : value), Infinity));
                titleDiv.innerText = fullTitle.substring(0, maxLength) + ' ...';
            }
        } else {
            titleDiv.innerText = fullTitle;
        }
        this.content.appendChild(titleDiv);
        return titleDiv;
    }

    renderExpand (fn) {
        if (this.expanded) {
            const div = this.createElement('div', 'expanded');
            fn.call(this, div)
            .forEach(view => this.content.appendChild(view.element));
        }
    }

    render () {
        this.renderClear();
        if (this.data instanceof ExtendedData) {
            this.renderArrow();
            this.renderTitle(this.data);
            this.renderExpand(() => {
                return Object.entries(allPropertyDescriptors(Object.getPrototypeOf(this.data)))
                .filter(([, desc]) => desc.get)
                .map(([name]) => {
                    try {
                        return new SB1View(this.data[name], name, `${this.path}.${name}`);
                    } catch (err) {
                        console.error(err);
                        return new SB1View('An error occured rendering this data.', name, `${this.path}.${name}`);
                    }
                });
            });
        } else if (this.data && typeof this.data.view === 'function') {
            const view = this.data.view();
            this.renderArrow();
            this.renderTitle(view);
            this.renderExpand(() => {
                return Object.entries(view)
                .filter(([, value]) => typeof value !== 'function')
                .map(([name]) => {
                    try {
                        return new SB1View(view[name], name, `${this.path}.${name}`);
                    } catch (err) {
                        console.error(err);
                        return new SB1View('An error occured rendering this data.', name, `${this.path}.${name}`);
                    }
                });
            });
        } else if (this.data instanceof Reference) {
            this.renderTitle(`Reference { index: ${this.data.index} }`);
        } else if (this.data instanceof Header) {
            this.renderTitle(`Header { classId: ${this.data.classId} (${TYPE_NAMES[this.data.classId]}), size: ${this.data.size} }`);
        } else if ((this.data instanceof Value) && (this.data.classId === TYPES.COLOR || this.data.classId === TYPES.TRANSLUCENT_COLOR)) {
            this.renderTitle((+this.data).toString(16).padStart(8, '0')).style.fontFamily = 'monospace';
        } else if (this.data instanceof Value) {
            if (this.data.value && this.data.value.buffer) {
                this.renderTitle(`${this.data.value.constructor.name} (${this.data.value.length})`);
            } else {
                this.renderTitle('' + this.data);
            }
        } else if (Array.isArray(this.data) || this.data instanceof SB1ArraySubView) {
            if (this.data.length) this.renderArrow();
            this.renderTitle(`Array (${this.data.length})`);
            if (this.data.length) this.renderExpand(() => {
                return SB1ArraySubView.views(this.data).map((field, index) => new SB1View(field, field instanceof SB1ArraySubView ? field.name : index + 1, `${this.path}[${index}]`));
            });
        } else if (['string', 'number', 'boolean'].includes(typeof this.data)) {
            this.renderTitle('' + this.data);
        } else if (this.data instanceof HTMLElement) {
            this.content.appendChild(this.data);
        } else if (['undefined', 'string', 'number', 'boolean'].includes(typeof this.data) || this.data === null) {
            this.renderTitle('' + this.data);
        } else {
            this.renderTitle(`Unknown Structure(${this.data ? this.data.classId || this.data.constructor.name : ''})`);
        }

        // const clearDiv = this.createElement('div', 'clear');
        // clearDiv.style.clear = 'both';
        // this.content.appendChild(clearDiv);
    }
}

window.SB1View = SB1View;

class PNGSignature extends struct({
    support8Bit: Uint8,
    png: new FixedAsciiString(3),
    dosLineEnding: new FixedAsciiString(2),
    dosEndOfFile: new FixedAsciiString(1),
    unixLineEnding: new FixedAsciiString(1)
}) {}

class PNGChunkStart extends struct({
    length: Uint32BE,
    chunkType: new FixedAsciiString(4)
}) {}

class PNGChunkEnd extends struct({
    checksum: Uint32BE
}) {}

class PNGIHDRChunkBody extends struct({
    width: Uint32BE,
    height: Uint32BE,
    bitDepth: Uint8,
    colorType: Uint8,
    compressionMethod: Uint8,
    filterMethod: Uint8,
    interlaceMethod: Uint8,
}) {}

const DEFLATE_BLOCK_SIZE_MAX = 0xffff;

class PNGFilterMethodByte extends struct({
    method: Uint8
}) {}

class DeflateHeader extends struct({
    cmf: Uint8,
    flag: Uint8
}) {}

class DeflateChunkStart extends struct({
    lastBlock: Uint8,
    length: Uint16LE,
    lengthCheck: Uint16LE
}) {}

class DeflateEnd extends struct({
    checksum: Uint32LE
}) {}

class CRC32 {
    constructor () {
        this.bit = new Uint32Array(1);
        // this.crc = new Uint32Array(1);
        this.crc = 0;
        this.c = 0;

        this.table = [];
        let c;
        for (let i = 0; i < 256; i++) {
            c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            }
            this.table[i] = c >>> 0;
        }
    }

    update (uint8, position = 0, length = uint8.length) {
        let crc = (~this.crc) >>> 0;
        for (let i = 0; i < length; i++) {
            crc = (crc >>> 8) ^ this.table[(crc ^ uint8[position + i]) & 0xff];
        }
        this.crc = (~crc) >>> 0;
        return this;
        this.crc[0] = ~this.crc[0];
        for (let i = 0; i < length; i++) {
            this.crc[0] = (this.crc[0] >>> 8) ^ this.table[(this.crc[0] ^ uint8[position + i]) & 0xff];
        }
        this.crc[0] = ~this.crc[0];
        return this;
    }

    get digest () {
        return this.crc;
    }
}

class Adler32 {
    constructor () {
        this.adler = 1;
    }

    update (uint8, position, length) {
        let a = this.adler & 0xffff;
        let b = this.adler >>> 16;
        for (let i = 0; i < length; i++) {
            a = (a + uint8[position + i]) % 65521;
            b = (b + a) % 65521;
        }
        this.adler = (b << 16) | a;
        return this;
    }

    get digest () {
        return this.adler;
    }
}

const _bgra2rgbaInPlace = uint8 => {
    for (let i = 0; i < uint8.length; i += 4) {
        const r = uint8[i + 2];
        const b = uint8[i + 0];
        uint8[i + 2] = b;
        uint8[i + 0] = r;
    }
    return uint8;
};

class PNGFile {
    encode (width, height, pixelsUint8) {
        const rowSize = width * 4 + PNGFilterMethodByte.prototype.size;
        const bodySize = rowSize * height;
        let bodyRemaining = bodySize;
        const blocks = Math.ceil(bodySize / DEFLATE_BLOCK_SIZE_MAX);
        const idatSize = (
            DeflateHeader.prototype.size +
            blocks * DeflateChunkStart.prototype.size +
            DeflateEnd.prototype.size +
            bodySize
        );
        const size = (
            PNGSignature.prototype.size +
            // IHDR
            PNGChunkStart.prototype.size +
            PNGIHDRChunkBody.prototype.size +
            PNGChunkEnd.prototype.size +
            // IDAT
            PNGChunkStart.prototype.size +
            idatSize +
            PNGChunkEnd.prototype.size +
            // IEND
            PNGChunkStart.prototype.size +
            PNGChunkEnd.prototype.size
        );
        const buffer = new ArrayBuffer(size);
        const uint8 = new Uint8Array(buffer);

        const stream = new ByteStream(new ArrayBuffer(size));

        let position = 0;

        stream.writeStruct(PNGSignature, {
            support8Bit: 0x89,
            png: 'PNG',
            dosLineEnding: '\r\n',
            dosEndOfFile: '\x1a',
            unixLineEnding: '\n'
        });

        stream.writeStruct(PNGChunkStart, {
            length: PNGIHDRChunkBody.prototype.size,
            chunkType: 'IHDR'
        });

        const ihdrBlockPosition = stream.position;
        stream.writeStruct(PNGIHDRChunkBody, {
            width,
            height,
            bitDepth: 8,
            colorType: 6,
            compressionMethod: 0,
            filterMethod: 0,
            interlaceMethod: 0
        });

        stream.writeStruct(PNGChunkEnd, {
            checksum: new CRC32()
            .update(stream.uint8, ihdrBlockPosition - 4, PNGIHDRChunkBody.prototype.size + 4)
            .digest
        });

        stream.writeStruct(PNGChunkStart, {
            length: idatSize,
            chunkType: 'IDAT'
        });

        stream.writeStruct(DeflateHeader, {
            cmf: 0b00001000,
            flag: 0b00011101
        });

        const deflateAdler = new Adler32();
        const pngCrc = new CRC32();

        pngCrc.update(stream.uint8, stream.position - Uint32BE.size - DeflateHeader.prototype.size, Uint32BE.size + DeflateHeader.prototype.size);

        let deflateIndex = 0;

        let rowIndex = 0;
        let y = 0;
        let pixelsIndex = 0;
        while (pixelsIndex < pixelsUint8.length) {
            if (deflateIndex === 0) {
                const deflateChunkSize = Math.min(bodyRemaining, DEFLATE_BLOCK_SIZE_MAX);
                const deflateChunkPosition = stream.position;
                stream.writeStruct(DeflateChunkStart, {
                    lastBlock: deflateChunkSize === bodyRemaining ? 1 : 0,
                    length: deflateChunkSize,
                    lengthCheck: deflateChunkSize ^ 0xffff
                });

                pngCrc.update(stream.uint8, deflateChunkPosition, DeflateChunkStart.prototype.size);
            }

            if (rowIndex === 0) {
                const filterBytePosition = stream.position;
                stream.writeStruct(PNGFilterMethodByte, {
                    method: 0
                });

                deflateAdler.update(stream.uint8, filterBytePosition, PNGFilterMethodByte.prototype.size);
                pngCrc.update(stream.uint8, filterBytePosition, PNGFilterMethodByte.prototype.size);

                rowIndex += PNGFilterMethodByte.prototype.size;
                bodyRemaining -= PNGFilterMethodByte.prototype.size;
                deflateIndex += PNGFilterMethodByte.prototype.size;
            } else {
                const rowPartialSize = Math.min(
                    pixelsUint8.length - pixelsIndex,
                    rowSize - rowIndex,
                    DEFLATE_BLOCK_SIZE_MAX - deflateIndex
                );

                const bytesPosition = stream.position;
                stream.writeBytes(pixelsUint8, pixelsIndex, pixelsIndex + rowPartialSize);

                deflateAdler.update(stream.uint8, bytesPosition, rowPartialSize);
                pngCrc.update(stream.uint8, bytesPosition, rowPartialSize);

                pixelsIndex += rowPartialSize;
                rowIndex += rowPartialSize;
                bodyRemaining -= rowPartialSize;
                deflateIndex += rowPartialSize;
            }

            if (deflateIndex >= DEFLATE_BLOCK_SIZE_MAX) {
                deflateIndex = 0;
            }

            if (rowIndex === rowSize) {
                rowIndex = 0;
                y += 1;
            }
        }

        stream.writeStruct(DeflateEnd, {
            checksum: deflateAdler.digest
        });

        stream.writeStruct(PNGChunkEnd, {
            checksum: pngCrc.digest
        });

        stream.writeStruct(PNGChunkStart, {
            length: 0,
            chunkType: 'IEND'
        });

        stream.writeStruct(PNGChunkEnd, {
            checksum: 0xae426082
        });

        return stream.buffer;
    }

    static encode (width, height, pixels) {
        return new PNGFile().encode(width, height, pixels);
    }
}

class SqueakImageDecoder {
    decodeIntIncrement (bytes, position) {
        const count = bytes[position];
        if (count <= 223) {
            return 1;
        }
        if (count <= 254) {
            return 2;
        }
        return 5;
    }

    decodeInt (bytes, position) {
        const count = bytes[position];
        if (count <= 223) {
            return count;
        }
        if (count <= 254) {
            return ((count - 224) * 256) + bytes[position + 1];
        }
        return uint32BE(bytes, position + 1);
    }

    decode (width, height, depth, bytes, colormap, table) {
        const pixels = this.decodePixels(bytes, depth === 32);

        if (depth <= 8) {
            if (!colormap) {
                colormap = depth === 1 ? defaultOneBitColorMap : defaultColorMap;
            }
            return this.unpackPixels(pixels, width, height, depth, colormap);
        } else if (depth === 16) {
            return this.raster16To32(pixels, width, height);
        } else if (depth === 32) {
            return pixels;
        }
        throw new Error('Unhandled Squeak Image depth.');
    }

    decodePixels (bytes, withAlpha) {
        let result;

        // Already decompressed
        if (Array.isArray(bytes) || bytes instanceof Uint32Array) {
            result = new Uint32Array(bytes);
            if (withAlpha) {
                for (let i = 0; i < result.length; i++) {
                    if (result[i] !== 0) {
                        result[i] = 0xff000000 | result[i];
                    }
                }
            }
            return result;
        }

        const pixelsOut = this.decodeInt(bytes, 0);
        let position = this.decodeIntIncrement(bytes, 0);
        result = new Uint32Array(pixelsOut);

        let i = 0;
        while (i < pixelsOut) {
            const runLengthAndCode = this.decodeInt(bytes, position);
            position += this.decodeIntIncrement(bytes, position);
            const runLength = runLengthAndCode >> 2;
            const code = runLengthAndCode & 0b11;

            let w;

            switch (code) {
            case 0:
                i += runLength;
                break;

            case 1:
                w = bytes[position++];
                w = (w << 24) | (w << 16) | (w << 8) | w;
                if (withAlpha && w != 0) {
                    w |= 0xff000000;
                }
                for (let j = 0; j < runLength; j++) {
                    result[i++] = w;
                }
                break;

            case 2:
                w = uint32BE(bytes, position);
                position += 4;
                if (withAlpha && w !== 0) {
                    w |= 0xff000000;
                }
                for (let j = 0; j < runLength; j++) {
                    result[i++] = w;
                }
                break;

            case 3:
                for (let j = 0; j < runLength; j++) {
                    w = uint32BE(bytes, position);
                    position += 4;
                    if (withAlpha && w !== 0) {
                        w |= 0xff000000;
                    }
                    result[i++] = w;
                }
            }
        }

        return result;
    }

    unpackPixels (words, width, height, depth, colormap) {
        const result = new Uint32Array(width * height);
        const span = words.length / height;
        const mask = (1 << depth) - 1;
        const pixelsPerWord = 32 / depth;
        let dst = 0;

        let src = 0;
        for (let y = 0; y < height; y++) {
            let word;
            let shift = -1;
            for (let x = 0; x < width; x++) {
                if (shift < 0) {
                    shift = depth * (pixelsPerWord - 1);
                    word = words[src++];
                }
                result[dst++] = colormap[(word >> shift) & mask];
                shift -= depth;
            }
        }
        return result;
    }

    raster16To32 (words, width, height) {
        const result = new Uint32Array(2 * words.length);
        let shift;
        let word;
        let pix;
        let src = 0;
        let dst = 0;
        for (let y = 0; y < height; y++) {
            shift = -1;
            for (let x = 0; x < width; x++) {
                if (shift < 0) {
                    shift = 16;
                    word = words[src++];
                }
                pix = (word >> shift) & 0xffff;
                if (pix !== 0) {
                    const red = (pix >> 7) & 0b11111000;
                    const green = (pix >> 2) & 0b11111000;
                    const blue = (pix << 3) & 0b11111000;
                    pix = 0xff000000 | (red << 16) | (green << 8) | blue;
                }
                result[dst++] = pix;
                shift -= 16;
            }
        }
        return result;
    }

    buildCustomColormap (depth, colors, table) {
        const result = new Uint32Array(1 << depth);
        for (let i = 0; i < colors.length; i++) {
            result[i] = table[colors[i].index - 1];
        }
        return result;
    }
}

const SQUEAK_SOUND_STEP_SIZE_TABLE = [
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41,
    45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209,
    230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876,
    963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749,
    3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630,
    9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623,
    27086, 29794, 32767
];

const SQUEAK_SOUND_INDEX_TABLES = {
    2: [-1, 2, -1, 2],
    3: [-1, -1, 2, 4, -1, -1, 2, 4],
    4: [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8],
    5: [
        -1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16,
        -1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16
    ]
};

class SqueakSoundDecoder {
    constructor (bitsPerSample) {
        this.bitsPerSample = bitsPerSample;

        this.indexTable = SQUEAK_SOUND_INDEX_TABLES[bitsPerSample];

        this.signMask = 1 << (bitsPerSample - 1);
        this.valueMask = this.signMask - 1;
        this.valueHighBit = this.signMask >> 1;

        this.bitPosition = 0;
        this.currentByte = 0;
        this.position = 0;
    }

    decode (data) {
        // Reset position information.
        this.bitPosition = 0;
        this.currentByte = 0;
        this.position = 0;

        const size = Math.floor(data.length * 8 / this.bitsPerSample);
        const result = new Int16Array(size);

        let sample = 0;
        let index = 0;
        let position = 0;

        for (let i = 0; i < size; i++) {
            const code = this.nextCode(data);

            if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
                assert(code >= 0, 'Ran out of bits in Squeak Sound');
            }

            let step = SQUEAK_SOUND_STEP_SIZE_TABLE[index];
            let delta = 0;
            for (let bit = this.valueHighBit; bit > 0; bit = bit >> 1) {
                if ((code & bit) != 0) {
                    delta += step;
                }
                step = step >> 1;
            }
            delta += step;

            sample += ((code & this.signMask) !== 0) ? -delta : delta;

            index += this.indexTable[code];
            if (index < 0) index = 0;
            if (index > 88) index = 88;

            if (sample > 32767) sample = 32767;
            if (sample < -32768) sample = -32768;

            result[i] = sample;
        }

        return result;
    }

    nextCode (data) {
        let result = 0;
        let remaining = this.bitsPerSample;
        while (true) {
            let shift = remaining - this.bitPosition;
            result += (shift < 0) ? (this.currentByte >> -shift) : (this.currentByte << shift);
            if (shift > 0) {
                remaining -= this.bitPosition;
                if (data.length - this.position > 0) {
                    this.currentByte = data[this.position++];
                    this.bitPosition = 8;
                } else {
                    this.currentByte = 0;
                    this.bitPosition = 0;
                    return -1;
                }
            } else {
                this.bitPosition -= remaining;
                this.currentByte = this.currentByte & (0xff >> (8 - this.bitPosition));
                break;
            }
        }
        return result;
    }
}

class WAVESignature extends struct({
    riff: new FixedAsciiString(4),
    length: Uint32LE,
    wave: new FixedAsciiString(4)
}) {}

class WAVEChunkStart extends struct({
    chunkType: new FixedAsciiString(4),
    length: Uint32LE,
}) {}

class WAVEFMTChunkBody extends struct({
    format: Uint16LE,
    channels: Uint16LE,
    sampleRate: Uint32LE,
    bytesPerSec: Uint32LE,
    blockAlignment: Uint16LE,
    bitsPerSample: Uint16LE
}) {}

const reverseBytes16 = input => {
    const uint8 = new Uint8Array(input);
    for (let i = 0; i < uint8.length; i += 2) {
        uint8[i] = input[i + 1];
        uint8[i + 1] = input[i];
    }
    return uint8;
};

class WAVFile {
    encode (intSamples, {channels = 1, sampleRate = 22050} = {}) {
        const samplesUint8 = new Uint8Array(intSamples.buffer, intSamples.byteOffset, intSamples.byteLength);
        const size = (
            WAVESignature.prototype.size +
            WAVEChunkStart.prototype.size +
            WAVEFMTChunkBody.prototype.size +
            WAVEChunkStart.prototype.size +
            samplesUint8.length
        );

        const uint8 = new Uint8Array(size);
        let position = 0;

        Object.assign(new WAVESignature(uint8, position), {
            riff: 'RIFF',
            length: size - 8,
            wave: 'WAVE'
        });
        position += WAVESignature.prototype.size;

        Object.assign(new WAVEChunkStart(uint8, position), {
            chunkType: 'fmt ',
            length: WAVEFMTChunkBody.prototype.size
        });
        position += WAVEChunkStart.prototype.size;

        Object.assign(new WAVEFMTChunkBody(uint8, position), {
            format: 1,
            channels: channels,
            sampleRate: sampleRate,
            bytesPerSec: sampleRate * 2 * channels,
            blockAlignment: channels * 2,
            bitsPerSample: 16
        });
        position += WAVEFMTChunkBody.prototype.size;

        Object.assign(new WAVEChunkStart(uint8, position), {
            chunkType: 'data',
            length: size - position - WAVEChunkStart.prototype.size
        });
        position += WAVEChunkStart.prototype.size;

        let index = 0;
        while (index < samplesUint8.length) {
            uint8[position++] = samplesUint8[index++];
        }

        return uint8;
    }

    static encode (intSamples, options) {
        return new WAVFile().encode(intSamples, options);
    }

    static samples (bytes) {
        const headerLength = new WAVEChunkStart(bytes, WAVESignature.prototype.size).length;
        const bodyLength = new WAVEChunkStart(bytes, WAVESignature.prototype.size + WAVEChunkStart.prototype.size + headerLength).length;
        return bodyLength / 2;
    }
}

const defaultColorMap = [
    0x00000000, 0xFF000000, 0xFFFFFFFF, 0xFF808080, 0xFFFF0000, 0xFF00FF00, 0xFF0000FF, 0xFF00FFFF,
    0xFFFFFF00, 0xFFFF00FF, 0xFF202020, 0xFF404040, 0xFF606060, 0xFF9F9F9F, 0xFFBFBFBF, 0xFFDFDFDF,
    0xFF080808, 0xFF101010, 0xFF181818, 0xFF282828, 0xFF303030, 0xFF383838, 0xFF484848, 0xFF505050,
    0xFF585858, 0xFF686868, 0xFF707070, 0xFF787878, 0xFF878787, 0xFF8F8F8F, 0xFF979797, 0xFFA7A7A7,
    0xFFAFAFAF, 0xFFB7B7B7, 0xFFC7C7C7, 0xFFCFCFCF, 0xFFD7D7D7, 0xFFE7E7E7, 0xFFEFEFEF, 0xFFF7F7F7,
    0xFF000000, 0xFF003300, 0xFF006600, 0xFF009900, 0xFF00CC00, 0xFF00FF00, 0xFF000033, 0xFF003333,
    0xFF006633, 0xFF009933, 0xFF00CC33, 0xFF00FF33, 0xFF000066, 0xFF003366, 0xFF006666, 0xFF009966,
    0xFF00CC66, 0xFF00FF66, 0xFF000099, 0xFF003399, 0xFF006699, 0xFF009999, 0xFF00CC99, 0xFF00FF99,
    0xFF0000CC, 0xFF0033CC, 0xFF0066CC, 0xFF0099CC, 0xFF00CCCC, 0xFF00FFCC, 0xFF0000FF, 0xFF0033FF,
    0xFF0066FF, 0xFF0099FF, 0xFF00CCFF, 0xFF00FFFF, 0xFF330000, 0xFF333300, 0xFF336600, 0xFF339900,
    0xFF33CC00, 0xFF33FF00, 0xFF330033, 0xFF333333, 0xFF336633, 0xFF339933, 0xFF33CC33, 0xFF33FF33,
    0xFF330066, 0xFF333366, 0xFF336666, 0xFF339966, 0xFF33CC66, 0xFF33FF66, 0xFF330099, 0xFF333399,
    0xFF336699, 0xFF339999, 0xFF33CC99, 0xFF33FF99, 0xFF3300CC, 0xFF3333CC, 0xFF3366CC, 0xFF3399CC,
    0xFF33CCCC, 0xFF33FFCC, 0xFF3300FF, 0xFF3333FF, 0xFF3366FF, 0xFF3399FF, 0xFF33CCFF, 0xFF33FFFF,
    0xFF660000, 0xFF663300, 0xFF666600, 0xFF669900, 0xFF66CC00, 0xFF66FF00, 0xFF660033, 0xFF663333,
    0xFF666633, 0xFF669933, 0xFF66CC33, 0xFF66FF33, 0xFF660066, 0xFF663366, 0xFF666666, 0xFF669966,
    0xFF66CC66, 0xFF66FF66, 0xFF660099, 0xFF663399, 0xFF666699, 0xFF669999, 0xFF66CC99, 0xFF66FF99,
    0xFF6600CC, 0xFF6633CC, 0xFF6666CC, 0xFF6699CC, 0xFF66CCCC, 0xFF66FFCC, 0xFF6600FF, 0xFF6633FF,
    0xFF6666FF, 0xFF6699FF, 0xFF66CCFF, 0xFF66FFFF, 0xFF990000, 0xFF993300, 0xFF996600, 0xFF999900,
    0xFF99CC00, 0xFF99FF00, 0xFF990033, 0xFF993333, 0xFF996633, 0xFF999933, 0xFF99CC33, 0xFF99FF33,
    0xFF990066, 0xFF993366, 0xFF996666, 0xFF999966, 0xFF99CC66, 0xFF99FF66, 0xFF990099, 0xFF993399,
    0xFF996699, 0xFF999999, 0xFF99CC99, 0xFF99FF99, 0xFF9900CC, 0xFF9933CC, 0xFF9966CC, 0xFF9999CC,
    0xFF99CCCC, 0xFF99FFCC, 0xFF9900FF, 0xFF9933FF, 0xFF9966FF, 0xFF9999FF, 0xFF99CCFF, 0xFF99FFFF,
    0xFFCC0000, 0xFFCC3300, 0xFFCC6600, 0xFFCC9900, 0xFFCCCC00, 0xFFCCFF00, 0xFFCC0033, 0xFFCC3333,
    0xFFCC6633, 0xFFCC9933, 0xFFCCCC33, 0xFFCCFF33, 0xFFCC0066, 0xFFCC3366, 0xFFCC6666, 0xFFCC9966,
    0xFFCCCC66, 0xFFCCFF66, 0xFFCC0099, 0xFFCC3399, 0xFFCC6699, 0xFFCC9999, 0xFFCCCC99, 0xFFCCFF99,
    0xFFCC00CC, 0xFFCC33CC, 0xFFCC66CC, 0xFFCC99CC, 0xFFCCCCCC, 0xFFCCFFCC, 0xFFCC00FF, 0xFFCC33FF,
    0xFFCC66FF, 0xFFCC99FF, 0xFFCCCCFF, 0xFFCCFFFF, 0xFFFF0000, 0xFFFF3300, 0xFFFF6600, 0xFFFF9900,
    0xFFFFCC00, 0xFFFFFF00, 0xFFFF0033, 0xFFFF3333, 0xFFFF6633, 0xFFFF9933, 0xFFFFCC33, 0xFFFFFF33,
    0xFFFF0066, 0xFFFF3366, 0xFFFF6666, 0xFFFF9966, 0xFFFFCC66, 0xFFFFFF66, 0xFFFF0099, 0xFFFF3399,
    0xFFFF6699, 0xFFFF9999, 0xFFFFCC99, 0xFFFFFF99, 0xFFFF00CC, 0xFFFF33CC, 0xFFFF66CC, 0xFFFF99CC,
    0xFFFFCCCC, 0xFFFFFFCC, 0xFFFF00FF, 0xFFFF33FF, 0xFFFF66FF, 0xFFFF99FF, 0xFFFFCCFF, 0xFFFFFFFF];

const defaultOneBitColorMap = [0xFFFFFFFF, 0xFF000000];

const sb1SpecMap = {
    'changeVariable': block => [block[2], block[1], block[3]],
    'EventHatMorph': block => {
        if (block[1] === 'Scratch-StartClicked') {
            return ['whenGreenFlag'];
        }
        return ['whenIReceive', block[1]];
    },
    'MouseClickEventHatMorph': () => ['whenClicked'],
    'KeyEventHatMorph': block => ['whenKeyPressed', block[1]],
    'stopScripts': block => {
        if (block[1] === 'other scripts') {
            return [block[0], 'other scripts in sprite'];
        }
        return block;
    },
    'abs': block => ['computeFunction:of:', 'abs', block[1]],
    'sqrt': block => ['computeFunction:of:', 'sqrt', block[1]],
    'doReturn': () => ['stopScripts', 'this script'],
    'stopAll': () => ['stopScripts', 'all'],
    'showBackground:': block => ['startScene', block[1]],
    'nextBackground': () => ['nextScene'],
    'doForeverIf': block => ['doForever', [['doIf', block[1], block[2]]]]
};

const toSb2Json = root => {
    const {info, stageData, images, sounds} = root;

    const pairs = array => {
        const pairs = [];
        for (let i = 0; i < array.length; i += 2) {
            pairs.push([array[i], array[i + 1]]);
        }
        return pairs;
    };

    const toSb2JsonVariable = ([name, value]) => ({
        name: name.valueOf(),
        value: value.valueOf(),
        isPersistent: false
    });

    // const toSb2JsonList = list => {
    //
    // };

    // const toSb2JsonWatcher = watcher => {
    //
    // };
    //
    // const toSb2JsonListWatcher = listWatcher => {
    //
    // };

    const toSb2JsonSound = soundMediaData => {
        const soundID = sounds.findIndex(sound => sound.crc === soundMediaData.crc);
        return {
            soundName: soundMediaData.name,
            soundID,
            md5: `${soundID}.wav`,
            sampleCount: soundMediaData.sampleCount,
            rate: soundMediaData.rate.value,
            format: ''
        };
    };

    const toSb2JsonCostume = imageMediaData => {
        const baseLayerID = images.findIndex(image => image.crc === imageMediaData.crc);
        return {
            costumeName: imageMediaData.costumeName,
            baseLayerID,
            baseLayerMD5: `${baseLayerID}.${imageMediaData.extension}`,
            bitmapResolution: 1,
            rotationCenterX: imageMediaData.rotationCenter.x.value,
            rotationCenterY: imageMediaData.rotationCenter.y.value
        };
    };

    const toSb2JsonBlock = blockData => {
        let output = blockData.map(toSb2JsonBlockArg);
        const spec = sb1SpecMap[output[0]];
        if (spec) {
            output = spec(output);
        }
        return output;
    };

    const toSb2JsonStack = stackData => {
        return stackData.map(toSb2JsonBlock);
    };

    const toSb2JsonBlockArg = argData => {
        if (argData instanceof SpriteData) {
            return argData.objName;
        }
        else if (Array.isArray(argData)) {
            if (argData.length === 0 || Array.isArray(argData[0])) {
                return toSb2JsonStack(argData);
            }
            return toSb2JsonBlock(argData);
        }
        return (argData && typeof argData === 'object') ? argData.value : argData;
    };

    const toSb2JsonScript = scriptData => {
        return [
            scriptData[0].x.valueOf(),
            scriptData[0].y.valueOf(),
            toSb2JsonStack(scriptData[1])
        ];
    };

    const toSb2JsonSprite = spriteData => {
        const rawCostumes = spriteData.media
        .filter(data => data instanceof ImageMediaData);
        const rawSounds = spriteData.media
        .filter(data => data instanceof SoundMediaData);
        return {
            objName: spriteData.objName,
            variables: pairs(spriteData.vars).map(toSb2JsonVariable),
            lists: [],
            scripts: spriteData.blocksBin.map(toSb2JsonScript),
            costumes: rawCostumes
            .map(toSb2JsonCostume),
            currentCostumeIndex: rawCostumes.findIndex(image => image.crc === spriteData.currentCostume.crc),
            sounds: rawSounds.map(toSb2JsonSound),
            scratchX: spriteData.scratchX,
            scratchY: spriteData.scratchY,
            scale: spriteData.scalePoint.x.valueOf(),
            direction: Math.round(spriteData.rotationDegrees * 1e6) / 1e6 - 270,
            rotationStyle: spriteData.rotationStyle.valueOf(),
            isDraggable: spriteData.draggable.valueOf(),
            indexInLibrary: stageData.spriteOrderInLibrary.indexOf(spriteData),
            visible: spriteData.visible,
            spriteInfo: {}
        };
    };

    const toSb2JsonChild = child => {
        if (child instanceof SpriteData) {
            return toSb2JsonSprite(child);
        }
        return null;
    }

    const toSb2JsonStage = stageData => {
        const rawCostumes = stageData.media
        .filter(data => data instanceof ImageMediaData);
        const rawSounds = stageData.media
        .filter(data => data instanceof SoundMediaData);
        return {
            objName: stageData.objName,
            variables: pairs(stageData.vars).map(toSb2JsonVariable),
            lists: [],
            scripts: stageData.blocksBin.map(toSb2JsonScript),
            costumes: rawCostumes
            .map(toSb2JsonCostume),
            currentCostumeIndex: rawCostumes.findIndex(image => image.crc === stageData.currentCostume.crc),
            sounds: rawSounds.map(toSb2JsonSound),
            penLayerMD5: '5c81a336fab8be57adc039a8a2b33ca9.png',
            penLayerID: 0,
            tempoBPM: stageData.tempoBPM,
            videoAlpha: 0.5,
            children: stageData.stageContents.map(toSb2JsonChild).filter(Boolean)
        };
    };

    const toSb2JsonInfo = info => {
        const obj = {};
        for (let i = 0; i < info.length; i += 2) {
            if ('' + info[i] === 'thumbnail') continue;
            obj['' + info[i]] = '' + info[i + 1];
        }
        return obj;
    };

    return Object.assign(toSb2JsonStage(stageData), {
        info: toSb2JsonInfo(info)
    });
};

class FakeZipFile {
    constructor (file) {
        this.file = file;
    }

    async (outputType) {
        assert(outputType === 'uint8array', 'SB1FakeZipFile only supports uint8array');

        return Promise.resolve(this.file.bytes);
    }
}

class FakeZip {
    constructor (files) {
        this.files = files;
    }

    file (file) {
        if (file in this.files) {
            return new FakeZipFile(this.files[file]);
        }
    }
}

const toSb2FakeZipApi = ({images, sounds}) => {
    const files = {};

    let index = 0;
    for (const image of images) {
        files[`${index++}.${image.extension}`] = {
            bytes: image.bytes
        };
    }

    index = 0;
    for (const sound of sounds) {
        files[`${index++}.wav`] = {
            bytes: sound.bytes
        };
    }

    return new FakeZip(files);
};

module.exports = SB1File;
