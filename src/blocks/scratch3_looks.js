const Cast = require('../util/cast');

class Scratch3LooksBlocks {
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
    }

    say (args, util) {
        util.target.setSay('say', args.MESSAGE);
    }

    sayforsecs (args, util) {
        util.target.setSay('say', args.MESSAGE);
        return new Promise(resolve => {
            setTimeout(() => {
                // Clear say bubble and proceed.
                util.target.setSay();
                resolve();
            }, 1000 * args.SECS);
        });
    }

    think (args, util) {
        util.target.setSay('think', args.MESSAGE);
    }

    thinkforsecs (args, util) {
        util.target.setSay('think', args.MESSAGE);
        return new Promise(resolve => {
            setTimeout(() => {
                // Clear say bubble and proceed.
                util.target.setSay();
                resolve();
            }, 1000 * args.SECS);
        });
    }

    show (args, util) {
        util.target.setVisible(true);
    }

    hide (args, util) {
        util.target.setVisible(false);
    }

    /**
     * Utility function to set the costume or backdrop of a target.
     * Matches the behavior of Scratch 2.0 for different types of arguments.
     * @param {!Target} target Target to set costume/backdrop to.
     * @param {Any} requestedCostume Costume requested, e.g., 0, 'name', etc.
     * @param {boolean=} optZeroIndex Set to zero-index the requestedCostume.
     * @return {Array.<!Thread>} Any threads started by this switch.
     */
    _setCostumeOrBackdrop (target,
            requestedCostume, optZeroIndex) {
        if (typeof requestedCostume === 'number') {
            target.setCostume(optZeroIndex ?
                requestedCostume : requestedCostume - 1);
        } else {
            const costumeIndex = target.getCostumeIndexByName(requestedCostume);
            if (costumeIndex > -1) {
                target.setCostume(costumeIndex);
            } else if (requestedCostume === 'previous costume' ||
                       requestedCostume === 'previous backdrop') {
                target.setCostume(target.currentCostume - 1);
            } else if (requestedCostume === 'next costume' ||
                       requestedCostume === 'next backdrop') {
                target.setCostume(target.currentCostume + 1);
            } else {
                const forcedNumber = Number(requestedCostume);
                if (!isNaN(forcedNumber)) {
                    target.setCostume(optZeroIndex ?
                        forcedNumber : forcedNumber - 1);
                }
            }
        }
        if (target === this.runtime.getTargetForStage()) {
            // Target is the stage - start hats.
            const newName = target.sprite.costumes[target.currentCostume].name;
            return this.runtime.startHats('event_whenbackdropswitchesto', {
                BACKDROP: newName
            });
        }
        return [];
    }

    switchCostume (args, util) {
        this._setCostumeOrBackdrop(util.target, args.COSTUME);
    }

    nextCostume (args, util) {
        this._setCostumeOrBackdrop(
            util.target, util.target.currentCostume + 1, true
        );
    }

    switchBackdrop (args) {
        this._setCostumeOrBackdrop(this.runtime.getTargetForStage(), args.BACKDROP);
    }

    switchBackdropAndWait (args, util) {
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
        const instance = this;
        const waiting = util.stackFrame.startedThreads.some(thread => instance.runtime.isActiveThread(thread));
        if (waiting) {
            util.yield();
        }
    }

    nextBackdrop () {
        const stage = this.runtime.getTargetForStage();
        this._setCostumeOrBackdrop(
            stage, stage.currentCostume + 1, true
        );
    }

    changeEffect (args, util) {
        const effect = Cast.toString(args.EFFECT).toLowerCase();
        const change = Cast.toNumber(args.CHANGE);
        if (!util.target.effects.hasOwnProperty(effect)) return;
        const newValue = change + util.target.effects[effect];
        util.target.setEffect(effect, newValue);
    }

    setEffect (args, util) {
        const effect = Cast.toString(args.EFFECT).toLowerCase();
        const value = Cast.toNumber(args.VALUE);
        util.target.setEffect(effect, value);
    }

    clearEffects (args, util) {
        util.target.clearEffects();
    }

    changeSize (args, util) {
        const change = Cast.toNumber(args.CHANGE);
        util.target.setSize(util.target.size + change);
    }

    setSize (args, util) {
        const size = Cast.toNumber(args.SIZE);
        util.target.setSize(size);
    }

    goToFront (args, util) {
        util.target.goToFront();
    }

    goBackLayers (args, util) {
        util.target.goBackLayers(args.NUM);
    }

    getSize (args, util) {
        return Math.round(util.target.size);
    }

    getBackdropIndex () {
        const stage = this.runtime.getTargetForStage();
        return stage.currentCostume + 1;
    }

    getBackdropName () {
        const stage = this.runtime.getTargetForStage();
        return stage.sprite.costumes[stage.currentCostume].name;
    }

    getCostumeIndex (args, util) {
        return util.target.currentCostume + 1;
    }
}

module.exports = Scratch3LooksBlocks;
