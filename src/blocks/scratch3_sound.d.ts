export = Scratch3SoundBlocks;
declare class Scratch3SoundBlocks {
    /**
     * The key to load & store a target's sound-related state.
     * @type {string}
     */
    static get STATE_KEY(): string;
    /**
     * The default sound-related state, to be used when a target has no existing sound state.
     * @type {SoundState}
     */
    static get DEFAULT_SOUND_STATE(): SoundState;
    /**
     * The minimum and maximum MIDI note numbers, for clamping the input to play note.
     * @type {{min: number, max: number}}
     */
    static get MIDI_NOTE_RANGE(): {
        min: number;
        max: number;
    };
    /**
     * The minimum and maximum beat values, for clamping the duration of play note, play drum and rest.
     * 100 beats at the default tempo of 60bpm is 100 seconds.
     * @type {{min: number, max: number}}
     */
    static get BEAT_RANGE(): {
        min: number;
        max: number;
    };
    /** The minimum and maximum tempo values, in bpm.
     * @type {{min: number, max: number}}
     */
    static get TEMPO_RANGE(): {
        min: number;
        max: number;
    };
    /** The minimum and maximum values for each sound effect.
     * @type {{effect:{min: number, max: number}}}
     */
    static get EFFECT_RANGE(): {
        effect: {
            min: number;
            max: number;
        };
    };
    constructor(runtime: any);
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    runtime: Runtime;
    waitingSounds: {};
    stopAllSounds(): void;
    _stopWaitingSoundsForTarget(target: any): void;
    _clearEffectsForAllTargets(): void;
    /**
     * When a Target is cloned, clone the sound state.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     * @private
     */
    private _onTargetCreated;
    /**
     * @param {Target} target - collect sound state for this target.
     * @returns {SoundState} the mutable sound state associated with that target. This will be created if necessary.
     * @private
     */
    private _getSoundState;
    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives(): object<string, Function>;
    getMonitored(): {
        sound_volume: {
            isSpriteSpecific: boolean;
            getId: (targetId: any) => string;
        };
    };
    playSound(args: any, util: any): void;
    playSoundAndWait(args: any, util: any): any;
    _playSound(args: any, util: any, storeWaiting: any): any;
    _addWaitingSound(targetId: any, soundId: any): void;
    _removeWaitingSound(targetId: any, soundId: any): void;
    _getSoundIndex(soundName: any, util: any): number;
    getSoundIndexByName(soundName: any, util: any): number;
    _stopAllSoundsForTarget(target: any): void;
    setEffect(args: any, util: any): Promise<void>;
    changeEffect(args: any, util: any): Promise<void>;
    _updateEffect(args: any, util: any, change: any): Promise<void>;
    _syncEffectsForTarget(target: any): void;
    clearEffects(args: any, util: any): void;
    _clearEffectsForTarget(target: any): void;
    setVolume(args: any, util: any): Promise<void>;
    changeVolume(args: any, util: any): Promise<void>;
    _updateVolume(volume: any, util: any): Promise<void>;
    getVolume(args: any, util: any): any;
    soundsMenu(args: any): any;
    beatsMenu(args: any): any;
    effectsMenu(args: any): any;
}
