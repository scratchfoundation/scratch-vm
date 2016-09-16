var Cast = require('../util/cast');

function Scratch3DataBlocks(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
}

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3DataBlocks.prototype.getPrimitives = function () {
    return {
        'data_variable': this.getVariable,
        'data_setvariableto': this.setVariableTo,
        'data_changevariableby': this.changeVariableBy,
        'data_list': this.getList,
        'data_addtolist': this.addToList,
        'data_deleteoflist': this.deleteOfList,
        'data_insertatlist': this.insertAtList,
        'data_replaceitemoflist': this.replaceItemOfList,
        'data_itemoflist': this.getItemOfList,
        'data_lengthoflist': this.lengthOfList,
        'data_listcontainsitem': this.listContainsItem
    };
};

Scratch3DataBlocks.prototype.getVariable = function (args, util) {
    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
    return variable.value;
};

Scratch3DataBlocks.prototype.setVariableTo = function (args, util) {
    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
    variable.value = args.VALUE;
};

Scratch3DataBlocks.prototype.changeVariableBy = function (args, util) {
    var variable = util.target.lookupOrCreateVariable(args.VARIABLE);
    var castedValue = Cast.toNumber(variable.value);
    var dValue = Cast.toNumber(args.VALUE);
    variable.value = castedValue + dValue;
};

Scratch3DataBlocks.prototype.getList = function (args, util) {
    var list = util.target.lookupOrCreateList(args.LIST);
    // Determine if the list is all single letters.
    // If it is, report contents joined together with no separator.
    // If it's not, report contents joined together with a space.
    var allSingleLetters = true;
    for (var i = 0; i < list.contents.length; i++) {
        var listItem = list.contents[i];
        if (!((typeof listItem === 'string') &&
              (listItem.length == 1))) {
            allSingleLetters = false;
            break;
        }
    }
    if (allSingleLetters) {
        return list.contents.join('');
    } else {
        return list.contents.join(' ');
    }
};

Scratch3DataBlocks.prototype.addToList = function (args, util) {
    var list = util.target.lookupOrCreateList(args.LIST);
    list.contents.push(args.ITEM);
};

Scratch3DataBlocks.LIST_INVALID = 'INVALID';
Scratch3DataBlocks.LIST_ALL = 'ALL';
/**
 * Compute a 1-based index into a list, based on a Scratch argument.
 * Two special cases may be returned:
 * LIST_ALL: if the block is referring to all of the items in the list.
 * LIST_INVALID: if the index was invalid in any way.
 * @param {*} index Scratch arg, including 1-based numbers or special cases.
 * @param {number} length Length of the list.
 * @param {boolean} useRound If set, Math.round (not Math.floor for 2.0 compat).
 * @return {(number|string)} 1-based index for list, LIST_ALL, or LIST_INVALID.
 */
Scratch3DataBlocks.prototype._computeIndex = function (
    index, length, useRound) {
    if (typeof index !== 'number') {
        if (index == 'all') {
            return Scratch3DataBlocks.LIST_ALL;
        }
        if (index == 'last') {
            if (length > 0) {
                return length;
            }
            return Scratch3DataBlocks.LIST_INVALID;
        } else if (index == 'random' || index == 'any') {
            if (length > 0) {
                return 1 + Math.floor(Math.random() * length);
            }
            return Scratch3DataBlocks.LIST_INVALID;
        }
        if (isNaN(Number(index))) {
            return Scratch3DataBlocks.LIST_INVALID;
        }
    }
    if (useRound) {
        index = Math.round(Cast.toNumber(index));
    } else {
        index = Math.floor(Cast.toNumber(index));
    }
    if (index < 1 || index > length) {
        return Scratch3DataBlocks.LIST_INVALID;
    }
    return index;
};

Scratch3DataBlocks.prototype.deleteOfList = function (args, util) {
    var list = util.target.lookupOrCreateList(args.LIST);
    var index = this._computeIndex(args.INDEX, list.contents.length, true);
    if (index == Scratch3DataBlocks.LIST_INVALID) {
        return;
    } else if (index == Scratch3DataBlocks.LIST_ALL) {
        list.contents = [];
        return;
    }
    list.contents.splice(index - 1, 1);
};

Scratch3DataBlocks.prototype.insertAtList = function (args, util) {
    var item = args.ITEM;
    var list = util.target.lookupOrCreateList(args.LIST);
    var index = this._computeIndex(args.INDEX, list.contents.length + 1);
    if (index == Scratch3DataBlocks.LIST_INVALID) {
        return;
    }
    list.contents.splice(index - 1, 0, item);
};

Scratch3DataBlocks.prototype.replaceItemOfList = function (args, util) {
    var item = args.ITEM;
    var list = util.target.lookupOrCreateList(args.LIST);
    var index = this._computeIndex(args.INDEX, list.contents.length);
    if (index == Scratch3DataBlocks.LIST_INVALID) {
        return;
    }
    list.contents.splice(index - 1, 1, item);
};

Scratch3DataBlocks.prototype.getItemOfList = function (args, util) {
    var list = util.target.lookupOrCreateList(args.LIST);
    var index = this._computeIndex(args.INDEX, list.contents.length);
    if (index == Scratch3DataBlocks.LIST_INVALID) {
        return '';
    }
    return list.contents[index - 1];
};

Scratch3DataBlocks.prototype.lengthOfList = function (args, util) {
    var list = util.target.lookupOrCreateList(args.LIST);
    return list.contents.length;
};

Scratch3DataBlocks.prototype.listContainsItem = function (args, util) {
    var item = args.ITEM;
    var list = util.target.lookupOrCreateList(args.LIST);
    if (list.contents.indexOf(item) >= 0) {
        return true;
    }
    // Try using Scratch comparison operator on each item.
    // (Scratch considers the string '123' equal to the number 123).
    for (var i = 0; i < list.contents.length; i++) {
        if (Cast.compare(list.contents[i], item) == 0) {
            return true;
        }
    }
    return false;
};

module.exports = Scratch3DataBlocks;
