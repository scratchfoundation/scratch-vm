function MathUtil () {}

MathUtil.degToRad = function (deg) {
    return (Math.PI * (90 - deg)) / 180;
};

MathUtil.radToDeg = function (rad) {
    return rad * 180 / Math.PI;
};

MathUtil.clamp = function (n, min, max) {
    return Math.min(Math.max(n, min), max);
};

MathUtil.wrapClamp = function (n, min, max) {
    var range = (max - min) + 1;
    return n - Math.floor((n - min) / range) * range;
};

module.exports = MathUtil;
