var Color = function () {};

/**
 * @typedef {object} RGBObject - An object representing a color in RGB format.
 * @property {number} r - the red component, in the range [0, 255].
 * @property {number} g - the green component, in the range [0, 255].
 * @property {number} b - the blue component, in the range [0, 255].
 */

/**
 * @typedef {object} HSVObject - An object representing a color in HSV format.
 * @property {number} h - hue, in the range [0-359).
 * @property {number} s - saturation, in the range [0,1].
 * @property {number} v - value, in the range [0,1].
 */

/** @type {RGBObject} */
Color.RGB_BLACK = {r: 0, g: 0, b: 0};

/** @type {RGBObject} */
Color.RGB_WHITE = {r: 255, g: 255, b: 255};

/**
 * Convert a Scratch decimal color to a hex string, #RRGGBB.
 * @param {number} decimal RGB color as a decimal.
 * @return {string} RGB color as #RRGGBB hex string.
 */
Color.decimalToHex = function (decimal) {
    if (decimal < 0) {
        decimal += 0xFFFFFF + 1;
    }
    var hex = Number(decimal).toString(16);
    hex = '#' + '000000'.substr(0, 6 - hex.length) + hex;
    return hex;
};

/**
 * Convert a Scratch decimal color to an RGB color object.
 * @param {number} decimal RGB color as decimal.
 * @return {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
 */
Color.decimalToRgb = function (decimal) {
    var a = (decimal >> 24) & 0xFF;
    var r = (decimal >> 16) & 0xFF;
    var g = (decimal >> 8) & 0xFF;
    var b = decimal & 0xFF;
    return {r: r, g: g, b: b, a: a > 0 ? a : 255};
};

/**
 * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
 * CC-BY-SA Tim Down:
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * @param {!string} hex Hex representation of the color.
 * @return {RGBObject} null on failure, or rgb: {r: red [0,255], g: green [0,255], b: blue [0,255]}.
 */
Color.hexToRgb = function (hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

/**
 * Convert an RGB color object to a hex color.
 * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
 * @return {!string} Hex representation of the color.
 */
Color.rgbToHex = function (rgb) {
    return Color.decimalToHex(Color.rgbToDecimal(rgb));
};

/**
 * Convert an RGB color object to a Scratch decimal color.
 * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
 * @return {!number} Number representing the color.
 */
Color.rgbToDecimal = function (rgb) {
    return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
};

/**
* Convert a hex color (e.g., F00, #03F, #0033FF) to a decimal color number.
* @param {!string} hex Hex representation of the color.
* @return {!number} Number representing the color.
*/
Color.hexToDecimal = function (hex) {
    return Color.rgbToDecimal(Color.hexToRgb(hex));
};

/**
 * Convert an HSV color to RGB format.
 * @param {HSVObject} hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
 * @return {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
 */
Color.hsvToRgb = function (hsv) {
    var h = hsv.h % 360;
    if (h < 0) h += 360;
    var s = Math.max(0, Math.min(hsv.s, 1));
    var v = Math.max(0, Math.min(hsv.v, 1));

    var i = Math.floor(h / 60);
    var f = (h / 60) - i;
    var p = v * (1 - s);
    var q = v * (1 - (s * f));
    var t = v * (1 - (s * (1 - f)));

    var r;
    var g;
    var b;

    switch (i) {
    default:
    case 0:
        r = v;
        g = t;
        b = p;
        break;
    case 1:
        r = q;
        g = v;
        b = p;
        break;
    case 2:
        r = p;
        g = v;
        b = t;
        break;
    case 3:
        r = p;
        g = q;
        b = v;
        break;
    case 4:
        r = t;
        g = p;
        b = v;
        break;
    case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
    };
};

/**
 * Convert an RGB color to HSV format.
 * @param {RGBObject} rgb - {r: red [0,255], g: green [0,255], b: blue [0,255]}.
 * @return {HSVObject} hsv - {h: hue [0,360), s: saturation [0,1], v: value [0,1]}
 */
Color.rgbToHsv = function (rgb) {
    var r = rgb.r / 255;
    var g = rgb.g / 255;
    var b = rgb.b / 255;
    var x = Math.min(Math.min(r, g), b);
    var v = Math.max(Math.max(r, g), b);

    // For grays, hue will be arbitrarily reported as zero. Otherwise, calculate
    var h = 0;
    var s = 0;
    if (x !== v) {
        var f = (r === x) ? g - b : ((g === x) ? b - r : r - g);
        var i = (r === x) ? 3 : ((g === x) ? 5 : 1);
        h = ((i - (f / (v - x))) * 60) % 360;
        s = (v - x) / v;
    }

    return {h: h, s: s, v: v};
};

/**
 * Linear interpolation between rgb0 and rgb1.
 * @param {RGBObject} rgb0 - the color corresponding to fraction1 <= 0.
 * @param {RGBObject} rgb1 - the color corresponding to fraction1 >= 1.
 * @param {number} fraction1 - the interpolation parameter. If this is 0.5, for example, mix the two colors equally.
 * @return {RGBObject} the interpolated color.
 */
Color.mixRgb = function (rgb0, rgb1, fraction1) {
    if (fraction1 <= 0) return rgb0;
    if (fraction1 >= 1) return rgb1;
    var fraction0 = 1 - fraction1;
    return {
        r: (fraction0 * rgb0.r) + (fraction1 * rgb1.r),
        g: (fraction0 * rgb0.g) + (fraction1 * rgb1.g),
        b: (fraction0 * rgb0.b) + (fraction1 * rgb1.b)
    };
};

module.exports = Color;
