const {Uint32BE} = require('./byte-primitives');
const {CRC32} = require('./crc32');
const {PNGChunkStart, PNGChunkEnd} = require('./png-blocks');
const {ProxyStream} = require('./proxy-stream');

class PNGChunkStream extends ProxyStream {
    constructor (stream, chunkType = 'IHDR') {
        super(stream);

        this.start = this.stream.writeStruct(PNGChunkStart, {
            length: 0,
            chunkType
        });

        this.crc = new CRC32();
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
