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
        'sound_playwithpitch': this.playSoundWithPitch,
        'sound_stopallsounds': this.stopAllSounds,
        'sound_playnote': this.playNote,
        'sound_playnoteforbeats': this.playNoteForBeats,
        'sound_scalenotetomidinote': this.scaleNoteToMidiNote,
        'sound_playdrum': this.playDrum,
        'sound_playdrumforbeats': this.playDrumForBeats,
        'sound_setkey' : this.setKey,
        'sound_seteffectto' : this.setEffect,
        'sound_changeeffectby' : this.changeEffect,
        'sound_cleareffects' : this.clearEffects,
        'sound_scales_menu' : this.scalesMenu,
        'sound_sounds_menu' : this.soundsMenu,
        'sound_roots_menu' : this.rootsMenu,
        'sound_beats_menu' : this.beatsMenu,
        'sound_effects_menu' : this.effectsMenu,
    };
};

Scratch3SoundBlocks.prototype.playSound = function (args, util) {
	// self.postMessage({method: 'playsound', soundnum:args.SOUND_NUM});
    util.target.playSound(args.SOUND_NUM);
};

Scratch3SoundBlocks.prototype.playSoundWithPitch = function (args, util) {
    self.postMessage({method: 'playsoundwithpitch', soundnum:args.SOUND_NUM, pitch:args.PITCH});
};

Scratch3SoundBlocks.prototype.stopAllSounds = function (args, util) {
    self.postMessage({method: 'stopallsounds'});
};

Scratch3SoundBlocks.prototype.playNoteForBeats = function (args, util) {
	self.postMessage({method: 'playnoteforbeats', note:args.NOTE, beats:args.BEATS});
	return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, (1000 * args.BEATS) );
    });
};

Scratch3SoundBlocks.prototype.playNote = function (args, util) {
    self.postMessage({method: 'playnote', note:args.NOTE});
};

Scratch3SoundBlocks.prototype.scaleNoteToMidiNote = function (args, util) {

    var root = parseInt(args.ROOT) + 60;

    var scales = {
        'MAJOR' : [0,2,4,5,7,9,11],
        'MINOR' : [0,2,3,5,7,8,10],
        'PENTATONIC': [0, 2, 4, 7, 9],
        'CHROMATIC' : [0,1,2,3,4,5,6,7,8,9,10,11],
    };

    var scale = scales[args.SCALE];

    var scaleNote = args.NOTE;
    
    var scaleIndex = (Math.round(scaleNote) - 1) % scale.length;
    if (scaleIndex < 0) {
        scaleIndex += scale.length;
    }
    var octave = Math.floor((scaleNote - 1) / scale.length);
    var midiNote = root + (octave * 12) + scale[scaleIndex]; 

    return midiNote;
};

Scratch3SoundBlocks.prototype.playDrumForBeats = function (args, util) {
    self.postMessage({method: 'playdrumforbeats', drum:args.DRUMTYPE, beats:args.BEATS});
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, (1000 * args.BEATS) );
    });
};

Scratch3SoundBlocks.prototype.playDrum = function (args, util) {
    self.postMessage({method: 'playdrum', drum:args.DRUMTYPE});
};

Scratch3SoundBlocks.prototype.setKey = function (args, util) {
	self.postMessage({method: 'setkey', root:args.ROOT, scale:args.SCALE});
};

Scratch3SoundBlocks.prototype.setEffect = function (args, util) {
    self.postMessage({method: 'seteffect', effect:args.EFFECT, value:args.VALUE});
};

Scratch3SoundBlocks.prototype.changeEffect = function (args, util) {
    self.postMessage({method: 'changeeffect', effect:args.EFFECT, value:args.VALUE});
};

Scratch3SoundBlocks.prototype.clearEffects = function (args, util) {
    self.postMessage({method: 'cleareffects'});
};

Scratch3SoundBlocks.prototype.soundsMenu = function (args, util) {
    return args.SOUND_MENU;
};

Scratch3SoundBlocks.prototype.scalesMenu = function (args, util) {
	return args.SCALE;
};

Scratch3SoundBlocks.prototype.rootsMenu = function (args, util) {
	return args.ROOT;
};

Scratch3SoundBlocks.prototype.beatsMenu = function (args, util) {
	return args.BEATS;
};

Scratch3SoundBlocks.prototype.effectsMenu = function (args, util) {
    return args.EFFECT;
};

module.exports = Scratch3SoundBlocks;
