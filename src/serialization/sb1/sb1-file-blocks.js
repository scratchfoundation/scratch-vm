const {assert} = require('./assert');

const {Block} = require('./coders/byte-blocks');
const {FixedAsciiString, Uint8, Uint32BE} = require('./coders/byte-primitives');

class SB1Signature extends Block.extend({
    version: new FixedAsciiString(10),
    infoByteLength: Uint32BE
}) {
    validate () {
        assert(
            this.equals({version: 'ScratchV01'}) ||
            this.equals({version: 'ScratchV02'}),
            'Invalid Scratch file signature.'
        );
    }
}

Block.initConstructor(SB1Signature);

exports.SB1Signature = SB1Signature;

class SB1BlockHeader extends Block.extend({
    ObjS: new FixedAsciiString(4),
    ObjSValue: Uint8,
    Stch: new FixedAsciiString(4),
    StchValue: Uint8,
    numObjects: Uint32BE
}) {
    validate () {
        assert(
            this.equals({
                ObjS: 'ObjS', ObjSValue: 1,
                Stch: 'Stch', StchValue: 1
            }),
            'Invalid Scratch file info block header.'
        );
    }
}

Block.initConstructor(SB1BlockHeader);

exports.SB1BlockHeader = SB1BlockHeader;
