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
        'sound_playnoteforbeats': this.playNote,
        'sound_setkey' : this.setKey,
        'sound_scales_menu' : this.scalesMenu,
        'sound_roots_menu' : this.rootsMenu,
        'sound_beats_menu' : this.beatsMenu,
    };
};

Scratch3SoundBlocks.prototype.playSound = function (args, util) {
	self.postMessage({method: 'beep'});
};

Scratch3SoundBlocks.prototype.playNote = function (args, util) {
	self.postMessage({method: 'playnote', note:args.NOTE, beats:args.BEATS});
	return new Promise(function(resolve) {
        setTimeout(function() {
            resolve();
        }, 1000 * args.BEATS);
    });
};

Scratch3SoundBlocks.prototype.setKey = function (args, util) {
	self.postMessage({method: 'setkey', root:args.ROOT, scale:args.SCALE});
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

module.exports = Scratch3SoundBlocks;
