const {Uint32BE} = require('./byte-primitives');
const {CRC32} = require('./crc32');
const {PNGChunkStart, PNGChunkEnd} = require('./png-blocks');

class PNGChunkStream {
    constructor (stream, chunkType = 'IHDR') {
        this.stream = stream;

        this.start = this.stream.writeStruct(PNGChunkStart, {
            length: 0,
            chunkType
        });

        this.crc = new CRC32();
    }

    get uint8 () {
        return this.stream.uint8;
    }

    set uint8 (value) {
        this.stream.uint8 = value;
        return this.stream.uint8;
    }

    get position () {
        return this.stream.position;
    }

    set position (value) {
        this.stream.position = value;
        return this.stream.position;
    }

    writeStruct (StructType, data) {
        return this.stream.writeStruct(StructType, data);
    }

    writeBytes (bytes, start = 0, end = bytes.length) {
        return this.stream.writeBytes(bytes, start, end);
    }

    finish () {
        const crcStart = this.start.offset + this.start.size;
        const length = this.position - crcStart;
        this.start.length = length;

        this.crc.update(this.stream.uint8, crcStart - Uint32BE.size, length + Uint32BE.size);
        this.stream.writeStruct(PNGChunkEnd, {
            checksum: this.crc.digest
        });
    }
}

exports.PNGChunkStream = PNGChunkStream;
