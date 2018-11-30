const {FieldIterator} = require('./squeak/field-iterator');
const {TypeFieldTakeIterator} = require('./squeak/type-field-take-iterator');
const {TypeIterator} = require('./squeak/type-iterator');
const {ReferenceFixer} = require('./squeak/reference-fixer');
const {ImageMediaData, SoundMediaData} = require('./squeak/types');

const {toSb2FakeZipApi} = require('./to-sb2/fake-zip');
const {toSb2Json} = require('./to-sb2/json-generator');

const {SB1BlockHeader, SB1Signature} = require('./sb1-file-blocks');

class SB1File {
    constructor (buffer) {
        this.buffer = buffer;
        this.uint8 = new Uint8Array(buffer);

        this.signature = new SB1Signature(this.uint8, 0);
        this.signature.validate();

        this.infoBlockHeader = new SB1BlockHeader(this.uint8, SB1Signature.prototype.size);
        this.infoBlockHeader.validate();
        this.infoPosition = this.infoBlockHeader.offset;
        this.infoLength = this.infoBlockHeader.numObjects;

        this.dataBlockHeader = new SB1BlockHeader(this.uint8, this.signature.infoByteLength + SB1Signature.prototype.size);
        this.dataBlockHeader.validate();
        this.dataPosition = this.dataBlockHeader.offset;
        this.dataLength = this.dataBlockHeader.numObjects;
    }

    get json () {
        return toSb2Json({
            info: this.info(),
            stageData: this.data(),
            images: this.images(),
            sounds: this.sounds()
        });
    }

    get zip () {
        return toSb2FakeZipApi({
            images: this.images(),
            sounds: this.sounds()
        });
    }

    view () {
        // console.log(this.json);
        return {
            signature: this.signature,
            infoBlockHeader: this.infoBlockHeader,
            dataBlockHeader: this.dataBlockHeader,
            toString() {
                return 'SB1File';
            }
        };
    }

    infoRaw () {
        return new TypeFieldTakeIterator(new FieldIterator(this.buffer, this.infoPosition + SB1BlockHeader.prototype.size), this.infoLength);
    }

    infoTable () {
        return new TypeIterator(this.infoRaw(), this.infoLength);
    }

    info () {
        if (!this._info) {
            this._info = new ReferenceFixer(this.infoTable()).table[0];
        }
        return this._info;
    }

    dataRaw () {
        return new TypeFieldTakeIterator(new FieldIterator(this.buffer, this.dataPosition + SB1BlockHeader.prototype.size), this.dataLength);
    }

    dataTable () {
        return new TypeIterator(this.dataRaw(), this.dataLength);
    }

    dataFixed () {
        if (!this._data) {
            this._data = new ReferenceFixer(this.dataTable()).table;
        }
        return this._data;
    }

    data () {
        return this.dataFixed()[0];
    }

    images () {
        const unique = new Set();
        return this.dataFixed().filter(obj => {
            if (obj instanceof ImageMediaData) {
                const array = obj.baseLayerData.value || obj.bitmap.bytes.value;
                if (unique.has(array)) return false;
                if (unique.has(obj.crc)) return false;
                unique.add(array);
                unique.add(obj.crc);
                return true;
            }
            return false;
        });
    }

    sounds () {
        const unique = new Set();
        return this.dataFixed().filter(obj => {
            if (obj instanceof SoundMediaData) {
                const array = obj.data && obj.data.value || obj.uncompressed.data.value;
                if (unique.has(array)) {
                    return false;
                }
                unique.add(array);
                return true;
            }
            return false;
        });
    }
}

exports.SB1File = SB1File;
