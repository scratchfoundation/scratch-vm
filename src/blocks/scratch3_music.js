const ArgumentType = require('../extension-support/argument-type');
const BlockType = require('../extension-support/block-type');
const Clone = require('../util/clone');
const Cast = require('../util/cast');
const MathUtil = require('../util/math-util');

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

        this.drumMenu = this._buildMenu(drumNames);
        this.instrumentMenu = this._buildMenu(instrumentNames);
    }

    buildMenu (names) {
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

    playDrumForBeats (args, util) {
        let drum = Cast.toNumber(args.DRUM);
        drum -= 1; // drums are one-indexed
        if (typeof this.runtime.audioEngine === 'undefined') return;
        drum = MathUtil.wrapClamp(drum, 0, this.runtime.audioEngine.numDrums - 1);
        let beats = Cast.toNumber(args.BEATS);
        beats = this._clampBeats(beats);
        if (util.target.audioPlayer === null) return;
        return util.target.audioPlayer.playDrumForBeats(drum, beats);
    }

    restForBeats (args) {
        let beats = Cast.toNumber(args.BEATS);
        beats = this._clampBeats(beats);
        if (typeof this.runtime.audioEngine === 'undefined') return;
        return this.runtime.audioEngine.waitForBeats(beats);
    }

    playNoteForBeats (args, util) {
        let note = Cast.toNumber(args.NOTE);
        note = MathUtil.clamp(note, Scratch3MusicBlocks.MIDI_NOTE_RANGE.min, Scratch3MusicBlocks.MIDI_NOTE_RANGE.max);
        let beats = Cast.toNumber(args.BEATS);
        beats = this._clampBeats(beats);
        const musicState = this._getMusicState(util.target);
        const inst = musicState.currentInstrument;
        if (typeof this.runtime.audioEngine === 'undefined') return;
        return this.runtime.audioEngine.playNoteForBeatsWithInstAndVol(note, beats, inst, 100);
    }

    setInstrument (args, util) {
        const musicState = this._getMusicState(util.target);
        let instNum = Cast.toNumber(args.INSTRUMENT);
        instNum -= 1; // instruments are one-indexed
        if (typeof this.runtime.audioEngine === 'undefined') return;
        instNum = MathUtil.wrapClamp(instNum, 0, this.runtime.audioEngine.numInstruments - 1);
        musicState.currentInstrument = instNum;
        return this.runtime.audioEngine.instrumentPlayer.loadInstrument(musicState.currentInstrument);
    }

    _clampBeats (beats) {
        return MathUtil.clamp(beats, Scratch3MusicBlocks.BEAT_RANGE.min, Scratch3MusicBlocks.BEAT_RANGE.max);
    }

    setTempo (args) {
        const tempo = Cast.toNumber(args.TEMPO);
        this._updateTempo(tempo);
    }

    changeTempo (args) {
        const change = Cast.toNumber(args.TEMPO);
        if (typeof this.runtime.audioEngine === 'undefined') return;
        const tempo = change + this.runtime.audioEngine.currentTempo;
        this._updateTempo(tempo);
    }

    _updateTempo (tempo) {
        tempo = MathUtil.clamp(tempo, Scratch3MusicBlocks.TEMPO_RANGE.min, Scratch3MusicBlocks.TEMPO_RANGE.max);
        if (typeof this.runtime.audioEngine === 'undefined') return;
        this.runtime.audioEngine.setTempo(tempo);
    }

    getTempo () {
        if (typeof this.runtime.audioEngine === 'undefined') return;
        return this.runtime.audioEngine.currentTempo;
    }
}

module.exports = Scratch3MusicBlocks;
