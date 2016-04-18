function Primitives () {

}

Primitives.prototype.event_whenflagclicked = function (thread, runtime) {
    // No-op: flags are started by the interpreter but don't do any action
    // Take 1/3 second to show running state
    if (Date.now() - thread.blockFirstTime < 300) {
        thread.yield = true;
        return;
    }
};

Primitives.prototype.control_repeat = function (thread, runtime) {
    // Take 1/3 second to show running state
    if (Date.now() - thread.blockFirstTime < 300) {
        thread.yield = true;
        return;
    }
    if (thread.repeatCounter == -1) {
        thread.repeatCounter = 10; // @todo from the arg
    }
    if (thread.repeatCounter > 0) {
        thread.repeatCounter -= 1;
        runtime.interpreter.startSubstack(thread);
    } else {
        thread.repeatCounter = -1;
        thread.nextBlock = runtime.getNextBlock(thread.blockPointer);
    }
};

Primitives.prototype.control_forever = function (thread, runtime) {
    // Take 1/3 second to show running state
    if (Date.now() - thread.blockFirstTime < 300) {
        thread.yield = true;
        return;
    }
    runtime.interpreter.startSubstack(thread);
};

module.exports = Primitives;
