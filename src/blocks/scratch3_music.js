const ArgumentType = require('../extension-support/argument-type');
const BlockType = require('../extension-support/block-type');
const Clone = require('../util/clone');
const Cast = require('../util/cast');
const MathUtil = require('../util/math-util');
const Timer = require('../util/timer');

/**
 * An array of drum names, used in the play drum block.
 * @type {string[]}
 */
const drumNames = [
    'Snare Drum',
    'Bass Drum',
    'Side Stick',
    'Crash Cymbal',
    'Open Hi-Hat',
    'Closed Hi-Hat',
    'Tambourine',
    'Hand Clap',
    'Claves',
    'Wood Block',
    'Cowbell',
    'Triangle',
    'Bongo',
    'Conga',
    'Cabasa',
    'Guiro',
    'Vibraslap',
    'Open Cuica'
];

/**
 * An array of instrument names, used in the set instrument block.
 * @type {string[]}
 */
const instrumentNames = [
    'Piano',
    'Electric Piano',
    'Organ',
    'Guitar',
    'Electric Guitar',
    'Bass',
    'Pizzicato',
    'Cello',
    'Trombone',
    'Clarinet',
    'Saxophone',
    'Flute',
    'Wooden Flute',
    'Bassoon',
    'Choir',
    'Vibraphone',
    'Music Box',
    'Steel Drum',
    'Marimba',
    'Synth Lead',
    'Synth Pad'
];

/**
 * Class for the music-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3MusicBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The current tempo in beats per minute. The tempo is a global property of the project,
         * not a property of each sprite, so it is not stored in the MusicState object.
         * @type {number}
         */
        this.tempo = 60;

        this.drumMenu = this._buildMenu(drumNames);
        this.instrumentMenu = this._buildMenu(instrumentNames);
    }

    /**
     * Build a menu using an array of strings.
     * Used for creating the drum and instrument menus.
     * @param  {string[]} names - An array of names.
     * @return {array} - An array of objects with text and value properties, for constructing a block menu.
     * @private
     */
    _buildMenu (names) {
        const menu = [];
        for (let i = 0; i < names.length; i++) {
            const entry = {};
            const num = i + 1; // Menu numbers are one-indexed
            entry.text = `(${num}) ${names[i]}`;
            entry.value = String(num);
            menu.push(entry);
        }
        return menu;
    }

    /**
     * The key to load & store a target's music-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.music';
    }

    /**
     * The default music-related state, to be used when a target has no existing music state.
     * @type {MusicState}
     */
    static get DEFAULT_MUSIC_STATE () {
        return {
            currentInstrument: 0
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

    /**
     * @param {Target} target - collect music state for this target.
     * @returns {MusicState} the mutable music state associated with that target. This will be created if necessary.
     * @private
     */
    _getMusicState (target) {
        let musicState = target.getCustomState(Scratch3MusicBlocks.STATE_KEY);
        if (!musicState) {
            musicState = Clone.simple(Scratch3MusicBlocks.DEFAULT_MUSIC_STATE);
            target.setCustomState(Scratch3MusicBlocks.STATE_KEY, musicState);
        }
        return musicState;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'music',
            name: 'Music',
            blocks: [
                {
                    opcode: 'playDrumForBeats',
                    blockType: BlockType.COMMAND,
                    text: 'play drum [DRUM] for [BEATS] beats',
                    arguments: {
                        DRUM: {
                            type: ArgumentType.NUMBER,
                            menu: 'drums',
                            defaultValue: 1
                        },
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        }
                    }
                },
                {
                    opcode: 'restForBeats',
                    blockType: BlockType.COMMAND,
                    text: 'rest for [BEATS] beats',
                    arguments: {
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        }
                    }
                },
                {
                    opcode: 'playNoteForBeats',
                    blockType: BlockType.COMMAND,
                    text: 'play note [NOTE] for [BEATS] beats',
                    arguments: {
                        NOTE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 60
                        },
                        BEATS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0.25
                        }
                    }
                },
                {
                    opcode: 'setInstrument',
                    blockType: BlockType.COMMAND,
                    text: 'set instrument to [INSTRUMENT]',
                    arguments: {
                        INSTRUMENT: {
                            type: ArgumentType.NUMBER,
                            menu: 'instruments',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'setTempo',
                    blockType: BlockType.COMMAND,
                    text: 'set tempo to [TEMPO]',
                    arguments: {
                        TEMPO: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 60
                        }
                    }
                },
                {
                    opcode: 'changeTempo',
                    blockType: BlockType.COMMAND,
                    text: 'change tempo by [TEMPO]',
                    arguments: {
                        TEMPO: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    }
                },
                {
                    opcode: 'getTempo',
                    text: 'tempo',
                    blockType: BlockType.REPORTER
                }
            ],
            menus: {
                drums: this.drumMenu,
                instruments: this.instrumentMenu
            }
        };
    }

    /**
     * Play a drum sound for some number of beats.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} DRUM - the number of the drum to play.
     * @property {number} BEATS - the duration in beats of the drum sound.
     */
    playDrumForBeats (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            let drum = Cast.toNumber(args.DRUM);
            drum -= 1; // drums are one-indexed
            if (typeof this.runtime.audioEngine === 'undefined') return;
            drum = MathUtil.wrapClamp(drum, 0, this.runtime.audioEngine.numDrums - 1);
            let beats = Cast.toNumber(args.BEATS);
            beats = this._clampBeats(beats);
            if (util.target.audioPlayer !== null) {
                util.target.audioPlayer.playDrumForBeats(drum, beats);
            }
            this._startStackTimer(util, this._beatsToSec(beats));
        } else {
            this._checkStackTimer(util);
        }
    }

    /**
     * Rest for some number of beats.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {number} BEATS - the duration in beats of the rest.
     */
    restForBeats (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            let beats = Cast.toNumber(args.BEATS);
            beats = this._clampBeats(beats);
            this._startStackTimer(util, this._beatsToSec(beats));
        } else {
            this._checkStackTimer(util);
        }
    }

    /**
     * Play a note using the current musical instrument for some number of beats.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {number} NOTE - the pitch of the note to play, interpreted as a MIDI note number.
     * @property {number} BEATS - the duration in beats of the note.
     */
    playNoteForBeats (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            let note = Cast.toNumber(args.NOTE);
            note = MathUtil.clamp(note,
                Scratch3MusicBlocks.MIDI_NOTE_RANGE.min, Scratch3MusicBlocks.MIDI_NOTE_RANGE.max);
            let beats = Cast.toNumber(args.BEATS);
            beats = this._clampBeats(beats);
            const musicState = this._getMusicState(util.target);
            const inst = musicState.currentInstrument;
            if (typeof this.runtime.audioEngine !== 'undefined') {
                this.runtime.audioEngine.playNoteForBeatsWithInstAndVol(note, beats, inst, 100);
            }
            this._startStackTimer(util, this._beatsToSec(beats));
        } else {
            this._checkStackTimer(util);
        }
    }

    /**
     * Clamp a duration in beats to the allowed min and max duration.
     * @param  {number} beats - a duration in beats.
     * @return {number} - the clamped duration.
     * @private
     */
    _clampBeats (beats) {
        return MathUtil.clamp(beats, Scratch3MusicBlocks.BEAT_RANGE.min, Scratch3MusicBlocks.BEAT_RANGE.max);
    }

    /**
     * Convert a number of beats to a number of seconds, using the current tempo.
     * @param  {number} beats - number of beats to convert to secs.
     * @return {number} seconds - number of seconds `beats` will last.
     * @private
     */
    _beatsToSec (beats) {
        return (60 / this.tempo) * beats;
    }

    /**
     * Check if the stack timer needs initialization.
     * @param {object} util - utility object provided by the runtime.
     * @return {boolean} - true if the stack timer needs to be initialized.
     * @private
     */
    _stackTimerNeedsInit (util) {
        return !util.stackFrame.timer;
    }

    /**
     * Start the stack timer and the yield the thread if necessary.
     * @param {object} util - utility object provided by the runtime.
     * @param {number} duration - a duration in seconds to set the timer for.
     * @private
     */
    _startStackTimer (util, duration) {
        util.stackFrame.timer = new Timer();
        util.stackFrame.timer.start();
        util.stackFrame.duration = duration;
        if (util.stackFrame.duration > 0) {
            util.yield();
        }
    }

    /**
     * Check the stack timer, and if its time is not up yet, yield the thread.
     * @param {object} util - utility object provided by the runtime.
     * @private
     */
    _checkStackTimer (util) {
        const timeElapsed = util.stackFrame.timer.timeElapsed();
        if (timeElapsed < util.stackFrame.duration * 1000) {
            util.yield();
        }
    }

    /**
     * Select an instrument for playing notes.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     * @property {int} INSTRUMENT - the number of the instrument to select.
     * @return {Promise} - a promise which will resolve once the instrument has loaded.
     */
    setInstrument (args, util) {
        const musicState = this._getMusicState(util.target);
        let instNum = Cast.toNumber(args.INSTRUMENT);
        instNum -= 1; // instruments are one-indexed
        if (typeof this.runtime.audioEngine === 'undefined') return;
        instNum = MathUtil.wrapClamp(instNum, 0, this.runtime.audioEngine.numInstruments - 1);
        musicState.currentInstrument = instNum;
        return this.runtime.audioEngine.instrumentPlayer.loadInstrument(musicState.currentInstrument);
    }

    /**
     * Set the current tempo to a new value.
     * @param {object} args - the block arguments.
     * @property {number} TEMPO - the tempo, in beats per minute.
     */
    setTempo (args) {
        const tempo = Cast.toNumber(args.TEMPO);
        this._updateTempo(tempo);
    }

    /**
     * Change the current tempo by some amount.
     * @param {object} args - the block arguments.
     * @property {number} TEMPO - the amount to change the tempo, in beats per minute.
     */
    changeTempo (args) {
        const change = Cast.toNumber(args.TEMPO);
        const tempo = change + this.tempo;
        this._updateTempo(tempo);
    }

    /**
     * Update the current tempo, clamping it to the min and max allowable range.
     * @param {number} tempo - the tempo to set, in beats per minute.
     * @private
     */
    _updateTempo (tempo) {
        tempo = MathUtil.clamp(tempo, Scratch3MusicBlocks.TEMPO_RANGE.min, Scratch3MusicBlocks.TEMPO_RANGE.max);
        this.tempo = tempo;
    }

    /**
     * Get the current tempo.
     * @return {number} - the current tempo, in beats per minute.
     */
    getTempo () {
        return this.tempo;
    }
}

module.exports = Scratch3MusicBlocks;
