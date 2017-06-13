const {Record} = require('immutable');

const MonitorRecord = Record({
    id: null,
    opcode: null,
    value: null,
    params: null
});

module.exports = MonitorRecord;
