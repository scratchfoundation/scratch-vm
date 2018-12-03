const toTitleCase = str => str.replace(/_?\w/g, letter => {
    if (letter.startsWith('_')) return letter[1];
    return letter.toLowerCase();
});

class ExtendedData {
    constructor ({classId, version, fields}) {
        this.classId = classId;
        this.version = version;
        this.fields = fields;
    }

    string (field) {
        return '' + this.fields[field];
    }

    number (field) {
        return +this.fields[field];
    }

    boolean (field) {
        return !!this.fields[field];
    }

    toString () {
        if (this.constructor === ExtendedData || this.constructor === UnknownData) {
            return `${this.constructor.name} ${this.classId} ${TYPE_NAMES[this.classId]}`;
        }
        return this.constructor.name;
    }

    static define (FIELDS, Super = ExtendedData) {
        class Base extends Super {
            get FIELDS () {
                return FIELDS;
            }

            static get FIELDS () {
                return FIELDS;
            }
        }

        Object.keys(FIELDS).forEach(key => {
            const index = FIELDS[key];
            Object.defineProperty(Base.prototype, toTitleCase(key), {
                get () {
                    return this.fields[index];
                }
            });
        });

        return Base;
    }
}

exports.FieldObject = ExtendedData;

class UnknownData extends ExtendedData.define({
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 15,
    P: 16,
    Q: 17,
    R: 18,
    S: 19
}) {}

exports.UnknownData = UnknownData;
