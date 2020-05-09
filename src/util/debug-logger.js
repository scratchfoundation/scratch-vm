const log = require('./log');

const debugLogger = debugFlag => {
    const debug = func => {
        if (debugFlag) {
            const message = func();
            if (message) {
                log.debug(message);
            }
        }
    };
    return debug;
}

module.exports = debugLogger;
