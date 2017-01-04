var MathUtil = require('../util/math-util');
var Cast = require('../util/cast');
var Promise = require('promise');

var Scratch3SoundBlocks = function (runtime) {
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
Scratch3SoundBlocks.prototype.getPrimitives = function () {
    return {
        sound_play: this.playSound,
        sound_playuntildone: this.playSoundAndWait,
        sound_stopallsounds: this.stopAllSounds,
        sound_playnoteforbeats: this.playNoteForBeats,
        sound_playdrumforbeats: this.playDrumForBeats,
        sound_setinstrumentto: this.setInstrument,
        sound_seteffectto: this.setEffect,
        sound_changeeffectby: this.changeEffect,
        sound_cleareffects: this.clearEffects,
        sound_sounds_menu: this.soundsMenu,
        sound_beats_menu: this.beatsMenu,
        sound_effects_menu: this.effectsMenu,
        sound_setvolumeto: this.setVolume,
        sound_changevolumeby: this.changeVolume,
        sound_sound_settempotobpm: this.setTempo,
        sound_changetempoby: this.changeTempo
    };
};

Scratch3SoundBlocks.prototype.playSound = function (args, util) {
    var index = this._getSoundIndex(args.SOUND_MENU, util);
    util.target.audioEngine.playSound(index);
};

Scratch3SoundBlocks.prototype.playSoundAndWait = function (args, util) {
    var index = this._getSoundIndex(args.SOUND_MENU, util);
    return util.target.audioEngine.playSound(index);
};

Scratch3SoundBlocks.prototype._getSoundIndex = function (soundName, util) {
    if (util.target.sprite.sounds.length === 0) {
        return 0;
    }
    var index;

    if (Number(soundName)) {
        soundName = Number(soundName);
    }
    if (typeof soundName === 'number') {
        var len = util.target.sprite.sounds.length;
        index = MathUtil.wrapClamp(soundName, 1, len) - 1;
    } else {
        index = util.target.getSoundIndexByName(soundName);
        if (index === -1) {
            index = 0;
        }
    }
    return index;
};

Scratch3SoundBlocks.prototype.stopAllSounds = function (args, util) {
    util.target.audioEngine.stopAllSounds();
};

Scratch3SoundBlocks.prototype.playNoteForBeats = function (args, util) {
    util.target.audioEngine.playNoteForBeats(args.NOTE, args.BEATS);
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, (1000 * args.BEATS));
    });
};

Scratch3SoundBlocks.prototype.playDrumForBeats = function (args, util) {
    util.target.audioEngine.playDrumForBeats(args.DRUM, args.BEATS);
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, (1000 * args.BEATS));
    });
};

Scratch3SoundBlocks.prototype.setInstrument = function (args, util) {
    var instNum = Cast.toNumber(args.INSTRUMENT);
    return util.target.audioEngine.setInstrument(instNum);
};

Scratch3SoundBlocks.prototype.setEffect = function (args, util) {
    var value = Cast.toNumber(args.VALUE);
    util.target.audioEngine.setEffect(args.EFFECT, value);
};

Scratch3SoundBlocks.prototype.changeEffect = function (args, util) {
    var value = Cast.toNumber(args.VALUE);
    util.target.audioEngine.changeEffect(args.EFFECT, value);
};

Scratch3SoundBlocks.prototype.clearEffects = function (args, util) {
    util.target.audioEngine.clearEffects();
};

Scratch3SoundBlocks.prototype.setVolume = function (args, util) {
    var value = Cast.toNumber(args.VOLUME);
    util.target.audioEngine.setVolume(value);
};

Scratch3SoundBlocks.prototype.changeVolume = function (args, util) {
    var value = Cast.toNumber(args.VOLUME);
    util.target.audioEngine.changeVolume(value);
};

Scratch3SoundBlocks.prototype.setTempo = function (args, util) {
    var value = Cast.toNumber(args.TEMPO);
    util.target.audioEngine.setTempo(value);
};

Scratch3SoundBlocks.prototype.changeTempo = function (args, util) {
    var value = Cast.toNumber(args.TEMPO);
    util.target.audioEngine.changeTempo(value);
};

Scratch3SoundBlocks.prototype.soundsMenu = function (args) {
    return args.SOUND_MENU;
};

Scratch3SoundBlocks.prototype.beatsMenu = function (args) {
    return args.BEATS;
};

Scratch3SoundBlocks.prototype.effectsMenu = function (args) {
    return args.EFFECT;
};

module.exports = Scratch3SoundBlocks;
