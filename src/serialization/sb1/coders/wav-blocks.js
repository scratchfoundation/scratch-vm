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
