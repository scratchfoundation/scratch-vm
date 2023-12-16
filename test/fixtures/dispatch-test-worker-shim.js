const Module = require('module');

const callsite = require('callsite');
const path = require('path');

const oldRequire = Module.prototype.require;
Module.prototype.require = function (target) {
    if (target.indexOf('/') === -1) {
        // we really do just want to forward the arguments here
        // eslint-disable-next-line prefer-rest-params
        return oldRequire.apply(this, arguments);
    }

    const stack = callsite();
    const callerFile = stack[2].getFileName();
    const callerDir = path.dirname(callerFile);
    target = path.resolve(callerDir, target);
    return oldRequire.call(this, target);
};

oldRequire(path.resolve(__dirname, 'dispatch-test-worker'));
