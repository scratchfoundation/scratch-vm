const assert = function (test, message) {
    if (!test) throw new Error(message);
};

exports.assert = assert;
