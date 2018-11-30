const valueOf = obj => (typeof obj === 'object' && obj) ? obj.valueOf() : obj;

class Struct {
    constructor (uint8 = new Uint8Array(this.size), offset = 0) {
        this.uint8 = uint8;
        this.offset = offset;
    }

    equals (other) {
        for (const key in other) {
            if (valueOf(this[key]) !== other[key]) {
                return false;
            }
        }
        return true;
    }

    view () {
        const constructor = this.constructor;
        const obj = {
            toString() {
                return constructor.name;
            }
        };
        for (const key in this.shape) {
            obj[key] = this[key];
        }
        return obj;
    }

    static extend (shape) {
        const Base = class extends Struct {
            get shape () {
                return shape;
            }
        };

        let position = 0;
        Object.keys(shape).forEach(key => {
            shape[key].defineProperty(Base.prototype, key, position);
            if (shape[key].size === 0) {
                throw new Error('Struct cannot be defined with variable sized members.');
            }
            position += shape[key].size;
        });

        Base.prototype.size = position;
        Base.size = position;

        return Base;
    }
}

exports.Struct = Struct;

exports.Block = Struct;

const struct = shape => Struct.extend(shape);

exports.struct = struct;
