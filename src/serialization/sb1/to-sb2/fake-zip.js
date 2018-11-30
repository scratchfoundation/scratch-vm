class FakeZipFile {
    constructor (file) {
        this.file = file;
    }

    async (outputType) {
        assert(outputType === 'uint8array', 'SB1FakeZipFile only supports uint8array');

        return Promise.resolve(this.file.bytes);
    }
}

exports.FakeZipFile = FakeZipFile;

class FakeZip {
    constructor (files) {
        this.files = files;
    }

    file (file) {
        if (file in this.files) {
            return new FakeZipFile(this.files[file]);
        }
    }
}

exports.FakeZip = FakeZip;

const toSb2FakeZipApi = ({images, sounds}) => {
    const files = {};

    let index = 0;
    for (const image of images) {
        files[`${index++}.${image.extension}`] = {
            bytes: image.bytes
        };
    }

    index = 0;
    for (const sound of sounds) {
        files[`${index++}.wav`] = {
            bytes: sound.bytes
        };
    }

    return new FakeZip(files);
};

exports.toSb2FakeZipApi = toSb2FakeZipApi;
