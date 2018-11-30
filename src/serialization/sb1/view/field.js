const {Field, Header, Reference, Value} = require('../squeak/fields');
const {TYPES, TYPE_NAMES} = require('../squeak/ids');

class FieldRenderer {
    static check (data, view) {
        return data instanceof Field;
    }

    render (data, view) {
        if (data instanceof Reference) {
            view.renderTitle(`Reference { index: ${data.index} }`);
        } else if (data instanceof Header) {
            view.renderTitle(`Header { classId: ${data.classId} (${TYPE_NAMES[data.classId]}), size: ${data.size} }`);
        } else if ((data instanceof Value) && (data.classId === TYPES.COLOR || data.classId === TYPES.TRANSLUCENT_COLOR)) {
            view.renderTitle((+data).toString(16).padStart(8, '0')).style.fontFamily = 'monospace';
        } else if (data instanceof Value) {
            if (data.value && data.value.buffer) {
                view.renderTitle(`${data.value.constructor.name} (${data.value.length})`);
            } else {
                view.renderTitle('' + data);
            }
        }
    }
}

exports.FieldRenderer = FieldRenderer;
