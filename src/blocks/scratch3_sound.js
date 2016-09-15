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
        'sound_playsound': this.playSound,
        // 'sound_playsoundandwait': this.playSoundAndWait,
        'sound_stopallsounds': this.stopAllSounds,
        'sound_playnoteforbeats': this.playNoteForBeats,
        'sound_playdrumforbeats': this.playDrumForBeats,
        'sound_seteffectto' : this.setEffect,
        'sound_changeeffectby' : this.changeEffect,
        'sound_cleareffects' : this.clearEffects,
        'sound_sounds_menu' : this.soundsMenu,
        'sound_beats_menu' : this.beatsMenu,
        'sound_effects_menu' : this.effectsMenu,
    };
};

Scratch3SoundBlocks.prototype.playSound = function (args, util) {
    util.target.playSound(args.SOUND_NUM);
};

Scratch3SoundBlocks.prototype.stopAllSounds = function (args, util) {
    util.target.stopAllSounds();
};

Scratch3SoundBlocks.prototype.playNoteForBeats = function (args, util) {
    util.target.playNoteForBeats(args.NOTE, args.BEATS);
    return new Promise(function(resolve) {
            setTimeout(function() {
                resolve();
            }, (1000 * args.BEATS) );
        });
};

Scratch3SoundBlocks.prototype.playDrumForBeats = function (args, util) {
    util.target.playDrumForBeats(args.DRUMTYPE, args.BEATS);
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, (1000 * args.BEATS) );
    });
};

Scratch3SoundBlocks.prototype.setEffect = function (args, util) {
};

Scratch3SoundBlocks.prototype.changeEffect = function (args, util) {
};

Scratch3SoundBlocks.prototype.clearEffects = function (args, util) {
};

Scratch3SoundBlocks.prototype.soundsMenu = function (args, util) {
    return args.SOUND_MENU;
};

Scratch3SoundBlocks.prototype.beatsMenu = function (args, util) {
	return args.BEATS;
};

Scratch3SoundBlocks.prototype.effectsMenu = function (args, util) {
    return args.EFFECT;
};

module.exports = Scratch3SoundBlocks;
