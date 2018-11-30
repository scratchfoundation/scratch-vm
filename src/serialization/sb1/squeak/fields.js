class Field {
    constructor (classId, position) {
        this.classId = classId;
        this.position = position;
    }
}

const value = obj => (typeof obj === 'object' && obj) ? obj.valueOf() : obj;

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

class Header extends Field {
    constructor (classId, position, size) {
        super(classId, position);
        this.size = size;
    }
}

class Reference extends Field {
    constructor (classId, position, index) {
        super(classId, position);
        this.index = index;
    }

    valueOf () {
        return `Ref(${this.index})`;
    }
}

class BuiltinObjectHeader extends Header {
    constructor (classId, position) {
        super(classId, position, 0);
    }
}

class ExtendedObjectHeader extends Header {
    constructor (classId, position, version, size) {
        super(classId, position, size);
        this.version = version;
    }
}
