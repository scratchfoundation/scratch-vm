class ObjectRenderer {
    static check (data) {
        return data && data.constructor === Object;
    }

    render (data, view) {
        view.renderArrow();
        view.renderTitle(String(data) === '[object Object]' ? 'Object' : String(data));
        view.renderExpand(() => {
            return Object.entries(data)
            .filter(([, value]) => typeof value !== 'function')
            .map(([key, value]) => {
                try {
                    return view.child(value, key, `.${key}`);
                } catch (err) {
                    console.error(err);
                    return view.child('An error occured rendering view data.', key, `.${key}`);
                }
            });
        });
    }
}

exports.ObjectRenderer = ObjectRenderer;
