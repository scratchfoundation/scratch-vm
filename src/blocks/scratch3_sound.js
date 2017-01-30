var MathUtil = require('../util/math-util');
var Cast = require('../util/cast');

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
    util.target.playSound(index);
};

Scratch3SoundBlocks.prototype.playSoundAndWait = function (args, util) {
    var index = this._getSoundIndex(args.SOUND_MENU, util);
    return util.target.playSound(index);
};

Scratch3SoundBlocks.prototype._getSoundIndex = function (soundName, util) {
    if (util.target.sprite.sounds.length === 0) {
        return 0;
    }
    var index;

    if (Number(soundName)) {
        soundName = Number(soundName);
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
    util.target.audioPlayer.stopAllSounds();
};

Scratch3SoundBlocks.prototype.playNoteForBeats = function (args, util) {
    var note = Cast.toNumber(args.NOTE);
    var beats = Cast.toNumber(args.BEATS);
    return util.target.playNoteForBeats(note, beats);
};

Scratch3SoundBlocks.prototype.playDrumForBeats = function (args, util) {
    var drum = Cast.toNumber(args.DRUM);
    drum -= 1; // drums are one-indexed
    drum = MathUtil.wrapClamp(drum, 0, this.runtime.audioEngine.numDrums);
    var beats = Cast.toNumber(args.BEATS);
    return util.target.audioPlayer.playDrumForBeats(drum, beats);
};

Scratch3SoundBlocks.prototype.restForBeats = function (args, util) {
    var beats = Cast.toNumber(args.BEATS);
    return util.target.audioPlayer.waitForBeats(beats);
};

Scratch3SoundBlocks.prototype.setInstrument = function (args, util) {
    var instNum = Cast.toNumber(args.INSTRUMENT);
    instNum -= 1; // instruments are one-indexed
    instNum = MathUtil.wrapClamp(instNum, 0, this.runtime.audioEngine.numInstruments);
    util.target.setInstrument(instNum);
    return this.runtime.audioEngine.instrumentPlayer.loadInstrument(instNum);
};

Scratch3SoundBlocks.prototype.setEffect = function (args, util) {
    var effect = Cast.toString(args.EFFECT).toLowerCase();
    var value = Cast.toNumber(args.VALUE);
    util.target.setAudioEffect(effect, value);
};

Scratch3SoundBlocks.prototype.changeEffect = function (args, util) {
    var effect = Cast.toString(args.EFFECT).toLowerCase();
    var value = Cast.toNumber(args.VALUE);
    if (!util.target.audioEffects.hasOwnProperty(effect)) return;
    var newValue = value + util.target.audioEffects[effect];
    util.target.setAudioEffect(effect, newValue);
};

Scratch3SoundBlocks.prototype.clearEffects = function (args, util) {
    util.target.audioPlayer.clearEffects();
};

Scratch3SoundBlocks.prototype.setVolume = function (args, util) {
    var value = Cast.toNumber(args.VOLUME);
    util.target.audioPlayer.setVolume(value);
};

Scratch3SoundBlocks.prototype.changeVolume = function (args, util) {
    var value = Cast.toNumber(args.VOLUME);
    util.target.audioPlayer.changeVolume(value);
};

Scratch3SoundBlocks.prototype.getVolume = function (args, util) {
    return util.target.audioPlayer.currentVolume;
};

Scratch3SoundBlocks.prototype.setTempo = function (args) {
    var value = Cast.toNumber(args.TEMPO);
    this.runtime.audioEngine.setTempo(value);
};

Scratch3SoundBlocks.prototype.changeTempo = function (args) {
    var value = Cast.toNumber(args.TEMPO);
    this.runtime.audioEngine.changeTempo(value);
};

Scratch3SoundBlocks.prototype.getTempo = function () {
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
