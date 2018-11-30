const {assert} = require('./assert');

const {FixedAsciiString, Uint32BE, struct, Uint8} = require('./binary');

class SB1Signature extends struct({
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

exports.SB1Signature = SB1Signature;

class SB1BlockHeader extends struct({
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

exports.SB1BlockHeader = SB1BlockHeader;
