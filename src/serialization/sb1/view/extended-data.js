const {FieldObject} = require('../squeak/field-object');

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

class ExtendedDataRenderer {
    static check (data, view) {
        return data instanceof FieldObject;
    }

    render (data, view) {
        new ObjectRenderer().render(Object.assign(() => (
            Object.entries(allPropertyDescriptors(Object.getPrototypeOf(data)))
            .filter(([, desc]) => desc.get)
            .reduce((carry, [key]) => {
                Object.defineProperty(carry, key, {
                    enumerable: true,
                    get () { return data[key]; }
                });
                return carry;
            }, {})
        ), { toString () { return data.toString(); } }), view);
    }
}

exports.ExtendedDataRenderer = ExtendedDataRenderer;
