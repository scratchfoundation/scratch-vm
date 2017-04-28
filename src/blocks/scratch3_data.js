const Cast = require('../util/cast');

class Scratch3DataBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            data_variable: this.getVariable,
            data_setvariableto: this.setVariableTo,
            data_changevariableby: this.changeVariableBy,
            data_listcontents: this.getListContents,
            data_addtolist: this.addToList,
            data_deleteoflist: this.deleteOfList,
            data_insertatlist: this.insertAtList,
            data_replaceitemoflist: this.replaceItemOfList,
            data_itemoflist: this.getItemOfList,
            data_lengthoflist: this.lengthOfList,
            data_listcontainsitem: this.listContainsItem
        };
    }

    getVariable (args, util) {
        const variable = util.target.lookupOrCreateVariable(args.VARIABLE);
        return variable.value;
    }

    setVariableTo (args, util) {
        const variable = util.target.lookupOrCreateVariable(args.VARIABLE);
        variable.value = args.VALUE;
    }

    changeVariableBy (args, util) {
        const variable = util.target.lookupOrCreateVariable(args.VARIABLE);
        const castedValue = Cast.toNumber(variable.value);
        const dValue = Cast.toNumber(args.VALUE);
        variable.value = castedValue + dValue;
    }

    getListContents (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST);
        // Determine if the list is all single letters.
        // If it is, report contents joined together with no separator.
        // If it's not, report contents joined together with a space.
        let allSingleLetters = true;
        for (let i = 0; i < list.contents.length; i++) {
            const listItem = list.contents[i];
            if (!((typeof listItem === 'string') &&
                  (listItem.length === 1))) {
                allSingleLetters = false;
                break;
            }
        }
        if (allSingleLetters) {
            return list.contents.join('');
        }
        return list.contents.join(' ');

    }

    addToList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST);
        list.contents.push(args.ITEM);
    }

    deleteOfList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST);
        const index = Cast.toListIndex(args.INDEX, list.contents.length);
        if (index === Cast.LIST_INVALID) {
            return;
        } else if (index === Cast.LIST_ALL) {
            list.contents = [];
            return;
        }
        list.contents.splice(index - 1, 1);
    }

    insertAtList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(args.LIST);
        const index = Cast.toListIndex(args.INDEX, list.contents.length + 1);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        list.contents.splice(index - 1, 0, item);
    }

    replaceItemOfList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(args.LIST);
        const index = Cast.toListIndex(args.INDEX, list.contents.length);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        list.contents.splice(index - 1, 1, item);
    }

    getItemOfList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST);
        const index = Cast.toListIndex(args.INDEX, list.contents.length);
        if (index === Cast.LIST_INVALID) {
            return '';
        }
        return list.contents[index - 1];
    }

    lengthOfList (args, util) {
        const list = util.target.lookupOrCreateList(args.LIST);
        return list.contents.length;
    }

    listContainsItem (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(args.LIST);
        if (list.contents.indexOf(item) >= 0) {
            return true;
        }
        // Try using Scratch comparison operator on each item.
        // (Scratch considers the string '123' equal to the number 123).
        for (let i = 0; i < list.contents.length; i++) {
            if (Cast.compare(list.contents[i], item) === 0) {
                return true;
            }
        }
        return false;
    }
}

module.exports = Scratch3DataBlocks;
