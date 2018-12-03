const {Reference} = require('./fields');

class ReferenceFixer {
    constructor (table) {
        this.table = Array.from(table);
        this.fixed = this.fix(this.table);
    }

    fix () {
        const fixed = [];

        for (let i = 0; i < this.table.length; i++) {
            this.fixItem(this.table[i]);
            fixed.push(this.table[i]);
        }

        return fixed;
    }

    fixItem (item) {
        if (typeof item.fields !== 'undefined') {
            item = item.fields;
        }
        if (Array.isArray(item)) {
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

exports.ReferenceFixer = ReferenceFixer;
