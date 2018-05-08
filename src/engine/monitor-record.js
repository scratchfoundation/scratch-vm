const {Record} = require('immutable');

const MonitorRecord = Record({
    id: null, // Block Id
    /** Present only if the monitor is sprite-specific, such as x position */
    spriteName: null,
    /** Present only if the monitor is sprite-specific, such as x position */
    targetId: null,
    opcode: null,
    value: null,
    params: null,
    mode: 'default',
    sliderMin: 0,
    sliderMax: 100,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: true
});

module.exports = MonitorRecord;
