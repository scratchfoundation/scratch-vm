const {SB1TokenObjectTakeIterator, SB1TokenIterator, SB1ObjectIterator} = require('./deserialize/iterators');
const {SB1ReferenceFixer} = require('./deserialize/reference-fixer');
const {ImageMediaData, SoundMediaData} = require('./deserialize/types');

const {toSb2Json} = require('./convert-sb2/json-generator');
const {toSb2FakeZipApi} = require('./convert-sb2/fake-zip');

const {SB1Signature, SB1BlockHeader} = require('./sb1-file-structs');

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
        return new SB1TokenObjectTakeIterator(new SB1TokenIterator(this.buffer, this.infoPosition + SB1BlockHeader.prototype.size), this.infoLength);
    }

    infoTable () {
        return new SB1ObjectIterator(this.infoRaw(), this.infoLength);
    }

    info () {
        if (!this._info) {
            this._info = new SB1ReferenceFixer(this.infoTable()).table[0];
        }
        return this._info;
    }

    dataRaw () {
        return new SB1TokenObjectTakeIterator(new SB1TokenIterator(this.buffer, this.dataPosition + SB1BlockHeader.prototype.size), this.dataLength);
    }

    dataTable () {
        return new SB1ObjectIterator(this.dataRaw(), this.dataLength);
    }

    dataFixed () {
        if (!this._data) {
            this._data = new SB1ReferenceFixer(this.dataTable()).table;
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
