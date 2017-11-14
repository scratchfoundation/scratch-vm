const {Record} = require('immutable');

const MonitorRecord = Record({
    id: null,
    /** Present only if the monitor is sprite-specific, such as x position */
    spriteName: null,
    /** Present only if the monitor is sprite-specific, such as x position */
    targetId: null,
    opcode: null,
    value: null,
    params: null
});

module.exports = MonitorRecord;
