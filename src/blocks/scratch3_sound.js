var MathUtil = require('../util/math-util');
var Cast = require('../util/cast');
var Promise = require('promise');

function Scratch3SoundBlocks(runtime) {
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
Scratch3SoundBlocks.prototype.getPrimitives = function() {
    return {
        'sound_play': this.playSound,
        'sound_playuntildone': this.playSoundAndWait,
        'sound_stopallsounds': this.stopAllSounds,
        'sound_playnoteforbeats': this.playNoteForBeats,
        'sound_playdrumforbeats': this.playDrumForBeats,
        'sound_setinstrumentto': this.setInstrument,
        'sound_seteffectto' : this.setEffect,
        'sound_changeeffectby' : this.changeEffect,
        'sound_cleareffects' : this.clearEffects,
        'sound_sounds_menu' : this.soundsMenu,
        'sound_effects_menu' : this.effectsMenu,
        'sound_setvolumeto' : this.setVolume,
        'sound_changevolumeby' : this.changeVolume,
        'sound_sound_settempotobpm' : this.setTempo,
        'sound_changetempoby' : this.changeTempo
    };
};

Scratch3SoundBlocks.prototype.playSound = function (args, util) {
    var index = this._getSoundIndex(args.SOUND_MENU, util);
    window.audio.playSound(index);
};

Scratch3SoundBlocks.prototype.playSoundAndWait = function (args, util) {
    var index = this._getSoundIndex(args.SOUND_MENU, util);
    return window.audio.playSound(index);
};

Scratch3SoundBlocks.prototype._getSoundIndex = function (soundName, util) {
    var index;
    index = Number(soundName);
    var numSounds = window.audio.soundPlayers.length;
    index = MathUtil.wrapClamp(index, 0, numSounds - 1);

    return index;
};

Scratch3SoundBlocks.prototype.stopAllSounds = function (args, util) {
    window.audio.stopAllSounds();
};

Scratch3SoundBlocks.prototype.playNoteForBeats = function (args, util) {
    window.audio.playNoteForBeats(args.NOTE, args.BEATS);

    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, (1000 * args.BEATS) );
    });
};

Scratch3SoundBlocks.prototype.playDrumForBeats = function (args, util) {
    window.audio.playDrumForBeats(args.DRUMTYPE, args.BEATS);
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, (1000 * args.BEATS) );
    });
};

Scratch3SoundBlocks.prototype.setInstrument = function (args, util) {
    var instNum = Cast.toNumber(args.INSTRUMENT);
    var numInstruments = window.audio.instrumentNames.length;
    instNum = MathUtil.wrapClamp(instNum, 0, numInstruments - 1);
    return window.audio.setInstrument(instNum);
};

Scratch3SoundBlocks.prototype._numberToEffectName = function (val, util) {
    if (Number.isInteger(val)) {
        var effectNames = window.audio.effectNames;
        var effectNum = MathUtil.wrapClamp(val, 0, effectNames.length-1);
        return effectNames[effectNum];
    } else {
        return val;
    }
};

Scratch3SoundBlocks.prototype.setEffect = function (args, util) {
    args.EFFECT = this._numberToEffectName(args.EFFECT, util);
    var value = Cast.toNumber(args.VALUE);
    window.audio.setEffect(args.EFFECT, value);
};

Scratch3SoundBlocks.prototype.changeEffect = function (args, util) {
    args.EFFECT = this._numberToEffectName(args.EFFECT, util);
    var value = Cast.toNumber(args.VALUE);
    window.audio.changeEffect(args.EFFECT, value);
};

Scratch3SoundBlocks.prototype.clearEffects = function (args, util) {
    window.audio.clearEffects();
};

Scratch3SoundBlocks.prototype.setVolume = function (args, util) {
    var value = Cast.toNumber(args.VOLUME);
    window.audio.setVolume(value);
};

Scratch3SoundBlocks.prototype.changeVolume = function (args, util) {
    var value = Cast.toNumber(args.VOLUME);
    window.audio.changeVolume(value);
};

Scratch3SoundBlocks.prototype.setTempo = function (args, util) {
    var value = Cast.toNumber(args.TEMPO);
    window.audio.setTempo(value);
};

Scratch3SoundBlocks.prototype.changeTempo = function (args, util) {
    var value = Cast.toNumber(args.TEMPO);
    window.audio.changeTempo(value);
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
