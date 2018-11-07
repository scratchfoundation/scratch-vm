const TYPES = {
    NULL: 1,
    TRUE: 2,
    FALSE: 3,
    SMALL_INT: 4,
    SMALL_INT_16: 5,
    LARGE_INT_POSITIVE: 6,
    LARGE_INT_NEGATIVE: 7,
    FLOATING: 8,
    STRING: 9,
    SYMBOL: 10,
    BYTES: 11,
    SOUND: 12,
    BITMAP: 13,
    UTF8: 14,
    ARRAY: 20,
    ORDERED_COLLECTION: 21,
    SET: 22,
    IDENTITY_SET: 23,
    DICTIONARY: 24,
    IDENTITY_DICTIONARY: 25,
    COLOR: 30,
    TRANSLUCENT_COLOR: 31,
    POINT: 32,
    RECTANGLE: 33,
    FORM: 34,
    SQUEAK: 35,
    OBJECT_REF: 99,
    MORPH: 100,
    ALIGNMENT: 104,
    // STRING: 105,
    UPDATING_STRING: 106,
    SAMPLED_SOUND: 109,
    IMAGE_MORPH: 110,
    SPRITE: 124,
    STAGE: 125,
    WATCHER: 155,
    IMAGE_MEDIA: 162,
    SOUND_MEDIA: 164,
    MULTILINE_STRING: 171,
    WATCHER_READOUT_FRAME: 173,
    WATCHER_SLIDER: 174,
    LIST_WATCHER: 175,
};

class Field {
    constructor (classId) {
        this.classId = classId;
    }
}

class Value extends Field {
    constructor (classId, value) {
        super(classId);
        this.value = value;
    }

    valueOf () {
        return this.value;
    }
}

class Header extends Field {
    constructor (classId, size) {
        super(classId);
        this.size = size;
    }
}

class Reference extends Field {
    constructor (classId, index) {
        super(classId);
        this.index = index;
    }

    valueOf () {
        return `Ref(${this.index})`;
    }
}

class BuiltinObjectHeader extends Header {
    constructor (classId) {
        super(classId, 0);
    }
}

class ExtendedObjectHeader extends Header {
    constructor (classId, version, size) {
        super(classId, size);
        this.version = version;
    }
}

const int32BE = function (uint8, position) {
    return (
        uint8[position + 0] << 24 |
        uint8[position + 1] << 16 |
        uint8[position + 2] << 8 |
        uint8[position + 3]
    );
};

const int16BE = function (uint8, position) {
    return (
        uint8[position + 0] << 8 |
        uint8[position + 1]
    );
};

const largeInt = function (iter) {
    let num = 0;
    let multiplier = 0;
    const count = int16BE(iter.data, iter.position);
    iter.position += 2;
    for (let i = 0; i < count; i++) {
        num = num + (multiplier * iter.data.getUint8(iter.position++));
        multiplier *= 256;
    }
    return num;
};

const fromDouble = new Float64Array(1);
const toDouble = new Uint8Array(fromDouble.buffer);

const doubleBE = function (uint8, position) {
    toDouble[0] = uint8[position + 0];
    toDouble[1] = uint8[position + 1];
    toDouble[2] = uint8[position + 2];
    toDouble[3] = uint8[position + 3];
    toDouble[4] = uint8[position + 4];
    toDouble[5] = uint8[position + 5];
    toDouble[6] = uint8[position + 6];
    toDouble[7] = uint8[position + 7];
    return fromDouble[0];
};

const asciiString = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    let str = '';
    for (let i = 0; i < count; i++) {
        str += String.fromCharCode(iter.uint8[iter.position++]);
    }
    return str;
};

const uint8 = function (iter, count) {
    const value = new Uint8Array(iter.buffer, iter.position, count);
    iter.position += count;
    return value;
};

const bytes = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    return uint8(iter, count);
};

const sound = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    return uint8(iter, count * 2);
};

const bitmap = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    const value = new Int32Array(count);
    for (let i = 0; i < count; i++) {
        value[i] = int32BE(iter.uint8, iter.position);
        iter.position += 4;
    }
    return value;
};

const decoder = new TextDecoder();

const utf8 = function (iter) {
    const count = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    return decoder.decode(uint8(iter, count));
};

// const arrayHeader = function (iter) {
//     const count = int32BE(iter.uint8, iter.position);
//     iter.position += 4;
//     const value = new Array(count);
//     for (let i = 0; i < count; i++) {
//         value[i]
//     }
// };

const color = function (iter, classId) {
    const rgb = int32BE(iter.uint8, iter.position);
    iter.position += 4;
    let a = 0xff;
    if (classId === TYPES.TRANSLUCENT_COLOR) {
        a = iter.uint8[iter.position++];
    }
    const r = (rgb >> 22) & 0xff;
    const g = (rgb >> 12) & 0xff;
    const b = (rgb >> 2) & 0xff;
    return a << 24 | r << 16 | g << 8 | b;
};

const objectRef = function (iter) {
    index = (
        iter.uint8[iter.position + 0] << 16 |
        iter.uint8[iter.position + 1] << 8 |
        iter.uint8[iter.position + 2]
    );
    iter.position += 3;
    return {
        value: new Reference(TYPES.OBJECT_REF, index),
        done: false
    };
};

const builtin = function (iter, classId) {
    return {
        value: new BuiltinObjectHeader(classId),
        done: false
    };
}

const extended = function (iter, classId) {
    const classVersion = iter.uint8[iter.position++];
    const size = iter.uint8[iter.position++];
    return {
        value: new ExtendedObjectHeader(classId, classVersion, size),
        done: false
    };
};

class SB1Iterator {
    constructor (buffer, position) {
        this.buffer = buffer;
        this.uint8 = new Uint8Array(buffer);
        this.view = new DataView(buffer);
        this.position = position;
    }

    [Symbol.iterator] () {
        return this;
    }

    next () {
        if (this.position >= this.uint8.length) {
            return {
                value: null,
                done: true
            };
        }

        const classId = this.uint8[this.position++];
        let value;
        let headerSize;

        switch (classId) {
        case TYPES.NULL:
            value = null;
            break;

        case TYPES.TRUE:
            value = true;
            break;

        case TYPES.FALSE:
            value = false;
            break;

        case TYPES.SMALL_INT:
            value = int32BE(this.uint8, this.position);
            this.position += 4;
            break;

        case TYPES.SMALL_INT_16:
            value = int16BE(this.uint8, this.position);
            this.position += 2;
            break;

        case TYPES.LARGE_INT_POSITIVE:
        case TYPES.LARGE_INT_NEGATIVE:
            value = largeInt(this);
            break;

        case TYPES.FLOATING:
            value = doubleBE(this.uint8, this.position);
            this.position += 8;
            break;

        case TYPES.STRING:
        case TYPES.SYMBOL:
            value = asciiString(this);
            break;

        case TYPES.BYTES:
            value = bytes(this);
            break;

        case TYPES.SOUND:
            value = sound(this);
            break;

        case TYPES.UTF8:
            value = utf8(this);
            break;

        case TYPES.ARRAY:
        case TYPES.ORDERED_COLLECTION:
        case TYPES.SET:
        case TYPES.IDENTITY_SET:
            headerSize = int32BE(this.uint8, this.position);
            this.position += 4;
            break;

        case TYPES.DICTIONARY:
        case TYPES.IDENTITY_DICTIONARY:
            headerSize = int32BE(this.uint8, this.position) * 2;
            this.position += 4;
            break;

        case TYPES.COLOR:
        case TYPES.TRANSLUCENT_COLOR:
            value = color(this, classId);
            break;

        case TYPES.POINT:
            headerSize = 2;
            break;

        case TYPES.RECTANGLE:
            headerSize = 4;
            break;

        case TYPES.FORM:
        case TYPES.SQUEAK:
            headerSize = classId === TYPES.SQUEAK ? 6 : 5;
            break;

        case TYPES.OBJECT_REF:
            return objectRef(this);
            break;

        default:
            if (classId < TYPES.OBJECT_REF) {
                return builtin(this, classId);
            } else {
                return extended(this, classId);
            }
        }

        if (typeof value !== 'undefined') {
            return {
                value: new Value(classId, value),
                done: false
            };
        } else {
            return {
                value: new Header(classId, headerSize),
                done: false
            };
        }
    }
}

window.SB1Iterator = SB1Iterator;

const objectArray = function (objectIterator, header) {
    const array = [];

    for (let i = 0; i < header.size; i++) {
        array.push(objectIterator._next().value);
    }

    return array;
};

const objectDictionary = function (objectIterator, header) {
    const dict = [];

    for (let i = 0; i < header.size; i += 2) {
        dict.push(objectIterator._next().value);
        dict.push(objectIterator._next().value);
    }

    return dict;
};

const objectPoint = function (objectIterator, header) {
    return {
        classId: TYPES.POINT,
        x: objectIterator._next().value,
        y: objectIterator._next().value
    };
};

const objectRectangle = function (objectIterator, header) {
    return {
        classId: TYPES.RECTANGLE,
        x: objectIterator._next().value,
        y: objectIterator._next().value,
        width: objectIterator._next().value,
        height: objectIterator._next().value
    };
};

const objectImage = function (objectIterator, header) {
    return {
        classId: header.classId,
        width: objectIterator._next().value,
        height: objectIterator._next().value,
        encoding: objectIterator._next().value,
        something: objectIterator._next().value,
        bytes: objectIterator._next().value,
        colormap: header.classId === TYPES.SQUEAK ? objectIterator._next().value : null
    };
};

const objectBuiltin = function (objectIterator, header) {
    return {
        classId: header.classId,
        value: objectIterator.read(header, header.classId).value
    };
};

class ExtendedData {
    constructor ({classId, value, version, fields}) {
        this.classId = classId;
        this.value = value;
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
}

const POINT_FIELDS = {
    X: 0,
    Y: 1
};

class PointData extends ExtendedData {
    get x () {
        return this.fields[POINT_FIELDS.X];
    }

    get y () {
        return this.fields[POINT_FIELDS.Y];
    }
}

const RECTANGLE_FIELDS = {
    X: 0,
    Y: 1,
    WIDTH: 2,
    HEIGHT: 3
};

class RectangleData extends ExtendedData {
    get x () {
        return this.fields[RECTANGLE_FIELDS.X];
    }

    get y () {
        return this.fields[RECTANGLE_FIELDS.Y];
    }

    get width () {
        return this.fields[RECTANGLE_FIELDS.WIDTH];
    }

    get height () {
        return this.fields[RECTANGLE_FIELDS.HEIGHT];
    }
}

const IMAGE_FIELDS = {
    WIDTH: 0,
    HEIGHT: 1,
    ENCODING: 2,
    SOMETHING: 3,
    BYTES: 4,
    COLORMAP: 5
};

class ImageData extends ExtendedData {
    get width () {
        return this.fields[IMAGE_FIELDS.WIDTH];
    }

    get height () {
        return this.fields[IMAGE_FIELDS.HEIGHT];
    }

    get encoding () {
        return this.fields[IMAGE_FIELDS.ENCODING];
    }

    get something () {
        return this.fields[IMAGE_FIELDS.SOMETHING];
    }

    get bytes () {
        return this.fields[IMAGE_FIELDS.BYTES];
    }

    get colormap () {
        return this.fields[IMAGE_FIELDS.COLORMAP];
    }
}

const STAGE_FIELDS = {
    OBJ_NAME: 6,
    VARS: 7,
    BLOCKS_BIN: 8,
    IS_CLONE: 9,
    MEDIA: 10,
    CURRENT_COSTUME: 11,
    ZOOM: 12,
    H_PAN: 13,
    V_PAN: 14,
    OBSOLETE_SAVED_STATE: 15,
    SPRITE_ORDER_IN_LIBRARY: 16,
    VOLUME: 17,
    TEMPO_BPM: 18,
    SCENE_STATES: 19,
    LISTS: 20
};

class StageData extends ExtendedData {
    get objName () {
        return '' + this.fields[STAGE_FIELDS.OBJ_NAME];
    }

    get vars () {
        return this.fields[STAGE_FIELDS.VARS];
    }

    get blocksBin () {
        return this.fields[STAGE_FIELDS.BLOCKS_BIN];
    }

    get media () {
        return this.fields[STAGE_FIELDS.MEDIA];
    }

    get currentCostume () {
        return this.fields[STAGE_FIELDS.CURRENT_COSTUME];
    }

    get spriteOrderInLibrary () {
        return this.fields[STAGE_FIELDS.SPRITE_ORDER_IN_LIBRARY] || null;
    }

    get tempoBPM () {
        return this.fields[STAGE_FIELDS.TEMPO_BPM] || 0;
    }

    get lists () {
        return this.fields[STAGE_FIELDS.LISTS] || [];
    }
}

const SPRITE_FIELDS = {
    OBJ_NAME: 6,
    VARS: 7,
    BLOCKS_BIN: 8,
    IS_CLONE: 9,
    MEDIA: 10,
    CURRENT_COSTUME: 11,
    VISIBILITY: 12,
    SCALE_POINT: 13,
    ROTATION_DEGREES: 14,
    ROTATION_STYLE: 15,
    VOLUME: 16,
    TEMPO_BPM: 17,
    DRAGGABLE: 18,
    SCENE_STATES: 19,
    LISTS: 20
};

class SpriteData extends ExtendedData {
    get objName () {
        return '' + this.fields[SPRITE_FIELDS.OBJ_NAME];
    }

    get vars () {
        return this.fields[SPRITE_FIELDS.VARS];
    }

    get blocksBin () {
        return this.fields[SPRITE_FIELDS.BLOCKS_BIN];
    }

    get media () {
        return this.fields[SPRITE_FIELDS.MEDIA];
    }

    get currentCostume () {
        return this.fields[SPRITE_FIELDS.CURRENT_COSTUME];
    }

    get visibility () {
        return +this.fields[SPRITE_FIELDS.VISIBILITY];
    }

    get scalePoint () {
        return this.fields[SPRITE_FIELDS.SCALE_POINT];
    }

    get rotationDegrees () {
        return this.fields[SPRITE_FIELDS.ROTATION_DEGREES];
    }

    get rotationStyle () {
        return this.fields[SPRITE_FIELDS.ROTATION_STYLE];
    }

    get volume () {
        return this.fields[SPRITE_FIELDS.VOLUME];
    }

    get tempoBPM () {
        return this.fields[SPRITE_FIELDS.TEMPO_BPM] || 0;
    }

    get draggable () {
        return this.fields[SPRITE_FIELDS.DRAGGABLE];
    }

    get lists () {
        return this.fields[SPRITE_FIELDS.LISTS] || [];
    }
}

const TEXT_DETAILS_FIELDS = {
    RECTANGLE: 0,
    FONT: 8,
    COLOR: 9,
    LINES: 11
};

class TextDetailsData extends ExtendedData {
    get rectangle () {
        return this.fields[IMAGE_MEDIA_FIELDS.RECTANGLE];
    }

    get font () {
        return this.fields[IMAGE_MEDIA_FIELDS.FONT];
    }

    get color () {
        return this.fields[IMAGE_MEDIA_FIELDS.COLOR];
    }

    get lines () {
        return this.fields[IMAGE_MEDIA_FIELDS.LINES];
    }
}

const IMAGE_MEDIA_FIELDS = {
    COSTUME_NAME: 0,
    BITMAP: 1,
    ROTATION_CENTER: 2,
    TEXT_DETAILS: 3,
    BASE_LAYER_DATA: 4,
    OLD_COMPOSITE: 5
};

class ImageMediaData extends ExtendedData {
    get costumeName () {
        return this.string(IMAGE_MEDIA_FIELDS.COSTUME_NAME);
    }

    get bitmap () {
        return this.fields[IMAGE_MEDIA_FIELDS.BITMAP];
    }

    get rotationCenter () {
        return this.fields[IMAGE_MEDIA_FIELDS.ROTATION_CENTER];
    }

    get textDetails () {
        return this.fields[IMAGE_MEDIA_FIELDS.TEXT_DETAILS];
    }

    get baseLayerData () {
        return this.fields[IMAGE_MEDIA_FIELDS.BASE_LAYER_DATA];
    }

    get oldComposite () {
        return this.fields[IMAGE_MEDIA_FIELDS.OLD_COMPOSITE];
    }
}

const UNCOMPRESSED_FIELDS = {
    DATA: 3,
    RATE: 4,
};

class UncompressedData extends ExtendedData {
    get data () {
        return this.fields[UNCOMPRESSED_FIELDS.DATA];
    }

    get rate () {
        return this.fields[UNCOMPRESSED_FIELDS.RATE];
    }
}

const SOUND_MEDIA_FIELDS = {
    NAME: 0,
    UNCOMPRESSED: 1,
    RATE: 4,
    BITS_PER_SAMPLE: 5,
    DATA: 6
};

class SoundMediaData extends ExtendedData {
    get name () {
        return this.fields[SOUND_MEDIA_FIELDS.NAME];
    }

    get uncompressed () {
        return this.fields[SOUND_MEDIA_FIELDS.UNCOMPRESSED];
    }

    get rate () {
        return this.fields[SOUND_MEDIA_FIELDS.RATE];
    }

    get bitsPerSample () {
        return this.fields[SOUND_MEDIA_FIELDS.BITS_PER_SAMPLE];
    }

    get data () {
        return this.fields[SOUND_MEDIA_FIELDS.DATA];
    }
}

const EXTENDED_CONSTRUCTORS = {
    [TYPES.POINT]: PointData,
    [TYPES.RECTANGLE]: RectangleData,
    [TYPES.FORM]: ImageData,
    [TYPES.SQUEAK]: ImageData,
    [TYPES.SAMPLED_SOUND]: UncompressedData,
    [TYPES.SPRITE]: SpriteData,
    [TYPES.STAGE]: StageData,
    [TYPES.IMAGE_MEDIA]: ImageMediaData,
    [TYPES.SOUND_MEDIA]: SoundMediaData
};

const objectExtended = function (objectIterator, header) {
    const fields = [];

    for (let i = 0; i < header.size; i++) {
        fields.push(objectIterator._next().value);
    }

    const constructor = EXTENDED_CONSTRUCTORS[header.classId] || ExtendedData;

    return new constructor({
        classId: header.classId,
        value: null,
        version: header.version,
        fields,
    });
};

class SB1ObjectIterator {
    constructor (valueIterator, length) {
        this.valueIterator = valueIterator;
        this.length = length;
    }

    [Symbol.iterator] () {
        return this;
    }

    read (header, classId) {
        let value = header;

        switch (classId) {
        case TYPES.ARRAY:
        case TYPES.ORDERED_COLLECTION:
        case TYPES.SET:
        case TYPES.IDENTITY_SET:
            value = objectArray(this, header);
            break;

        case TYPES.DICTIONARY:
        case TYPES.IDENTITY_DICTIONARY:
            value = objectDictionary(this, header);
            break;

        case TYPES.POINT:
        case TYPES.RECTANGLE:
        case TYPES.FORM:
        case TYPES.SQUEAK:
            value = objectExtended(this, header);
            break;

        default:
            if (header instanceof ExtendedObjectHeader) {
                value = objectExtended(this, header);
            }
        }

        return {
            value,
            done: false
        };
    }

    _next () {
        const nextHeader = this.valueIterator.next();
        if (nextHeader.done) {
            return {
                value: null,
                done: true
            };
        }

        const header = nextHeader.value;

        return this.read(header, header.classId);
    }

    next () {
        if (this.length === 0) {
            return {
                value: null,
                done: true
            };
        }
        this.length--;

        return this._next();
    }
}

window.SB1ObjectIterator = SB1ObjectIterator;

class SB1ReferenceFixer {
    constructor (table) {
        this.table = Array.from(table);
        this.fixed = this.fix(this.table);
    }

    fix () {
        const fixed = [];

        for (let i = 0; i < this.table.length; i++) {
            this.fixItem(this.table[i]);
        }

        return this.table[0];
    }

    fixItem (item) {
        if (typeof item.fields !== 'undefined') {
            item.fields = item.fields.map(this.deref, this);
        } else if (typeof item.bytes !== 'undefined') {
            item.width = this.deref(item.width);
            item.height = this.deref(item.height);
            item.encoding = this.deref(item.encoding);
            item.something = this.deref(item.something);
            item.bytes = this.deref(item.bytes);
            item.colormap = this.deref(item.colormap);
        } else if (Array.isArray(item)) {
            for (let i = 0; i < item.length; i++) {
                item[i] = this.deref(item[i]);
            }
        }
    }

    deref (ref) {
        if (ref instanceof Reference) {
            return this.table[ref.index - 1];
        }
        return ref;
    }
}

window.SB1ReferenceFixer = SB1ReferenceFixer;

class SB1File {
    constructor (buffer) {
        this.buffer = buffer;
        this.uint8 = new Uint8Array(buffer);
        this.infoPosition = 14;
        this.infoLength = int32BE(this.uint8, this.infoPosition + 10);
        this.dataPosition = int32BE(this.uint8, 10) + 14;
        this.dataLength = int32BE(this.uint8, this.dataPosition + 10);
        console.log(this.infoLength, this.dataLength);
    }

    info () {
        return new SB1ReferenceFixer(new SB1ObjectIterator(new SB1Iterator(this.buffer, this.infoPosition + 14), this.infoLength)).fixed;
    }

    data () {
        console.log(Array.from(new SB1ObjectIterator(new SB1Iterator(this.buffer, this.dataPosition + 14), this.dataLength)));
        return new SB1ReferenceFixer(new SB1ObjectIterator(new SB1Iterator(this.buffer, this.dataPosition + 14), this.dataLength)).fixed;
    }
}

window.SB1File = SB1File;

const _expanded = {};

class SB1View {
    constructor (data, prefix = '', path = prefix) {
        this._elements = {};

        this.element = document.createElement('div');
        this.element.style.position = 'relative';
        this.element.style.top = '0';
        this.element.style.left = '0';
        // this.element.style.overflow = 'hidden';

        this.content = this.element;

        this.data = data;
        this.prefix = prefix;
        this.path = path;
        this.expanded = !!_expanded[this.path];

        this.toggle = this.toggle.bind(this);

        this.element.addEventListener('click', this.toggle);

        this.render();
    }

    toggle (event) {
        _expanded[this.path] = this.expanded = !this.expanded;
        this.render();

        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    createElement (type, name) {
        console.log('createElement', type, name, this._elements[name]);
        if (!this._elements[name]) {
            this._elements[name] = document.createElement(type);
        }
        this._elements[name].innerHTML = '';
        return this._elements[name];
    }

    renderClear () {
        while (this.element.children.length) {
            this.element.removeChild(this.element.children[0]);
        }
        this.content = this.element;
    }

    renderArrow () {
        const arrowDiv = this.createElement('div', 'arrow');
        arrowDiv.innerHTML = '&#x25b6;';
        arrowDiv.style.position = 'absolute';
        arrowDiv.style.left = '0';
        arrowDiv.style.width = '1em';
        arrowDiv.style.transform = this.expanded ? 'rotateZ(90deg)' : '';
        arrowDiv.style.transition = 'transform 3s';
        this.element.appendChild(arrowDiv);

        const contentDiv = this.createElement('div', 'arrowContent');
        contentDiv.style.position = 'relative';
        contentDiv.style.left = '1em';
        contentDiv.style.right = '0';
        this.element.appendChild(contentDiv);
        this.content = contentDiv;
    }

    renderTitle (title) {
        const titleDiv = this.createElement('div', 'title');
        const fullTitle = (this.prefix ? `${this.prefix}: ` : '') + title;
        console.log('renderTitle', title.length, fullTitle.indexOf('\n'), fullTitle.indexOf('\r'), fullTitle.indexOf('<br>'));
        if (['\n', '\r', '<br>'].some(str => fullTitle.indexOf(str) !== -1)) {
            this.renderArrow();
            if (this.expanded) {
                titleDiv.innerText = fullTitle;
            } else {
                titleDiv.innerText = fullTitle.substring(0, ['\n', '\r', '<br>'].reduce((value, str) => (fullTitle.indexOf(str) !== -1 ? Math.min(value, fullTitle.indexOf(str)) : value), Infinity)) + ' ...';
            }
        } else {
            titleDiv.innerText = fullTitle;
        }
        this.content.appendChild(titleDiv);
    }

    renderExpand (fn) {
        if (this.expanded) {
            const div = this.createElement('div', 'expanded');
            fn.call(this, div)
            .forEach(view => this.content.appendChild(view.element));
        }
    }

    render () {
        this.renderClear();
        if (this.data instanceof ExtendedData) {
            this.renderArrow();
            this.renderTitle(this.data.constructor.name);
            this.renderExpand(() => {
                return Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this.data)))
                .filter(([, desc]) => desc.get)
                .map(([name]) => new SB1View(this.data[name], name, `${this.path}.${name}`));
            });
        } else if (this.data instanceof Value) {
            if (this.data.value && this.data.value.buffer) {
                this.renderTitle('Typed Array');
            } else {
                this.renderTitle('' + this.data);
            }
        } else if (Array.isArray(this.data)) {
            if (this.data.length) this.renderArrow();
            this.renderTitle(`Array (${this.data.length})`);
            if (this.data.length) this.renderExpand(() => {
                return this.data.map((field, index) => new SB1View(field, index + 1, `${this.path}[${index}]`));
            });
        } else if (['string', 'number', 'boolean'].includes(typeof this.data)) {
            this.renderTitle('' + this.data);
        } else {
            this.renderTitle(`Unknown Structure(${this.data ? this.data.classId : ''})`);
        }

        // const clearDiv = this.createElement('div', 'clear');
        // clearDiv.style.clear = 'both';
        // this.content.appendChild(clearDiv);
    }
}

window.SB1View = SB1View;

class StructMember {
    constructor ({size, toBytes = new Uint8Array(1), read, write}) {
        this.size = size;

        this.toBytes = toBytes;
        this.bytes = new Uint8Array(toBytes.buffer);

        this.read = read;
        this.write = write;
    }

    defineProperty (obj, key, position) {
        const _this = this;

        Object.defineProperty(obj, key, {
            get () {
                return _this.read(this.uint8, position + this.offset);
            },

            set (value) {
                return _this.write(this.uint8, position + this.offset, value);
            },

            enumerable: true
        });
    }
}

const Uint8 = new StructMember({
    size: 1,
    read (uint8, position) {
        return uint8[position];
    },
    write (uint8, position, value) {
        uint8[position] = value;
        return value;
    }
});

const Uint16BE = new StructMember({
    size: 4,
    toBytes: new Uint16Array(1),
    read (uint8, position) {
        this.bytes[1] = uint8[position + 0];
        this.bytes[0] = uint8[position + 1];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[1];
        uint8[position + 1] = this.bytes[0];
        return value;
    }
});

const Int32BE = new StructMember({
    size: 4,
    toBytes: new Int32Array(1),
    read (uint8, position) {
        this.bytes[3] = uint8[position + 0];
        this.bytes[2] = uint8[position + 1];
        this.bytes[1] = uint8[position + 2];
        this.bytes[0] = uint8[position + 3];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[3];
        uint8[position + 1] = this.bytes[2];
        uint8[position + 2] = this.bytes[1];
        uint8[position + 3] = this.bytes[0];
        return value;
    }
});

const Uint32BE = new StructMember({
    size: 4,
    toBytes: new Uint32Array(1),
    read (uint8, position) {
        this.bytes[3] = uint8[position + 0];
        this.bytes[2] = uint8[position + 1];
        this.bytes[1] = uint8[position + 2];
        this.bytes[0] = uint8[position + 3];
        return this.toBytes[0];
    },
    write (uint8, position, value) {
        this.toBytes[0] = value;
        uint8[position + 0] = this.bytes[3];
        uint8[position + 1] = this.bytes[2];
        uint8[position + 2] = this.bytes[1];
        uint8[position + 3] = this.bytes[0];
        return value;
    }
});

class FixedAsciiString extends StructMember {
    constructor (size) {
        super({
            size,
            read (uint8, position) {
                let str = '';
                for (let i = 0; i < size; i++) {
                    str += String.fromCharCode(uint8[position + i]);
                }
                return str;
            },
            write (uint8, position, value) {
                for (let i = 0; i < size; i++) {
                    uint8[position + i] = value.charCodeAt(i);
                }
                return value;
            }
        });
    }
}

class Struct {
    constructor (shape) {
        let position = 0;
        Object.keys(shape).forEach(key => {
            shape[key].defineProperty(this, key, position);
            position += prop.size;
        });
    }
}

const struct = shape => {
    const Base = class {
        constructor (uint8, offset = 0) {
            this.uint8 = uint8;
            this.offset = offset;
        }
    };

    let position = 0;
    Object.keys(shape).forEach(key => {
        shape[key].defineProperty(Base.prototype, key, position);
        position += prop.size;
    });

    Base.prototype.size = position;

    return Base;
};

class PNGSignature extends struct({
    support8Bit: Uint8,
    png: new FixedAsciiString(3),
    dosLineEnding: new FixedAsciiString(2),
    dosEndOfFile: new FixedAsciiString(1),
    unixLineEnding: new FixedAsciiString(1)
}) {}

class PNGChunkStart extends struct({
    length: Uint32BE,
    chunkType: new FixedAsciiString(4)
}) {}

class PNGChunkEnd extends struct({
    checksum: Uint32BE
}) {}

class PNGIHDRChunkBody extends struct({
    width: Uint32BE,
    height: Uint32BE,
    bitDepth: Uint8,
    colorType: Uint8,
    compressionMethod: Uint8,
    filterMethod: Uint8,
    interlaceMethod: Uint8,
}) {}

const DEFLATE_BLOCK_SIZE_MAX = 0xffff;

class PNGFilterMethodByte extends struct({
    method: Uint8
}) {}

class DeflateHeader extends struct({
    cmf: Uint8,
    flag: Uint8
}) {}

class DeflateChunkStart extends struct({
    lastBlock: Uint8,
    length: Uint16BE,
    lengthCheck: Uint16BE
}) {}

class DeflateEnd extends struct({
    checksum: Uint32BE
}) {}

class CRC32 {
    constructor () {
        this.bit = new Uint32Array(1);
        this.crc = new Uint32Array(1);
        this.c = 0;

        this.table = [];
        let c;
        for (let i = 0; i < 256; i++) {
            c = i;
            for (let j = 0; j < 8; j++) {
                c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            }
            this.table[i] = c >>> 0;
        }
    }

    update (uint8, position, length) {
        this.crc[0] = ~this.crc[0];
        for (let i = 0; i < length; i++) {
            this.crc[0] = (this.crc[0] >>> 8) ^ this.table[(this.crc[0] ^ uint8[position + i]) & 0xff];
        }
        this.crc[0] = ~this.crc[0];
        return this;
    }

    get digest () {
        return this.crc[0];
    }
}

class Adler32 {
    constructor () {
        this.adler = 1;
    }

    update (uint8, position, length) {
        let a = this.adler & 0xffff;
        let b = this.adler >>> 16;
        for (let i = 0; i < length; i++) {
            a = (a + uint8[position + i]) % 65521;
            b = (b + a) % 65521;
        }
        this.adler = (b << 16) | a;
        return this;
    }

    get digest () {
        return this.adler;
    }
}

class PNGFile {
    encode (width, height, pixels) {
        const pixelsUint8 = new Uint8Array(pixels);

        const rowSize = width * 4 + 1;
        const bodySize = rowSize * height;
        let bodyRemaining = bodySize;
        const blocks = Math.ceil(bodySize / DEFLATE_BLOCK_SIZE_MAX);
        const idatSize = (
            DeflateHeader.prototype.prototype.size +
            blocks * DeflateChunkStart.prototype.size +
            DeflateEnd.prototype.size +
            bodySize
        );
        const size = (
            PNGSignature.prototype.size +
            PNGChunkStart.prototype.size +
            PNGIHDRChunkBody.prototype.size +
            PNGChunkEnd.prototype.size +
            PNGChunkStart.prototype.size +
            idatSize +
            PNGChunkEnd.prototype.size
        );
        const buffer = new ArrayBuffer(size);
        const uint8 = new Uint8Array(buffer);

        let position = 0;

        Object.assign(new PNGSignature(uint8, position), {
            support8Bit: 0x89,
            png: 'PNG',
            dosLineEnding: '\r\n',
            dosEndOfFile: '\x1a',
            unixLineEnding: '\n'
        });
        position += PNGSignature.prototype.size;

        Object.assign(new PNGChunkStart(uint8, position), {
            length: PNGIHDRChunkBody.prototype.size,
            chunkType: 'IHDR'
        });
        position += PNGChunkStart.prototype.size;

        Object.assign(new PNGIHDRChunkBody(uint8, position), {
            width,
            height,
            bitDepth: 8,
            colorType: 6,
            compressionMethod: 0,
            filterMethod: 0,
            interlaceMethod: 0
        });
        position += PNGIHDRChunkBody.prototype.size;

        Object.assign(new PNGChunkEnd(uint8, position), {
            checksum: new CRC32()
                .update(uint8, position, PNGIHDRChunkBody.prototype.size)
                .digest
        });
        position += PNGChunkEnd.prototype.size;

        Object.assign(new PNGChunkStart(uint8, position), {
            length: idatSize,
            chunkType: 'IDAT'
        });
        position += PNGChunkStart.prototype.size;

        Object.assign(new DeflateHeader(uint8, position), {
            cmf: 0b00001000,
            flag: 0b00011101
        });
        position += DeflateHeader.prototype.size;

        const deflateCrc = new CRC32();
        const pngAdler = new Adler32();

        let deflateIndex = 0;

        let rowIndex = 0;
        let y = 0;
        let pixelsIndex = 0;
        while (pixelsIndex < pixels.length) {
            if (deflateIndex === 0) {
                const deflateChunkSize = Math.min(bodyRemaining, DEFLATE_BLOCK_SIZE_MAX);
                Object.assign(new DeflateChunkStart(uint8, position), {
                    lastBlock: deflateChunkSize === bodyRemaining ? 1 : 0,
                    length: deflateChunkSize,
                    lengthCheck: deflateChunkSize ^ 0xffff
                });

                deflateCrc.update(uint8, position, DeflateChunkStart.prototype.size);
                position += DeflateChunkStart.prototype.size;
            }

            if (rowIndex === 0) {
                Object.assign(new PNGFilterMethodByte(uint8, position), {
                    method: 0
                });

                deflateCrc.update(uint8, position, PNGFilterMethodByte.prototype.size);
                pngAdler.update(uint8, position, PNGFilterMethodByte.prototype.size);

                position += PNGFilterMethodByte.prototype.size;
                rowIndex += PNGFilterMethodByte.prototype.size;
                bodyRemaining -= PNGFilterMethodByte.prototype.size;
                deflateIndex += PNGFilterMethodByte.prototype.size;
            } else {
                const rowPartialSize = Math.min(
                    pixelsIndex,
                    rowSize - rowIndex,
                    DEFLATE_BLOCK_SIZE_MAX - deflateIndex
                );

                for (let i = 0; i < rowPartialSize; i++) {
                    uint8[position + i] = pixelsUint8[pixelsIndex + i];
                }

                deflateCrc.update(uint8, position, rowPartialSize);
                pngAdler.update(uint8, position, rowPartialSize);

                position += rowPartialSize;
                rowIndex += rowPartialSize;
                bodyRemaining -= rowPartialSize;
                deflateIndex += rowPartialSize;
            }

            if (deflateIndex >= DEFLATE_BLOCK_SIZE_MAX) {
                deflateIndex = 0;
            }

            if (rowIndex === rowSize) {
                rowIndex = 0;
                y += 1;
            }
        }

        Object.assign(new DeflateEnd(uint8, position), {
            checksum: deflateCrc.digest
        });
        position += DeflateEnd.prototype.size;

        Object.assign(new PNGChunkEnd(uint8, position), {
            checksum: pngAdler.digest
        });
        position += PNGChunkEnd.prototype.size;

        Object.assign(new PNGChunkStart(uint8, position), {
            length: 0,
            chunkType: 'IEND'
        });
        position += PNGChunkStart.prototype.size;

        Object.assign(new PNGChunkEnd(uint8, position), {
            checksum: 0xae426082
        });

        return buffer;
    }

    static encode (width, height, pixels) {
        return new PNGFile().encode(width, height, pixels);
    }
}

class SqueakImageDecoder {
    decode (width, height, pixels, colormap) {

    }

    decodePixels (pixels, withAlpha) {

    }

    unpackPixels (pixels, width, height, depth, colormap) {

    }

    raster16To32 (pixels, width, height) {

    }
}

module.exports = SB1Iterator;
