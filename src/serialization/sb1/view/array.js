const {assert} = require('../assert');

class SB1ArraySubView {
    constructor (array, start, end) {
        this.array = array instanceof SB1ArraySubView ? array.array: array;
        this.start = start;
        this.end = end;
    }

    get length () {
        return this.end - this.start;
    }

    get name () {
        return `${this.start + 1} - ${this.end}`;
    }

    map (fn) {
        const out = [];
        for (let i = this.start; i < this.end; i++) {
            out.push(fn(this.array[i], i, this));
        }
        return out;
    }

    static views (array) {
        if (array instanceof SB1ArrayFullView) {
            return array;
        }
        if (array.length > 100) {
            const scale = Math.pow(10, Math.ceil(Math.log(array.length) / Math.log(10)));
            const increment = scale / 10;

            const views = [];
            for (let i = (array.start || 0); i < (array.end || array.length); i += increment) {
                views.push(new SB1ArraySubView(array, i, Math.min(i + increment, array.end || array.length)));
                assert(views.length <= 10, 'Too many subviews');
            }
            views.push(new SB1ArrayFullView(array));
            return views;
        } else {
            return array;
        }
    }
}

class SB1ArrayFullView extends SB1ArraySubView {
    constructor (array) {
        super(array, array.start || 0, array.end || array.length);
    }

    get name () {
        return 'all';
    }
}

class ArrayRenderer {
    static check (data, view) {
        return Array.isArray(data) || data instanceof SB1ArraySubView;
    }

    render (data, view) {
        if (data.length) view.renderArrow();
        view.renderTitle(`Array (${data.length})`);
        if (data.length) view.renderExpand(() => {
            return SB1ArraySubView.views(data).map((field, index) => view.child(field, field instanceof SB1ArraySubView ? field.name : index + 1, `[${index}]`));
        });
    }
}

exports.ArrayRenderer = ArrayRenderer;
