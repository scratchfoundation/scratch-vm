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
        const obj = Object.entries(allPropertyDescriptors(Object.getPrototypeOf(data)))
            .filter(([, desc]) => desc.get)
            .reduce((carry, [key]) => {
                carry[key] = data[key];
                return carry;
            }, {});
        obj.toString = () => data.toString();
        new ObjectRenderer(obj, view).render(obj, view);
    }
}

exports.ExtendedDataRenderer = ExtendedDataRenderer;
