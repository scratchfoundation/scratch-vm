/**
 * Thread is an internal data structure used by the interpreter. It holds the
 * state of a thread so it can continue from where it left off, and it has
 * a stack to support nested control structures and procedure calls.
 *
 * @param {String} Unique block identifier
 */
function Thread (id) {
    this.topBlockId = id;
    this.blockPointer = id;
    this.blockFirstTime = -1;
    this.nextBlock = null;
    this.waiting = null;
    this.runningDeviceBlock = false;
    this.stack = [];
    this.repeatCounter = -1;
}

module.exports = Thread;
