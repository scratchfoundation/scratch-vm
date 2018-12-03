const {TYPES} = require('./ids');

class Field {
    constructor (classId, position) {
        this.classId = classId;
        this.position = position;
    }
}

exports.Field = Field;

const value = obj => (typeof obj === 'object' && obj) ? obj.valueOf() : obj;

exports.value = value;

class Value extends Field {
    constructor (classId, position, value) {
        super(classId, position);
        this.value = value;
    }

    valueOf () {
        return this.value;
    }

    toJSON () {
        if (
            this.classId === TYPES.TRANSLUCENT_COLOR ||
            this.classId === TYPES.COLOR
        ) {
            // TODO: Can colors be 32 bit in scratch-blocks?
            return this.value & 0xffffff;
        }
        return this.value;
    }

    toString () {
        return this.value;
    }
}

exports.Value = Value;

class Header extends Field {
    constructor (classId, position, size) {
        super(classId, position);
        this.size = size;
    }
}

exports.Header = Header;

class Reference extends Field {
    constructor (classId, position, index) {
        super(classId, position);
        this.index = index;
    }

    valueOf () {
        return `Ref(${this.index})`;
    }
}

exports.Reference = Reference;

class BuiltinObjectHeader extends Header {
    constructor (classId, position) {
        super(classId, position, 0);
    }
}

exports.BuiltinObjectHeader = BuiltinObjectHeader;

class FieldObjectHeader extends Header {
    constructor (classId, position, version, size) {
        super(classId, position, size);
        this.version = version;
    }
}

exports.FieldObjectHeader = FieldObjectHeader;
