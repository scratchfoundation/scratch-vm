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

exports.StructMember = StructMember;

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

exports.Uint8 = Uint8;

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

exports.Uint16BE = Uint16BE;

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

exports.Int16BE = Int16BE;

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

exports.Int32BE = Int32BE;

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

exports.Uint16LE = Uint16LE;

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

exports.Uint32BE = Uint32BE;

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

exports.Uint32LE = Uint32LE;

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

exports.DoubleBE = DoubleBE;

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

exports.FixedAsciiString = FixedAsciiString;
