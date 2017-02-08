var MathUtil = require('../util/math-util');
var Cast = require('../util/cast');
var Clone = require('../util/clone');

var Scratch3SoundBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;
};

/**
 * The key to load & store a target's sound-related state.
 * @type {string}
 */
Scratch3SoundBlocks.STATE_KEY = 'Scratch.sound';

/**
 * The default sound-related state, to be used when a target has no existing sound state.
 * @type {SoundState}
 */
Scratch3SoundBlocks.DEFAULT_SOUND_STATE = {
    volume: 100,
    currentInstrument: 0,
    effects: {
        pitch: 0,
        pan: 0,
        echo: 0,
        reverb: 0,
        fuzz: 0,
        robot: 0
    }
};

/**
 * @param {Target} target - collect sound state for this target.
 * @returns {SoundState} the mutable sound state associated with that target. This will be created if necessary.
 * @private
 */
Scratch3SoundBlocks.prototype._getSoundState = function (target) {
    var soundState = target.getCustomState(Scratch3SoundBlocks.STATE_KEY);
    if (!soundState) {
        soundState = Clone.simple(Scratch3SoundBlocks.DEFAULT_SOUND_STATE);
        target.setCustomState(Scratch3SoundBlocks.STATE_KEY, soundState);
    }
    return soundState;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3SoundBlocks.prototype.getPrimitives = function () {
    return {
        sound_play: this.playSound,
        sound_playuntildone: this.playSoundAndWait,
        sound_stopallsounds: this.stopAllSounds,
        sound_playnoteforbeats: this.playNoteForBeats,
        sound_playdrumforbeats: this.playDrumForBeats,
        sound_restforbeats: this.restForBeats,
        sound_setinstrumentto: this.setInstrument,
        sound_seteffectto: this.setEffect,
        sound_changeeffectby: this.changeEffect,
        sound_cleareffects: this.clearEffects,
        sound_sounds_menu: this.soundsMenu,
        sound_beats_menu: this.beatsMenu,
        sound_effects_menu: this.effectsMenu,
        sound_setvolumeto: this.setVolume,
        sound_changevolumeby: this.changeVolume,
        sound_volume: this.getVolume,
        sound_settempotobpm: this.setTempo,
        sound_changetempoby: this.changeTempo,
        sound_tempo: this.getTempo
    };
};

Scratch3SoundBlocks.prototype.playSound = function (args, util) {
    var index = this._getSoundIndex(args.SOUND_MENU, util);
    if (index >= 0) {
        var md5 = util.target.sprite.sounds[index].md5;
        if (util.target.audioPlayer === null) return;
        util.target.audioPlayer.playSound(md5);
    }
};

Scratch3SoundBlocks.prototype.playSoundAndWait = function (args, util) {
    var index = this._getSoundIndex(args.SOUND_MENU, util);
    if (index >= 0) {
        var md5 = util.target.sprite.sounds[index].md5;
        if (util.target.audioPlayer === null) return;
        return util.target.audioPlayer.playSound(md5);
    }
};

Scratch3SoundBlocks.prototype._getSoundIndex = function (soundName, util) {
    // if the sprite has no sounds, return -1
    var len = util.target.sprite.sounds.length;
    if (len === 0) {
        return -1;
    }

    var index;

    // try to convert to a number and use that as an index
    var num = parseInt(soundName, 10);
    if (!isNaN(num)) {
        index = MathUtil.wrapClamp(num, 0, len - 1);
        return index;
    }

    // return the index for the sound of that name
    index = this.getSoundIndexByName(soundName, util);
    return index;
};

Scratch3SoundBlocks.prototype.getSoundIndexByName = function (soundName, util) {
    var sounds = util.target.sprite.sounds;
    for (var i = 0; i < sounds.length; i++) {
        if (sounds[i].name === soundName) {
            return i;
        }
    }
    // if there is no sound by that name, return -1
    return -1;
};

Scratch3SoundBlocks.prototype.stopAllSounds = function (args, util) {
    if (util.target.audioPlayer === null) return;
    util.target.audioPlayer.stopAllSounds();
};

Scratch3SoundBlocks.prototype.playNoteForBeats = function (args, util) {
    var note = Cast.toNumber(args.NOTE);
    var beats = Cast.toNumber(args.BEATS);
    var soundState = this._getSoundState(util.target);
    var inst = soundState.currentInstrument;
    if (typeof this.runtime.audioEngine === 'undefined') return;
    return this.runtime.audioEngine.playNoteForBeatsWithInst(note, beats, inst);
};

Scratch3SoundBlocks.prototype.playDrumForBeats = function (args, util) {
    var drum = Cast.toNumber(args.DRUM);
    drum -= 1; // drums are one-indexed
    if (typeof this.runtime.audioEngine === 'undefined') return;
    drum = MathUtil.wrapClamp(drum, 0, this.runtime.audioEngine.numDrums);
    var beats = Cast.toNumber(args.BEATS);
    if (util.target.audioPlayer === null) return;
    return util.target.audioPlayer.playDrumForBeats(drum, beats);
};

Scratch3SoundBlocks.prototype.restForBeats = function (args) {
    var beats = Cast.toNumber(args.BEATS);
    if (typeof this.runtime.audioEngine === 'undefined') return;
    return this.runtime.audioEngine.waitForBeats(beats);
};

Scratch3SoundBlocks.prototype.setInstrument = function (args, util) {
    var soundState = this._getSoundState(util.target);
    var instNum = Cast.toNumber(args.INSTRUMENT);
    instNum -= 1; // instruments are one-indexed
    if (typeof this.runtime.audioEngine === 'undefined') return;
    instNum = MathUtil.wrapClamp(instNum, 0, this.runtime.audioEngine.numInstruments);
    soundState.currentInstrument = instNum;
    return this.runtime.audioEngine.instrumentPlayer.loadInstrument(soundState.currentInstrument);
};

Scratch3SoundBlocks.prototype.setEffect = function (args, util) {
    var effect = Cast.toString(args.EFFECT).toLowerCase();
    var value = Cast.toNumber(args.VALUE);

    var soundState = this._getSoundState(util.target);
    if (!soundState.effects.hasOwnProperty(effect)) return;

    soundState.effects[effect] = value;
    if (util.target.audioPlayer === null) return;
    util.target.audioPlayer.setEffect(effect, soundState.effects[effect]);
};

Scratch3SoundBlocks.prototype.changeEffect = function (args, util) {
    var effect = Cast.toString(args.EFFECT).toLowerCase();
    var value = Cast.toNumber(args.VALUE);

    var soundState = this._getSoundState(util.target);
    if (!soundState.effects.hasOwnProperty(effect)) return;

    soundState.effects[effect] += value;
    if (util.target.audioPlayer === null) return;
    util.target.audioPlayer.setEffect(effect, soundState.effects[effect]);
};

Scratch3SoundBlocks.prototype.clearEffects = function (args, util) {
    var soundState = this._getSoundState(util.target);
    for (var effect in soundState.effects) {
        soundState.effects[effect] = 0;
    }
    if (util.target.audioPlayer === null) return;
    util.target.audioPlayer.clearEffects();
};

Scratch3SoundBlocks.prototype.setVolume = function (args, util) {
    var volume = Cast.toNumber(args.VOLUME);
    this._updateVolume(volume, util);
};

Scratch3SoundBlocks.prototype.changeVolume = function (args, util) {
    var soundState = this._getSoundState(util.target);
    var volume = Cast.toNumber(args.VOLUME) + soundState.volume;
    this._updateVolume(volume, util);
};

Scratch3SoundBlocks.prototype._updateVolume = function (volume, util) {
    var soundState = this._getSoundState(util.target);
    volume = MathUtil.clamp(volume, 0, 100);
    soundState.volume = volume;
    if (util.target.audioPlayer === null) return;
    util.target.audioPlayer.setVolume(soundState.volume);
};

Scratch3SoundBlocks.prototype.getVolume = function (args, util) {
    var soundState = this._getSoundState(util.target);
    return soundState.volume;
};

Scratch3SoundBlocks.prototype.setTempo = function (args) {
    var value = Cast.toNumber(args.TEMPO);
    if (typeof this.runtime.audioEngine === 'undefined') return;
    this.runtime.audioEngine.setTempo(value);
};

Scratch3SoundBlocks.prototype.changeTempo = function (args) {
    var value = Cast.toNumber(args.TEMPO);
    if (typeof this.runtime.audioEngine === 'undefined') return;
    this.runtime.audioEngine.changeTempo(value);
};

Scratch3SoundBlocks.prototype.getTempo = function () {
    if (typeof this.runtime.audioEngine === 'undefined') return;
    return this.runtime.audioEngine.currentTempo;
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
