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
    // Called String in Scratch 2. To reduce confusion this is called
    // STATIC_STRING to differentiate it from STRING in this codebase.
    STATIC_STRING: 105,
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

const TYPE_NAMES = Object.entries(TYPES)
.reduce((carry, [key, value]) => {
    carry[value] = key;
    return carry;
}, {});
