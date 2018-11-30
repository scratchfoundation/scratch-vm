const {ExtendedData} = require('./deserialize/types');
const {Reference, Header, Value} = require('./deserialize/binary-token');
const {TYPES} = require('./deserialize/type-ids');

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

const allPropertyDescriptors = prototype => (
    prototype === null ?
        {} :
        Object.entries(Object.getOwnPropertyDescriptors(prototype))
            .reduce(
                (carry, [key, value]) => {
                    carry[key] = value;
                    return carry;
                },
                allPropertyDescriptors(Object.getPrototypeOf(prototype))
            )
);

const _expanded = {};

class SB1View {
    constructor (data, prefix = '', path = prefix) {
        this._elements = {};

        this.element = document.createElement('div');
        this.element.style.position = 'relative';
        this.element.style.top = '0';
        this.element.style.left = '0';
        // this.element.style.overflow = 'hidden';

        this.content = this.element;

        this.data = data;
        this.prefix = prefix;
        this.path = path;
        this.expanded = !!_expanded[this.path];
        this.canExpand = false;

        this.toggle = this.toggle.bind(this);

        this.element.addEventListener('click', this.toggle);

        this.render();
    }

    toggle (event) {
        if (!this.canExpand) return;

        if (event.target !== this._elements.arrow && event.target !== this._elements.title) return;

        _expanded[this.path] = this.expanded = !this.expanded;
        this.render();

        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    createElement (type, name) {
        if (!this._elements[name]) {
            this._elements[name] = document.createElement(type);
        }
        this._elements[name].innerHTML = '';
        return this._elements[name];
    }

    renderClear () {
        this.canExpand = false;
        while (this.element.children.length) {
            this.element.removeChild(this.element.children[0]);
        }
        this.content = this.element;
    }

    renderArrow () {
        this.canExpand = true;
        const arrowDiv = this.createElement('div', 'arrow');
        arrowDiv.innerHTML = '&#x25b6;';
        arrowDiv.style.position = 'absolute';
        arrowDiv.style.left = '0';
        arrowDiv.style.width = '1em';
        arrowDiv.style.transform = this.expanded ? 'rotateZ(90deg)' : '';
        arrowDiv.style.transition = 'transform 3s';
        this.element.appendChild(arrowDiv);

        const contentDiv = this.createElement('div', 'arrowContent');
        contentDiv.style.position = 'relative';
        contentDiv.style.left = '1em';
        contentDiv.style.right = '0';
        this.element.appendChild(contentDiv);
        this.content = contentDiv;
    }

    renderTitle (title) {
        const titleDiv = this.createElement('div', 'title');
        const fullTitle = (this.prefix ? `${this.prefix}: ` : '') + title;
        if (['\n', '\r', '<br>'].some(str => fullTitle.indexOf(str) !== -1) || fullTitle.length > 80) {
            this.renderArrow();
            if (this.expanded) {
                titleDiv.innerText = fullTitle;
            } else {
                const maxLength = Math.min(fullTitle.lastIndexOf(' ', 80), ['\n', '\r', '<br>'].reduce((value, str) => (fullTitle.indexOf(str) !== -1 ? Math.min(value, fullTitle.indexOf(str)) : value), Infinity));
                titleDiv.innerText = fullTitle.substring(0, maxLength) + ' ...';
            }
        } else {
            titleDiv.innerText = fullTitle;
        }
        this.content.appendChild(titleDiv);
        return titleDiv;
    }

    renderExpand (fn) {
        if (this.expanded) {
            const div = this.createElement('div', 'expanded');
            fn.call(this, div)
            .forEach(view => this.content.appendChild(view.element));
        }
    }

    render () {
        this.renderClear();
        if (this.data instanceof ExtendedData) {
            this.renderArrow();
            this.renderTitle(this.data);
            this.renderExpand(() => {
                return Object.entries(allPropertyDescriptors(Object.getPrototypeOf(this.data)))
                .filter(([, desc]) => desc.get)
                .map(([name]) => {
                    try {
                        return new SB1View(this.data[name], name, `${this.path}.${name}`);
                    } catch (err) {
                        console.error(err);
                        return new SB1View('An error occured rendering this data.', name, `${this.path}.${name}`);
                    }
                });
            });
        } else if (this.data && typeof this.data.view === 'function') {
            const view = this.data.view();
            this.renderArrow();
            this.renderTitle(view);
            this.renderExpand(() => {
                return Object.entries(view)
                .filter(([, value]) => typeof value !== 'function')
                .map(([name]) => {
                    try {
                        return new SB1View(view[name], name, `${this.path}.${name}`);
                    } catch (err) {
                        console.error(err);
                        return new SB1View('An error occured rendering this data.', name, `${this.path}.${name}`);
                    }
                });
            });
        } else if (this.data instanceof Reference) {
            this.renderTitle(`Reference { index: ${this.data.index} }`);
        } else if (this.data instanceof Header) {
            this.renderTitle(`Header { classId: ${this.data.classId} (${TYPE_NAMES[this.data.classId]}), size: ${this.data.size} }`);
        } else if ((this.data instanceof Value) && (this.data.classId === TYPES.COLOR || this.data.classId === TYPES.TRANSLUCENT_COLOR)) {
            this.renderTitle((+this.data).toString(16).padStart(8, '0')).style.fontFamily = 'monospace';
        } else if (this.data instanceof Value) {
            if (this.data.value && this.data.value.buffer) {
                this.renderTitle(`${this.data.value.constructor.name} (${this.data.value.length})`);
            } else {
                this.renderTitle('' + this.data);
            }
        } else if (Array.isArray(this.data) || this.data instanceof SB1ArraySubView) {
            if (this.data.length) this.renderArrow();
            this.renderTitle(`Array (${this.data.length})`);
            if (this.data.length) this.renderExpand(() => {
                return SB1ArraySubView.views(this.data).map((field, index) => new SB1View(field, field instanceof SB1ArraySubView ? field.name : index + 1, `${this.path}[${index}]`));
            });
        } else if (['string', 'number', 'boolean'].includes(typeof this.data)) {
            this.renderTitle('' + this.data);
        } else if (this.data instanceof HTMLElement) {
            this.content.appendChild(this.data);
        } else if (['undefined', 'string', 'number', 'boolean'].includes(typeof this.data) || this.data === null) {
            this.renderTitle('' + this.data);
        } else if (this.data && this.data.constructor === Object) {
            this.renderArrow();
            this.renderTitle('Object');
            this.renderExpand(() => {
                return Object.entries(this.data).map(([key, value]) => (
                    new SB1View(value, key, `${this.path}.${key}`)
                ));
            });
        } else {
            this.renderTitle(`Unknown Structure(${this.data ? this.data.classId || this.data.constructor.name : ''})`);
        }

        // const clearDiv = this.createElement('div', 'clear');
        // clearDiv.style.clear = 'both';
        // this.content.appendChild(clearDiv);
    }
}

window.SB1View = SB1View;
