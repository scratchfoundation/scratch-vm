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

exports.ByteStream = ByteStream;
