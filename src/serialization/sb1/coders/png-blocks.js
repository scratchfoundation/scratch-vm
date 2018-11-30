const {assert} = require('../assert');

const {Block} = require('./byte-blocks');
const {Uint8, Uint32BE, FixedAsciiString} = require('./byte-primitives');

class PNGSignature extends Block.extend({
    support8Bit: Uint8,
    png: new FixedAsciiString(3),
    dosLineEnding: new FixedAsciiString(2),
    dosEndOfFile: new FixedAsciiString(1),
    unixLineEnding: new FixedAsciiString(1)
}) {
    static validate () {
        assert(this.equals({
            support8Bit: 0x89,
            png: 'PNG',
            dosLineEnding: '\r\n',
            dosEndOfFile: '\x1a',
            unixLineEnding: '\n'
        }),  'PNGSignature does not match the expected values');
    }
}

exports.PNGSignature = PNGSignature;

class PNGChunkStart extends Block.extend({
    length: Uint32BE,
    chunkType: new FixedAsciiString(4)
}) {}

exports.PNGChunkStart = PNGChunkStart;

class PNGChunkEnd extends Block.extend({
    checksum: Uint32BE
}) {}

exports.PNGChunkEnd = PNGChunkEnd;

class PNGIHDRChunkBody extends Block.extend({
    width: Uint32BE,
    height: Uint32BE,
    bitDepth: Uint8,
    colorType: Uint8,
    compressionMethod: Uint8,
    filterMethod: Uint8,
    interlaceMethod: Uint8,
}) {}

exports.PNGIHDRChunkBody = PNGIHDRChunkBody;

class PNGFilterMethodByte extends Block.extend({
    method: Uint8
}) {}

exports.PNGFilterMethodByte = PNGFilterMethodByte;
