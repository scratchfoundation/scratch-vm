const defaultColorMap = [
    0x00000000, 0xFF000000, 0xFFFFFFFF, 0xFF808080, 0xFFFF0000, 0xFF00FF00, 0xFF0000FF, 0xFF00FFFF,
    0xFFFFFF00, 0xFFFF00FF, 0xFF202020, 0xFF404040, 0xFF606060, 0xFF9F9F9F, 0xFFBFBFBF, 0xFFDFDFDF,
    0xFF080808, 0xFF101010, 0xFF181818, 0xFF282828, 0xFF303030, 0xFF383838, 0xFF484848, 0xFF505050,
    0xFF585858, 0xFF686868, 0xFF707070, 0xFF787878, 0xFF878787, 0xFF8F8F8F, 0xFF979797, 0xFFA7A7A7,
    0xFFAFAFAF, 0xFFB7B7B7, 0xFFC7C7C7, 0xFFCFCFCF, 0xFFD7D7D7, 0xFFE7E7E7, 0xFFEFEFEF, 0xFFF7F7F7,
    0xFF000000, 0xFF003300, 0xFF006600, 0xFF009900, 0xFF00CC00, 0xFF00FF00, 0xFF000033, 0xFF003333,
    0xFF006633, 0xFF009933, 0xFF00CC33, 0xFF00FF33, 0xFF000066, 0xFF003366, 0xFF006666, 0xFF009966,
    0xFF00CC66, 0xFF00FF66, 0xFF000099, 0xFF003399, 0xFF006699, 0xFF009999, 0xFF00CC99, 0xFF00FF99,
    0xFF0000CC, 0xFF0033CC, 0xFF0066CC, 0xFF0099CC, 0xFF00CCCC, 0xFF00FFCC, 0xFF0000FF, 0xFF0033FF,
    0xFF0066FF, 0xFF0099FF, 0xFF00CCFF, 0xFF00FFFF, 0xFF330000, 0xFF333300, 0xFF336600, 0xFF339900,
    0xFF33CC00, 0xFF33FF00, 0xFF330033, 0xFF333333, 0xFF336633, 0xFF339933, 0xFF33CC33, 0xFF33FF33,
    0xFF330066, 0xFF333366, 0xFF336666, 0xFF339966, 0xFF33CC66, 0xFF33FF66, 0xFF330099, 0xFF333399,
    0xFF336699, 0xFF339999, 0xFF33CC99, 0xFF33FF99, 0xFF3300CC, 0xFF3333CC, 0xFF3366CC, 0xFF3399CC,
    0xFF33CCCC, 0xFF33FFCC, 0xFF3300FF, 0xFF3333FF, 0xFF3366FF, 0xFF3399FF, 0xFF33CCFF, 0xFF33FFFF,
    0xFF660000, 0xFF663300, 0xFF666600, 0xFF669900, 0xFF66CC00, 0xFF66FF00, 0xFF660033, 0xFF663333,
    0xFF666633, 0xFF669933, 0xFF66CC33, 0xFF66FF33, 0xFF660066, 0xFF663366, 0xFF666666, 0xFF669966,
    0xFF66CC66, 0xFF66FF66, 0xFF660099, 0xFF663399, 0xFF666699, 0xFF669999, 0xFF66CC99, 0xFF66FF99,
    0xFF6600CC, 0xFF6633CC, 0xFF6666CC, 0xFF6699CC, 0xFF66CCCC, 0xFF66FFCC, 0xFF6600FF, 0xFF6633FF,
    0xFF6666FF, 0xFF6699FF, 0xFF66CCFF, 0xFF66FFFF, 0xFF990000, 0xFF993300, 0xFF996600, 0xFF999900,
    0xFF99CC00, 0xFF99FF00, 0xFF990033, 0xFF993333, 0xFF996633, 0xFF999933, 0xFF99CC33, 0xFF99FF33,
    0xFF990066, 0xFF993366, 0xFF996666, 0xFF999966, 0xFF99CC66, 0xFF99FF66, 0xFF990099, 0xFF993399,
    0xFF996699, 0xFF999999, 0xFF99CC99, 0xFF99FF99, 0xFF9900CC, 0xFF9933CC, 0xFF9966CC, 0xFF9999CC,
    0xFF99CCCC, 0xFF99FFCC, 0xFF9900FF, 0xFF9933FF, 0xFF9966FF, 0xFF9999FF, 0xFF99CCFF, 0xFF99FFFF,
    0xFFCC0000, 0xFFCC3300, 0xFFCC6600, 0xFFCC9900, 0xFFCCCC00, 0xFFCCFF00, 0xFFCC0033, 0xFFCC3333,
    0xFFCC6633, 0xFFCC9933, 0xFFCCCC33, 0xFFCCFF33, 0xFFCC0066, 0xFFCC3366, 0xFFCC6666, 0xFFCC9966,
    0xFFCCCC66, 0xFFCCFF66, 0xFFCC0099, 0xFFCC3399, 0xFFCC6699, 0xFFCC9999, 0xFFCCCC99, 0xFFCCFF99,
    0xFFCC00CC, 0xFFCC33CC, 0xFFCC66CC, 0xFFCC99CC, 0xFFCCCCCC, 0xFFCCFFCC, 0xFFCC00FF, 0xFFCC33FF,
    0xFFCC66FF, 0xFFCC99FF, 0xFFCCCCFF, 0xFFCCFFFF, 0xFFFF0000, 0xFFFF3300, 0xFFFF6600, 0xFFFF9900,
    0xFFFFCC00, 0xFFFFFF00, 0xFFFF0033, 0xFFFF3333, 0xFFFF6633, 0xFFFF9933, 0xFFFFCC33, 0xFFFFFF33,
    0xFFFF0066, 0xFFFF3366, 0xFFFF6666, 0xFFFF9966, 0xFFFFCC66, 0xFFFFFF66, 0xFFFF0099, 0xFFFF3399,
    0xFFFF6699, 0xFFFF9999, 0xFFFFCC99, 0xFFFFFF99, 0xFFFF00CC, 0xFFFF33CC, 0xFFFF66CC, 0xFFFF99CC,
    0xFFFFCCCC, 0xFFFFFFCC, 0xFFFF00FF, 0xFFFF33FF, 0xFFFF66FF, 0xFFFF99FF, 0xFFFFCCFF, 0xFFFFFFFF];

const defaultOneBitColorMap = [0xFFFFFFFF, 0xFF000000];

class SqueakImageDecoder {
    decodeIntIncrement (bytes, position) {
        const count = bytes[position];
        if (count <= 223) {
            return 1;
        }
        if (count <= 254) {
            return 2;
        }
        return 5;
    }

    decodeInt (bytes, position) {
        const count = bytes[position];
        if (count <= 223) {
            return count;
        }
        if (count <= 254) {
            return ((count - 224) * 256) + bytes[position + 1];
        }
        return Uint32BE.read(bytes, position + 1);
    }

    decode (width, height, depth, bytes, colormap, table) {
        const pixels = this.decodePixels(bytes, depth === 32);

        if (depth <= 8) {
            if (!colormap) {
                colormap = depth === 1 ? defaultOneBitColorMap : defaultColorMap;
            }
            return this.unpackPixels(pixels, width, height, depth, colormap);
        } else if (depth === 16) {
            return this.raster16To32(pixels, width, height);
        } else if (depth === 32) {
            return pixels;
        }
        throw new Error('Unhandled Squeak Image depth.');
    }

    decodePixels (bytes, withAlpha) {
        let result;

        // Already decompressed
        if (Array.isArray(bytes) || bytes instanceof Uint32Array) {
            result = new Uint32Array(bytes);
            if (withAlpha) {
                for (let i = 0; i < result.length; i++) {
                    if (result[i] !== 0) {
                        result[i] = 0xff000000 | result[i];
                    }
                }
            }
            return result;
        }

        const pixelsOut = this.decodeInt(bytes, 0);
        let position = this.decodeIntIncrement(bytes, 0);
        result = new Uint32Array(pixelsOut);

        let i = 0;
        while (i < pixelsOut) {
            const runLengthAndCode = this.decodeInt(bytes, position);
            position += this.decodeIntIncrement(bytes, position);
            const runLength = runLengthAndCode >> 2;
            const code = runLengthAndCode & 0b11;

            let w;

            switch (code) {
            case 0:
                i += runLength;
                break;

            case 1:
                w = bytes[position++];
                w = (w << 24) | (w << 16) | (w << 8) | w;
                if (withAlpha && w != 0) {
                    w |= 0xff000000;
                }
                for (let j = 0; j < runLength; j++) {
                    result[i++] = w;
                }
                break;

            case 2:
                w = Uint32BE.read(bytes, position);
                position += 4;
                if (withAlpha && w !== 0) {
                    w |= 0xff000000;
                }
                for (let j = 0; j < runLength; j++) {
                    result[i++] = w;
                }
                break;

            case 3:
                for (let j = 0; j < runLength; j++) {
                    w = Uint32BE.read(bytes, position);
                    position += 4;
                    if (withAlpha && w !== 0) {
                        w |= 0xff000000;
                    }
                    result[i++] = w;
                }
            }
        }

        return result;
    }

    unpackPixels (words, width, height, depth, colormap) {
        const result = new Uint32Array(width * height);
        const span = words.length / height;
        const mask = (1 << depth) - 1;
        const pixelsPerWord = 32 / depth;
        let dst = 0;

        let src = 0;
        for (let y = 0; y < height; y++) {
            let word;
            let shift = -1;
            for (let x = 0; x < width; x++) {
                if (shift < 0) {
                    shift = depth * (pixelsPerWord - 1);
                    word = words[src++];
                }
                result[dst++] = colormap[(word >> shift) & mask];
                shift -= depth;
            }
        }
        return result;
    }

    raster16To32 (words, width, height) {
        const result = new Uint32Array(2 * words.length);
        let shift;
        let word;
        let pix;
        let src = 0;
        let dst = 0;
        for (let y = 0; y < height; y++) {
            shift = -1;
            for (let x = 0; x < width; x++) {
                if (shift < 0) {
                    shift = 16;
                    word = words[src++];
                }
                pix = (word >> shift) & 0xffff;
                if (pix !== 0) {
                    const red = (pix >> 7) & 0b11111000;
                    const green = (pix >> 2) & 0b11111000;
                    const blue = (pix << 3) & 0b11111000;
                    pix = 0xff000000 | (red << 16) | (green << 8) | blue;
                }
                result[dst++] = pix;
                shift -= 16;
            }
        }
        return result;
    }

    buildCustomColormap (depth, colors, table) {
        const result = new Uint32Array(1 << depth);
        for (let i = 0; i < colors.length; i++) {
            result[i] = table[colors[i].index - 1];
        }
        return result;
    }
}
