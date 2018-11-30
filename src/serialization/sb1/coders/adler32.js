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

exports.Adler32 = Adler32;
