const DEFLATE_BLOCK_SIZE_MAX = 0xffff;

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
