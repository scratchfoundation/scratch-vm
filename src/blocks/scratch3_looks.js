var Cast = require('../util/cast');

function Scratch3LooksBlocks(runtime) {
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
Scratch3LooksBlocks.prototype.getPrimitives = function() {
    return {
        'looks_say': this.say,
        'looks_sayforsecs': this.sayforsecs,
        'looks_think': this.think,
        'looks_thinkforsecs': this.sayforsecs,
        'looks_show': this.show,
        'looks_hide': this.hide,
        'looks_backdrops': this.backdropMenu,
        'looks_costume': this.costumeMenu,
        'looks_switchcostumeto': this.switchCostume,
        'looks_switchbackdropto': this.switchBackdrop,
        'looks_nextcostume': this.nextCostume,
        'looks_nextbackdrop': this.nextBackdrop,
        'looks_effectmenu': this.effectMenu,
        'looks_changeeffectby': this.changeEffect,
        'looks_seteffectto': this.setEffect,
        'looks_cleargraphiceffects': this.clearEffects,
        'looks_changesizeby': this.changeSize,
        'looks_setsizeto': this.setSize,
        'looks_size': this.getSize,
        'looks_costumeorder': this.getCostumeIndex,
        'looks_backdroporder': this.getBackdropIndex,
        'looks_backdropname': this.getBackdropName
    };
};

Scratch3LooksBlocks.prototype.say = function (args, util) {
    util.target.setSay('say', args.MESSAGE);
};

Scratch3LooksBlocks.prototype.sayforsecs = function (args, util) {
    util.target.setSay('say', args.MESSAGE);
    return new Promise(function(resolve) {
        setTimeout(function() {
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
    return new Promise(function(resolve) {
        setTimeout(function() {
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

// @todo(GH-146): Remove.
Scratch3LooksBlocks.prototype.costumeMenu = function (args) {
    return args.COSTUME;
};

// @todo(GH-146): Remove.
Scratch3LooksBlocks.prototype.backdropMenu = function (args) {
    return args.BACKDROP;
};

Scratch3LooksBlocks.prototype.switchCostume = function (args, util) {
    var requestedCostume = args.COSTUME;
    if (typeof requestedCostume === 'number') {
        util.target.setCostume(requestedCostume - 1);
    } else {
        var costumeIndex = util.target.getCostumeIndexByName(requestedCostume);
        if (costumeIndex > -1) {
            util.target.setCostume(costumeIndex);
        } else if (costumeIndex == 'previous costume') {
            util.target.setCostume(util.target.currentCostume - 1);
        } else if (costumeIndex == 'next costume') {
            util.target.setCostume(util.target.currentCostume + 1);
        } else {
            var forcedNumber = Cast.toNumber(requestedCostume);
            if (!isNaN(forcedNumber)) {
                util.target.setCostume(forcedNumber - 1);
            }
        }
    }
};

Scratch3LooksBlocks.prototype.switchBackdrop = function (args, util) {
    // Patch the target to be the stage; then treat as a costume.
    var stage = this.runtime.getTargetForStage();
    util.target = stage;
    var oldBackdrop = stage.currentCostume;
    this.switchCostume({COSTUME: args.BACKDROP}, util);
    if (stage.currentCostume !== oldBackdrop) {
        // Backdrop changed - fire hats.
        var backdropName = stage.sprite.costumes[stage.currentCostume].name;
        this.runtime.startHats('event_whenbackdropswitchesto', {
            'BACKDROP': backdropName
        });
    }
};

Scratch3LooksBlocks.prototype.nextCostume = function (args, util) {
    util.target.setCostume(util.target.currentCostume + 1);
};

Scratch3LooksBlocks.prototype.nextBackdrop = function (args, util) {
    // Patch the target to be the stage; then treat as a costume.
    util.target = this.runtime.getTargetForStage();
    this.nextCostume(args, util);
};

Scratch3LooksBlocks.prototype.effectMenu = function (args) {
    return args.EFFECT.toLowerCase();
};

Scratch3LooksBlocks.prototype.changeEffect = function (args, util) {
    var newValue = args.CHANGE + util.target.effects[args.EFFECT];
    util.target.setEffect(args.EFFECT, newValue);
};

Scratch3LooksBlocks.prototype.setEffect = function (args, util) {
    util.target.setEffect(args.EFFECT, args.VALUE);
};

Scratch3LooksBlocks.prototype.clearEffects = function (args, util) {
    util.target.clearEffects();
};

Scratch3LooksBlocks.prototype.changeSize = function (args, util) {
    util.target.setSize(util.target.size + args.CHANGE);
};

Scratch3LooksBlocks.prototype.setSize = function (args, util) {
    util.target.setSize(args.SIZE);
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
