function Color () {}

/**
 * Convert a Scratch color number to a hex string, #RRGGBB.
 * @param {number} color RGB color as a decimal.
 * @return {string} RGB color as #RRGGBB hex string.
 */
Color.scratchColorToHex = function (color) {
    if (color < 0) {
        color += 0xFFFFFF + 1;
    }
    var hex = Number(color).toString(16);
    hex = '#' + '000000'.substr(0, 6 - hex.length) + hex;
    return hex;
};

module.exports = Color;
