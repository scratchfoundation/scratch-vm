const {assert} = require('../assert');

const SQUEAK_SOUND_STEP_SIZE_TABLE = [
    7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41,
    45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209,
    230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876,
    963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749,
    3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630,
    9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623,
    27086, 29794, 32767
];

const SQUEAK_SOUND_INDEX_TABLES = {
    2: [-1, 2, -1, 2],
    3: [-1, -1, 2, 4, -1, -1, 2, 4],
    4: [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8],
    5: [
        -1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16,
        -1, -1, -1, -1, -1, -1, -1, -1, 1, 2, 4, 6, 8, 10, 13, 16
    ]
};

class SqueakSound {
    constructor (bitsPerSample) {
        this.bitsPerSample = bitsPerSample;

        this.indexTable = SQUEAK_SOUND_INDEX_TABLES[bitsPerSample];

        this.signMask = 1 << (bitsPerSample - 1);
        this.valueMask = this.signMask - 1;
        this.valueHighBit = this.signMask >> 1;

        this.bitPosition = 0;
        this.currentByte = 0;
        this.position = 0;
    }

    decode (data) {
        // Reset position information.
        this.bitPosition = 0;
        this.currentByte = 0;
        this.position = 0;

        const size = Math.floor(data.length * 8 / this.bitsPerSample);
        const result = new Int16Array(size);

        let sample = 0;
        let index = 0;
        let position = 0;

        for (let i = 0; i < size; i++) {
            const code = this.nextCode(data);

            if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
                assert(code >= 0, 'Ran out of bits in Squeak Sound');
            }

            let step = SQUEAK_SOUND_STEP_SIZE_TABLE[index];
            let delta = 0;
            for (let bit = this.valueHighBit; bit > 0; bit = bit >> 1) {
                if ((code & bit) != 0) {
                    delta += step;
                }
                step = step >> 1;
            }
            delta += step;

            sample += ((code & this.signMask) !== 0) ? -delta : delta;

            index += this.indexTable[code];
            if (index < 0) index = 0;
            if (index > 88) index = 88;

            if (sample > 32767) sample = 32767;
            if (sample < -32768) sample = -32768;

            result[i] = sample;
        }

        return result;
    }

    nextCode (data) {
        let result = 0;
        let remaining = this.bitsPerSample;
        while (true) {
            let shift = remaining - this.bitPosition;
            result += (shift < 0) ? (this.currentByte >> -shift) : (this.currentByte << shift);
            if (shift > 0) {
                remaining -= this.bitPosition;
                if (data.length - this.position > 0) {
                    this.currentByte = data[this.position++];
                    this.bitPosition = 8;
                } else {
                    this.currentByte = 0;
                    this.bitPosition = 0;
                    return -1;
                }
            } else {
                this.bitPosition -= remaining;
                this.currentByte = this.currentByte & (0xff >> (8 - this.bitPosition));
                break;
            }
        }
        return result;
    }
}

exports.SqueakSound = SqueakSound;
