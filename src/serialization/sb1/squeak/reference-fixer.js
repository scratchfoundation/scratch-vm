class SB1ReferenceFixer {
    constructor (table, filter) {
        this.table = Array.from(table);
        this.filter = filter;
        this.fixed = this.fix(this.table);
    }

    fix () {
        const fixed = [];

        for (let i = 0; i < this.table.length; i++) {
            this.fixItem(this.table[i]);
            if (this.filter && this.filter(this.table[i]) || !this.filter) {
                fixed.push(this.table[i]);
            }
        }

        return fixed;
    }

    fixItem (item) {
        if (typeof item.fields !== 'undefined') {
            item.fields = item.fields.map(this.deref, this);
        } else if (typeof item.bytes !== 'undefined') {
            item.width = this.deref(item.width);
            item.height = this.deref(item.height);
            item.depth = this.deref(item.depth);
            item.something = this.deref(item.something);
            item.bytes = this.deref(item.bytes);
            item.colormap = this.deref(item.colormap);
        } else if (Array.isArray(item)) {
            for (let i = 0; i < item.length; i++) {
                item[i] = this.deref(item[i]);
            }
        }
    }

    deref (ref) {
        if (ref instanceof Reference) {
            return this.table[ref.index - 1];
        }
        return ref;
    }
}

window.SB1ReferenceFixer = SB1ReferenceFixer;
