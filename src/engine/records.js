const {Record} = require('immutable');

const MonitorRecord = Record({
    id: null,
    category: 'data',
    label: null,
    value: null,
    x: null,
    y: null
});

module.exports = MonitorRecord;
