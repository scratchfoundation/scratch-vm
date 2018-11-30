const {ObjectRenderer} = require('./object');

class ViewableRenderer {
    static check (data, view) {
        return data && typeof data.view === 'function';
    }

    render (data, view) {
        new ObjectRenderer().render(Object.assign(() => data.view(), {
            toString () { return data.constructor.name; }
        }), view);
    }
}

exports.ViewableRenderer = ViewableRenderer;

