const _expanded = {};

const _registry = [];

class DefaultRenderer {
    static check () {
        return true;
    }

    render (data, view) {
        if (data instanceof HTMLElement) {
            view.content.appendChild(data);
        } else {
            view.renderTitle(`Unknown Structure(${data ? data.classId || data.constructor.name : ''})`);
        }
    }
}

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

        this.renderer = new (_registry.reduce((carry, [check, Class]) => (
            check(this.data, this) ? Class : carry
        ), DefaultRenderer))(this);

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

    child (value, key, path) {
        return new SB1View(value, key, `${this.path}${path}`);
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

    expand (fn, elsefn) {
        if (this.expanded) {
            elsefn();
        } else {
            fn();
        }
    }

    renderExpand (fn) {
        if (this.expanded) {
            try {
                const div = this.createElement('div', 'expanded');
                fn.call(this, div)
                .forEach(view => this.content.appendChild(view.element));
            } catch (error) {
                console.error(error);
                const divError = this.createElement('div', 'expanded-error');
                divError.innerText = 'Error rendering expanded area ...';
                this.content.appendChild(divError);
            }
        }
    }

    render () {
        this.renderClear();
        this.renderer.render(this.data, this);
    }

    static register (Class) {
        _registry.push([Class.check, Class]);
    }
}

exports.SB1View = SB1View;
