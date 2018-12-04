const {PNGFile} = require('../coders/png-file');
const {WAVFile} = require('../coders/wav-file');

const {FieldObject, UnknownData} = require('../squeak/field-object');

const {ObjectRenderer} = require('./object');

const allPropertyDescriptors = prototype => (
    prototype === null ?
        {} :
        Object.entries(Object.getOwnPropertyDescriptors(prototype))
            .reduce(
                (carry, [key, value]) => {
                    carry[key] = value;
                    return carry;
                },
                allPropertyDescriptors(Object.getPrototypeOf(prototype))
            )
);

class FieldObjectRenderer {
    static check (data, view) {
        return data instanceof FieldObject;
    }

    addOptionalPreview (obj) {
        if (obj.decoded) {
            let mime;
            let tag;
            let encoded;
            if (obj.extension === 'uncompressed') {
                mime = 'image/png';
                tag = new Image();
                encoded = new Uint8Array(PNGFile.encode(
                    obj.width,
                    obj.height,
                    obj.decoded
                ));
            } else if (obj.extension === 'jpg') {
                mime = 'image/jpg';
                tag = new Image();
                encoded = obj.decoded;
            } else if (obj.extension === 'pcm') {
                mime = 'audio/wav';
                tag = new Audio();
                tag.controls = true;
                encoded = new Uint8Array(WAVFile.encode(obj.decoded, {
                    sampleRate: obj.rate && obj.rate.value
                }));
            }

            tag.src = URL.createObjectURL(new Blob([encoded.buffer], { type: mime }));

            obj.preview = tag;
        }
        return obj;
    }

    render (data, view) {
        new ObjectRenderer().render(
            Object.assign(() => this.addOptionalPreview(
                Object.entries(
                    allPropertyDescriptors(Object.getPrototypeOf(data))
                )
                .filter(([, desc]) => desc.get)
                .reduce((carry, [key]) => {
                    Object.defineProperty(carry, key, {
                        enumerable: true,
                        get () { return data[key]; }
                    });
                    return carry;
                }, {})
            ), { toString () { return data.toString(); } }),
            view
        );
    }
}

exports.FieldObjectRenderer = FieldObjectRenderer;
