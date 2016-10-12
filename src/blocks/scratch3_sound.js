var Cast = require('../util/cast');
var MathUtil = require('../util/math-util');
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
        'sound_seteffectto' : this.setEffect,
        'sound_changeeffectby' : this.changeEffect,
        'sound_cleareffects' : this.clearEffects,
        'sound_sounds_menu' : this.soundsMenu,
        'sound_beats_menu' : this.beatsMenu,
        'sound_effects_menu' : this.effectsMenu,
    };
};

Scratch3SoundBlocks.prototype.playSound = function (args, util) {
    var url = this._getSoundUrl(args.SOUND_MENU, util);
    util.target.audioEngine.playSoundFromUrl(url);
};

Scratch3SoundBlocks.prototype._getSoundUrl = function (soundName, util) {
    if (util.target.sprite.sounds.length == 0) {
        return '';
    }
    var index;
    if (typeof soundName === 'number') {
        index = MathUtil.wrapClamp(soundName,0,util.target.sprite.sounds.length-1);
    } else {
        index = util.target.getSoundIndexByName(soundName);
        if (index == -1) {
            return '';
        }
    }
    return util.target.sprite.sounds[index].fileUrl;
};


Scratch3SoundBlocks.prototype.playSoundAndWait = function (args, util) {
    var url = this._getSoundUrl(args.SOUND_MENU, util);
    util.target.audioEngine.playSoundFromUrl(url);

    var duration = util.target.audioEngine.getSoundDuration(url); 

    return new Promise(function(resolve) {
            setTimeout(function() {
                resolve();
            }, 1000*duration);
        });
};

Scratch3SoundBlocks.prototype.stopAllSounds = function (args, util) {
    util.target.audioEngine.stopAllSounds();
};

Scratch3SoundBlocks.prototype.playNoteForBeats = function (args, util) {
    util.target.audioEngine.playNoteForBeats(args.NOTE, args.BEATS);
    return new Promise(function(resolve) {
            setTimeout(function() {
                resolve();
            }, (1000 * args.BEATS) );
        });
};

Scratch3SoundBlocks.prototype.playDrumForBeats = function (args, util) {
    util.target.audioEngine.playDrumForBeats(args.DRUMTYPE, args.BEATS);
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, (1000 * args.BEATS) );
    });
};

Scratch3SoundBlocks.prototype.setEffect = function (args, util) {
    util.target.audioEngine.setEffect(args.EFFECT, args.VALUE);
};

Scratch3SoundBlocks.prototype.changeEffect = function (args, util) {
    util.target.audioEngine.changeEffect(args.EFFECT, args.VALUE);
};

Scratch3SoundBlocks.prototype.clearEffects = function (args, util) {
    util.target.audioEngine.clearEffects();
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
