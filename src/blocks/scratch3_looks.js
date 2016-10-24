var Cast = require('../util/cast');

var Scratch3LooksBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {Object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3LooksBlocks.prototype.getPrimitives = function () {
    return {
        looks_say: this.say,
        looks_sayforsecs: this.sayforsecs,
        looks_think: this.think,
        looks_thinkforsecs: this.sayforsecs,
        looks_show: this.show,
        looks_hide: this.hide,
        looks_switchcostumeto: this.switchCostume,
        looks_switchbackdropto: this.switchBackdrop,
        looks_switchbackdroptoandwait: this.switchBackdropAndWait,
        looks_nextcostume: this.nextCostume,
        looks_nextbackdrop: this.nextBackdrop,
        looks_changeeffectby: this.changeEffect,
        looks_seteffectto: this.setEffect,
        looks_cleargraphiceffects: this.clearEffects,
        looks_changesizeby: this.changeSize,
        looks_setsizeto: this.setSize,
        looks_gotofront: this.goToFront,
        looks_gobacklayers: this.goBackLayers,
        looks_size: this.getSize,
        looks_costumeorder: this.getCostumeIndex,
        looks_backdroporder: this.getBackdropIndex,
        looks_backdropname: this.getBackdropName
    };
};

Scratch3LooksBlocks.prototype.say = function (args, util) {
    util.target.setSay('say', args.MESSAGE);
};

Scratch3LooksBlocks.prototype.sayforsecs = function (args, util) {
    util.target.setSay('say', args.MESSAGE);
    return new Promise(function (resolve) {
        setTimeout(function () {
            // Clear say bubble and proceed.
            util.target.setSay();
            resolve();
        }, 1000 * args.SECS);
    });
};

Scratch3LooksBlocks.prototype.think = function (args, util) {
    util.target.setSay('think', args.MESSAGE);
};

Scratch3LooksBlocks.prototype.thinkforsecs = function (args, util) {
    util.target.setSay('think', args.MESSAGE);
    return new Promise(function (resolve) {
        setTimeout(function () {
            // Clear say bubble and proceed.
            util.target.setSay();
            resolve();
        }, 1000 * args.SECS);
    });
};

Scratch3LooksBlocks.prototype.show = function (args, util) {
    util.target.setVisible(true);
};

Scratch3LooksBlocks.prototype.hide = function (args, util) {
    util.target.setVisible(false);
};

/**
 * Utility function to set the costume or backdrop of a target.
 * Matches the behavior of Scratch 2.0 for different types of arguments.
 * @param {!Target} target Target to set costume/backdrop to.
 * @param {Any} requestedCostume Costume requested, e.g., 0, 'name', etc.
 * @param {boolean=} optZeroIndex Set to zero-index the requestedCostume.
 * @return {Array.<!Thread>} Any threads started by this switch.
 */
Scratch3LooksBlocks.prototype._setCostumeOrBackdrop = function (target,
        requestedCostume, optZeroIndex) {
    if (typeof requestedCostume === 'number') {
        target.setCostume(optZeroIndex ?
            requestedCostume : requestedCostume - 1);
    } else {
        var costumeIndex = target.getCostumeIndexByName(requestedCostume);
        if (costumeIndex > -1) {
            target.setCostume(costumeIndex);
        } else if (costumeIndex === 'previous costume' ||
                   costumeIndex === 'previous backdrop') {
            target.setCostume(target.currentCostume - 1);
        } else if (costumeIndex === 'next costume' ||
                   costumeIndex === 'next backdrop') {
            target.setCostume(target.currentCostume + 1);
        } else {
            var forcedNumber = Cast.toNumber(requestedCostume);
            if (!isNaN(forcedNumber)) {
                target.setCostume(optZeroIndex ?
                    forcedNumber : forcedNumber - 1);
            }
        }
    }
    if (target === this.runtime.getTargetForStage()) {
        // Target is the stage - start hats.
        var newName = target.sprite.costumes[target.currentCostume].name;
        return this.runtime.startHats('event_whenbackdropswitchesto', {
            BACKDROP: newName
        });
    }
    return [];
};

Scratch3LooksBlocks.prototype.switchCostume = function (args, util) {
    this._setCostumeOrBackdrop(util.target, args.COSTUME);
};

Scratch3LooksBlocks.prototype.nextCostume = function (args, util) {
    this._setCostumeOrBackdrop(
        util.target, util.target.currentCostume + 1, true
    );
};

Scratch3LooksBlocks.prototype.switchBackdrop = function (args) {
    this._setCostumeOrBackdrop(this.runtime.getTargetForStage(), args.BACKDROP);
};

Scratch3LooksBlocks.prototype.switchBackdropAndWait = function (args, util) {
    // Have we run before, starting threads?
    if (!util.stackFrame.startedThreads) {
        // No - switch the backdrop.
        util.stackFrame.startedThreads = (
            this._setCostumeOrBackdrop(
                this.runtime.getTargetForStage(),
                args.BACKDROP
            )
        );
        if (util.stackFrame.startedThreads.length === 0) {
            // Nothing was started.
            return;
        }
    }
    // We've run before; check if the wait is still going on.
    var instance = this;
    var waiting = util.stackFrame.startedThreads.some(function (thread) {
        return instance.runtime.isActiveThread(thread);
    });
    if (waiting) {
        util.yield();
    }
};

Scratch3LooksBlocks.prototype.nextBackdrop = function () {
    var stage = this.runtime.getTargetForStage();
    this._setCostumeOrBackdrop(
        stage, stage.currentCostume + 1, true
    );
};

Scratch3LooksBlocks.prototype.changeEffect = function (args, util) {
    var effect = Cast.toString(args.EFFECT).toLowerCase();
    var change = Cast.toNumber(args.CHANGE);
    if (!util.target.effects.hasOwnProperty(effect)) return;
    var newValue = change + util.target.effects[effect];
    util.target.setEffect(effect, newValue);
};

Scratch3LooksBlocks.prototype.setEffect = function (args, util) {
    var effect = Cast.toString(args.EFFECT).toLowerCase();
    var value = Cast.toNumber(args.VALUE);
    util.target.setEffect(effect, value);
};

Scratch3LooksBlocks.prototype.clearEffects = function (args, util) {
    util.target.clearEffects();
};

Scratch3LooksBlocks.prototype.changeSize = function (args, util) {
    var change = Cast.toNumber(args.CHANGE);
    util.target.setSize(util.target.size + change);
};

Scratch3LooksBlocks.prototype.setSize = function (args, util) {
    var size = Cast.toNumber(args.SIZE);
    util.target.setSize(size);
};

Scratch3LooksBlocks.prototype.goToFront = function (args, util) {
    util.target.goToFront();
};

Scratch3LooksBlocks.prototype.goBackLayers = function (args, util) {
    util.target.goBackLayers(args.NUM);
};

Scratch3LooksBlocks.prototype.getSize = function (args, util) {
    return util.target.size;
};

Scratch3LooksBlocks.prototype.getBackdropIndex = function () {
    var stage = this.runtime.getTargetForStage();
    return stage.currentCostume + 1;
};

Scratch3LooksBlocks.prototype.getBackdropName = function () {
    var stage = this.runtime.getTargetForStage();
    return stage.sprite.costumes[stage.currentCostume].name;
};

Scratch3LooksBlocks.prototype.getCostumeIndex = function (args, util) {
    return util.target.currentCostume + 1;
};

module.exports = Scratch3LooksBlocks;
