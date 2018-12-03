const {Block} = require('./byte-blocks');
const {Uint16LE, Uint32LE, FixedAsciiString} = require('./byte-primitives');

class WAVESignature extends Block.extend({
    riff: new FixedAsciiString(4),
    length: Uint32LE,
    wave: new FixedAsciiString(4)
}) {}

Block.initConstructor(WAVESignature);

exports.WAVESignature = WAVESignature;

class WAVEChunkStart extends Block.extend({
    chunkType: new FixedAsciiString(4),
    length: Uint32LE,
}) {}

Block.initConstructor(WAVEChunkStart);

exports.WAVEChunkStart = WAVEChunkStart;

class WAVEFMTChunkBody extends Block.extend({
    format: Uint16LE,
    channels: Uint16LE,
    sampleRate: Uint32LE,
    bytesPerSec: Uint32LE,
    blockAlignment: Uint16LE,
    bitsPerSample: Uint16LE
}) {}

Block.initConstructor(WAVEFMTChunkBody);

exports.WAVEFMTChunkBody = WAVEFMTChunkBody;
