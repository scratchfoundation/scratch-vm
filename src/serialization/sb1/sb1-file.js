const {ByteStream} = require('./coders/byte-stream');

const {ByteTakeIterator} = require('./squeak/byte-take-iterator');
const {FieldIterator} = require('./squeak/field-iterator');
const {TypeIterator} = require('./squeak/type-iterator');
const {ReferenceFixer} = require('./squeak/reference-fixer');
const {ImageMediaData, SoundMediaData} = require('./squeak/types');

const {toSb2FakeZipApi} = require('./to-sb2/fake-zip');
const {toSb2Json} = require('./to-sb2/json-generator');

const {SB1BlockHeader, SB1Signature} = require('./sb1-file-blocks');

class SB1File {
    constructor (buffer) {
        this.buffer = buffer;
        this.stream = new ByteStream(buffer);

        this.signature = this.stream.readStruct(SB1Signature);
        this.signature.validate();

        this.infoBlockHeader = this.stream.readStruct(SB1BlockHeader);
        this.infoBlockHeader.validate();

        this.stream.position += this.signature.infoByteLength - SB1BlockHeader.size;

        this.dataBlockHeader = this.stream.readStruct(SB1BlockHeader);
        this.dataBlockHeader.validate();
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
        return new ByteTakeIterator(new FieldIterator(this.buffer, this.infoBlockHeader.offset + SB1BlockHeader.size), this.signature.infoByteLength + SB1Signature.size);
    }

    infoTable () {
        return new TypeIterator(this.infoRaw());
    }

    info () {
        if (!this._info) {
            this._info = new ReferenceFixer(this.infoTable()).table[0];
        }
        return this._info;
    }

    dataRaw () {
        return new ByteTakeIterator(new FieldIterator(this.buffer, this.dataBlockHeader.offset + SB1BlockHeader.size), this.stream.uint8.length);
    }

    dataTable () {
        return new TypeIterator(this.dataRaw());
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
