const {Block} = require('./byte-blocks');
const {Uint8, Uint16LE, Uint32LE} = require('./byte-primitives');

const DEFLATE_BLOCK_SIZE_MAX = 0xffff;

exports.DEFLATE_BLOCK_SIZE_MAX = DEFLATE_BLOCK_SIZE_MAX;

class DeflateHeader extends Block.extend({
    cmf: Uint8,
    flag: Uint8
}) {}

Block.initConstructor(DeflateHeader);

exports.DeflateHeader = DeflateHeader;

class DeflateChunkStart extends Block.extend({
    lastBlock: Uint8,
    length: Uint16LE,
    lengthCheck: Uint16LE
}) {}

Block.initConstructor(DeflateChunkStart);

exports.DeflateChunkStart = DeflateChunkStart;

class DeflateEnd extends Block.extend({
    checksum: Uint32LE
}) {}

Block.initConstructor(DeflateEnd);

exports.DeflateEnd = DeflateEnd;
