var Color = function () {};

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
 * @returns {Object} {r: R, g: G, b: B}, values between 0-255
 */
Color.decimalToRgb = function (decimal) {
    var r = (decimal >> 16) & 0xFF;
    var g = (decimal >> 8) & 0xFF;
    var b = decimal & 0xFF;
    return {r: r, g: g, b: b};
};

/**
 * Convert a hex color (e.g., F00, #03F, #0033FF) to an RGB color object.
 * CC-BY-SA Tim Down:
 * https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 * @param {!string} hex Hex representation of the color.
 * @return {Object} {r: R, g: G, b: B}, 0-255, or null.
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
 * @param {Object} rgb {r: R, g: G, b: B}, values between 0-255.
 * @return {!string} Hex representation of the color.
 */
Color.rgbToHex = function (rgb) {
    return Color.decimalToHex(Color.rgbToDecimal(rgb));
};

/**
 * Convert an RGB color object to a Scratch decimal color.
 * @param {Object} rgb {r: R, g: G, b: B}, values between 0-255.
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

module.exports = Color;
