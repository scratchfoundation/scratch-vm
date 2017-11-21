const MathUtil = require('../util/math-util');
const Cast = require('../util/cast');
const Clone = require('../util/clone');

class Scratch3SoundBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * The key to load & store a target's sound-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.sound';
    }

    /**
     * The default sound-related state, to be used when a target has no existing sound state.
     * @type {SoundState}
     */
    static get DEFAULT_SOUND_STATE () {
        return {
            volume: 100,
            currentInstrument: 0,
            effects: {
                pitch: 0,
                pan: 0
            }
        };
    }

    /**
     * The minimum and maximum MIDI note numbers, for clamping the input to play note.
     * @type {{min: number, max: number}}
     */
    static get MIDI_NOTE_RANGE () {
        return {min: 36, max: 96}; // C2 to C7
    }

    /**
     * The minimum and maximum beat values, for clamping the duration of play note, play drum and rest.
     * 100 beats at the default tempo of 60bpm is 100 seconds.
     * @type {{min: number, max: number}}
     */
    static get BEAT_RANGE () {
        return {min: 0, max: 100};
    }

    /** The minimum and maximum tempo values, in bpm.
     * @type {{min: number, max: number}}
     */
    static get TEMPO_RANGE () {
        return {min: 20, max: 500};
    }

    /** The minimum and maximum values for each sound effect.
     * @type {{effect:{min: number, max: number}}}
     */
    static get EFFECT_RANGE () {
        return {
            pitch: {min: -600, max: 600}, // -5 to 5 octaves
            pan: {min: -100, max: 100} // 100% left to 100% right
        };
    }

    /**
     * @param {Target} target - collect sound state for this target.
     * @returns {SoundState} the mutable sound state associated with that target. This will be created if necessary.
     * @private
     */
    _getSoundState (target) {
        let soundState = target.getCustomState(Scratch3SoundBlocks.STATE_KEY);
        if (!soundState) {
            soundState = Clone.simple(Scratch3SoundBlocks.DEFAULT_SOUND_STATE);
            target.setCustomState(Scratch3SoundBlocks.STATE_KEY, soundState);
        }
        return soundState;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            sound_play: this.playSound,
            sound_playuntildone: this.playSoundAndWait,
            sound_stopallsounds: this.stopAllSounds,
            sound_seteffectto: this.setEffect,
            sound_changeeffectby: this.changeEffect,
            sound_cleareffects: this.clearEffects,
            sound_sounds_menu: this.soundsMenu,
            sound_beats_menu: this.beatsMenu,
            sound_effects_menu: this.effectsMenu,
            sound_setvolumeto: this.setVolume,
            sound_changevolumeby: this.changeVolume,
            sound_volume: this.getVolume
        };
    }

    getMonitored () {
        return {
            sound_volume: {}
        };
    }

    playSound (args, util) {
        const index = this._getSoundIndex(args.SOUND_MENU, util);
        if (index >= 0) {
            const soundId = util.target.sprite.sounds[index].soundId;
            if (util.target.audioPlayer === null) return;
            util.target.audioPlayer.playSound(soundId);
        }
    }

    playSoundAndWait (args, util) {
        const index = this._getSoundIndex(args.SOUND_MENU, util);
        if (index >= 0) {
            const soundId = util.target.sprite.sounds[index].soundId;
            if (util.target.audioPlayer === null) return;
            return util.target.audioPlayer.playSound(soundId);
        }
    }

    _getSoundIndex (soundName, util) {
        // if the sprite has no sounds, return -1
        const len = util.target.sprite.sounds.length;
        if (len === 0) {
            return -1;
        }

        // look up by name first
        const index = this.getSoundIndexByName(soundName, util);
        if (index !== -1) {
            return index;
        }

        // then try using the sound name as a 1-indexed index
        const oneIndexedIndex = parseInt(soundName, 10);
        if (!isNaN(oneIndexedIndex)) {
            return MathUtil.wrapClamp(oneIndexedIndex - 1, 0, len - 1);
        }

        // could not be found as a name or converted to index, return -1
        return -1;
    }

    getSoundIndexByName (soundName, util) {
        const sounds = util.target.sprite.sounds;
        for (let i = 0; i < sounds.length; i++) {
            if (sounds[i].name === soundName) {
                return i;
            }
        }
        // if there is no sound by that name, return -1
        return -1;
    }

    stopAllSounds (args, util) {
        if (util.target.audioPlayer === null) return;
        util.target.audioPlayer.stopAllSounds();
    }

    setEffect (args, util) {
        this._updateEffect(args, util, false);
    }

    changeEffect (args, util) {
        this._updateEffect(args, util, true);
    }

    _updateEffect (args, util, change) {
        const effect = Cast.toString(args.EFFECT).toLowerCase();
        const value = Cast.toNumber(args.VALUE);

        const soundState = this._getSoundState(util.target);
        if (!soundState.effects.hasOwnProperty(effect)) return;

        if (change) {
            soundState.effects[effect] += value;
        } else {
            soundState.effects[effect] = value;
        }

        const effectRange = Scratch3SoundBlocks.EFFECT_RANGE[effect];
        soundState.effects[effect] = MathUtil.clamp(soundState.effects[effect], effectRange.min, effectRange.max);

        if (util.target.audioPlayer === null) return;
        util.target.audioPlayer.setEffect(effect, soundState.effects[effect]);
    }

    clearEffects (args, util) {
        const soundState = this._getSoundState(util.target);
        for (const effect in soundState.effects) {
            if (!soundState.effects.hasOwnProperty(effect)) continue;
            soundState.effects[effect] = 0;
        }
        if (util.target.audioPlayer === null) return;
        util.target.audioPlayer.clearEffects();
    }

    setVolume (args, util) {
        const volume = Cast.toNumber(args.VOLUME);
        this._updateVolume(volume, util);
    }

    changeVolume (args, util) {
        const soundState = this._getSoundState(util.target);
        const volume = Cast.toNumber(args.VOLUME) + soundState.volume;
        this._updateVolume(volume, util);
    }

    _updateVolume (volume, util) {
        const soundState = this._getSoundState(util.target);
        volume = MathUtil.clamp(volume, 0, 100);
        soundState.volume = volume;
        if (util.target.audioPlayer === null) return;
        util.target.audioPlayer.setVolume(soundState.volume);
    }

    getVolume (args, util) {
        const soundState = this._getSoundState(util.target);
        return soundState.volume;
    }

    soundsMenu (args) {
        return args.SOUND_MENU;
    }

    beatsMenu (args) {
        return args.BEATS;
    }

    effectsMenu (args) {
        return args.EFFECT;
    }
}

module.exports = Scratch3SoundBlocks;
