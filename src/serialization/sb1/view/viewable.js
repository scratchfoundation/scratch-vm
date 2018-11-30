const {ObjectRenderer} = require('./object');

class ViewableRenderer {
    static check (data, view) {
        return data && typeof data.view === 'function';
    }

    render (data, view) {
        const obj = data.view();
        obj.toString = () => data.constructor.name;
        console.log(obj);
        new ObjectRenderer(obj).render(obj, view);
    }
}

exports.ViewableRenderer = ViewableRenderer;

