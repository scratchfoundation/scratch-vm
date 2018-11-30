class PNGSignature extends struct({
    support8Bit: Uint8,
    png: new FixedAsciiString(3),
    dosLineEnding: new FixedAsciiString(2),
    dosEndOfFile: new FixedAsciiString(1),
    unixLineEnding: new FixedAsciiString(1)
}) {}

const pngSignatureContent = {
    support8Bit: 0x89,
    png: 'PNG',
    dosLineEnding: '\r\n',
    dosEndOfFile: '\x1a',
    unixLineEnding: '\n'
};

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

class PNGFilterMethodByte extends struct({
    method: Uint8
}) {}
