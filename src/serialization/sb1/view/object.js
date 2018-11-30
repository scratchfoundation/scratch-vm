class ObjectRenderer {
    static check (data) {
        return data && data.constructor === Object;
    }

    render (dataOrFn, view) {
        view.renderArrow();
        view.renderTitle(String(dataOrFn) === '[object Object]' ? 'Object' : String(dataOrFn));
        view.renderExpand(() => {
            const data = typeof dataOrFn === 'function' ? dataOrFn() : dataOrFn;
            return Object.keys(data)
            .map(key => {
                try {
                    if (typeof data[key] === 'function') return;
                    return view.child(data[key], key, `.${key}`);
                } catch (err) {
                    console.error(err);
                    return view.child('An error occured rendering view data.', key, `.${key}`);
                }
            })
            .filter(Boolean);
        });
    }
}

exports.ObjectRenderer = ObjectRenderer;
