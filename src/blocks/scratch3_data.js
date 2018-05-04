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
            data_itemnumoflist: this.getItemNumOfList,
            data_lengthoflist: this.lengthOfList,
            data_listcontainsitem: this.listContainsItem
        };
    }

    getVariable (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        return variable.value;
    }

    setVariableTo (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        variable.value = args.VALUE;
    }

    changeVariableBy (args, util) {
        const variable = util.target.lookupOrCreateVariable(
            args.VARIABLE.id, args.VARIABLE.name);
        const castedValue = Cast.toNumber(variable.value);
        const dValue = Cast.toNumber(args.VALUE);
        variable.value = castedValue + dValue;
    }

    getListContents (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        // Determine if the list is all single letters.
        // If it is, report contents joined together with no separator.
        // If it's not, report contents joined together with a space.
        let allSingleLetters = true;
        for (let i = 0; i < list.value.length; i++) {
            const listItem = list.value[i];
            if (!((typeof listItem === 'string') &&
                  (listItem.length === 1))) {
                allSingleLetters = false;
                break;
            }
        }
        if (allSingleLetters) {
            return list.value.join('');
        }
        return list.value.join(' ');

    }

    addToList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        if (list.value.length < Scratch3DataBlocks.LIST_ITEM_LIMIT) list.value.push(args.ITEM);
    }

    deleteOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length);
        if (index === Cast.LIST_INVALID) {
            return;
        } else if (index === Cast.LIST_ALL) {
            list.value = [];
            return;
        }
        list.value.splice(index - 1, 1);
    }

    insertAtList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length + 1);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        const listLimit = Scratch3DataBlocks.LIST_ITEM_LIMIT;
        if (index > listLimit) return;
        list.value.splice(index - 1, 0, item);
        if (list.value.length > listLimit) {
            // If inserting caused the list to grow larger than the limit,
            // remove the last element in the list
            list.value.pop();
        }
    }

    replaceItemOfList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length);
        if (index === Cast.LIST_INVALID) {
            return;
        }
        list.value.splice(index - 1, 1, item);
    }

    getItemOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        const index = Cast.toListIndex(args.INDEX, list.value.length);
        if (index === Cast.LIST_INVALID) {
            return '';
        }
        return list.value[index - 1];
    }

    getItemNumOfList (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);

        // Go through the list items one-by-one using Cast.compare. This is for
        // cases like checking if 123 is contained in a list [4, 7, '123'] --
        // Scratch considers 123 and '123' to be equal.
        for (let i = 0; i < list.value.length; i++) {
            if (Cast.compare(list.value[i], item) === 0) {
                return i + 1;
            }
        }

        // We don't bother using .indexOf() at all, because it would end up with
        // edge cases such as the index of '123' in [4, 7, 123, '123', 9].
        // If we use indexOf(), this block would return 4 instead of 3, because
        // indexOf() sees the first occurence of the string 123 as the fourth
        // item in the list. With Scratch, this would be confusing -- after all,
        // '123' and 123 look the same, so one would expect the block to say
        // that the first occurrence of '123' (or 123) to be the third item.

        // Default to 0 if there's no match. Since Scratch lists are 1-indexed,
        // we don't have to worry about this conflicting with the "this item is
        // the first value" number (in JS that is 0, but in Scratch it's 1).
        return 0;
    }

    lengthOfList (args, util) {
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        return list.value.length;
    }

    listContainsItem (args, util) {
        const item = args.ITEM;
        const list = util.target.lookupOrCreateList(
            args.LIST.id, args.LIST.name);
        if (list.value.indexOf(item) >= 0) {
            return true;
        }
        // Try using Scratch comparison operator on each item.
        // (Scratch considers the string '123' equal to the number 123).
        for (let i = 0; i < list.value.length; i++) {
            if (Cast.compare(list.value[i], item) === 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Type representation for list variables.
     * @const {string}
     */
    static get LIST_ITEM_LIMIT () {
        return 200000;
    }
}

module.exports = Scratch3DataBlocks;
