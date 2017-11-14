const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const MathUtil = require('../../util/math-util');
const Timer = require('../../util/timer');

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

        /**
         * The number of drum sounds currently being played simultaneously.
         * @type {number}
         * @private
         */
        this._drumConcurrencyCounter = 0;

        /**
         * An array of audio buffers, one for each drum sound.
         * @type {Array}
         * @private
         */
        this._drumBuffers = [];

        this._loadAllDrumSounds();
    }

    /**
     * Download and decode the full set of drum sounds, and store the audio buffers
     * in the drum buffers array.
     * @TODO: Also load the instrument sounds here (rename this fn), and use Promise.all
     * to detect that all the assets have loaded in order to update the extension status
     * indicator.
     */
    _loadAllDrumSounds () {
        const loadingPromises = [];
        this.DRUM_INFO.forEach((drumInfo, index) => {
            const promise = this._loadSound(drumInfo.fileName, index, this._drumBuffers);
            loadingPromises.push(promise);
        });
        Promise.all(loadingPromises).then(() => {
            // done!
        });
    }

    /**
     * Download and decode a sound, and store the buffer in an array.
     * @param {string} fileName - the audio file name.
     * @param {number} index - the index at which to store the audio buffer.
     * @param {array} bufferArray - the array of buffers in which to store it.
     * @return {Promise} - a promise which will resolve once the sound has loaded.
     */
    _loadSound (fileName, index, bufferArray) {
        return this.runtime.storage.load(this.runtime.storage.AssetType.Sound, fileName, 'mp3')
            .then(soundAsset =>
                this.runtime.audioEngine.audioContext.decodeAudioData(soundAsset.data.buffer)
            )
            .then(buffer => {
                bufferArray[index] = buffer;
            });
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = index + 1;
            return obj;
        });
    }

    /**
     * An array of translatable drum names and corresponding audio file names.
     * @type {array}
     */
    get DRUM_INFO () {
        return [
            {
                name: '(1) Snare Drum',
                fileName: '1-snare'
            },
            {
                name: '(2) Bass Drum',
                fileName: '2-bass-drum'
            },
            {
                name: '(3) Side Stick',
                fileName: '3-side-stick'
            },
            {
                name: '(4) Crash Cymbal',
                fileName: '4-crash-cymbal'
            },
            {
                name: '(5) Open Hi-Hat',
                fileName: '5-open-hi-hat'
            },
            {
                name: '(6) Closed Hi-Hat',
                fileName: '6-closed-hi-hat'
            },
            {
                name: '(7) Tambourine',
                fileName: '7-tambourine'
            },
            {
                name: '(8) Hand Clap',
                fileName: '8-hand-clap'
            },
            {
                name: '(9) Claves',
                fileName: '9-claves'
            },
            {
                name: '(10) Wood Block',
                fileName: '10-wood-block'
            },
            {
                name: '(11) Cowbell',
                fileName: '11-cowbell'
            },
            {
                name: '(12) Triangle',
                fileName: '12-triangle'
            },
            {
                name: '(13) Bongo',
                fileName: '13-bongo'
            },
            {
                name: '(14) Conga',
                fileName: '14-conga'
            },
            {
                name: '(15) Cabasa',
                fileName: '15-cabasa'
            },
            {
                name: '(16) Guiro',
                fileName: '16-guiro'
            },
            {
                name: '(17) Vibraslap',
                fileName: '17-vibraslap'
            },
            {
                name: '(18) Cuica',
                fileName: '18-cuica'
            }
        ];
    }

    /**
     * An array of translatable instrument names and corresponding audio file names.
     * @type {array}
     */
    get INSTRUMENT_INFO () {
        return [
            {
                name: '(1) Piano',
                fileName: '1-piano'
            },
            {
                name: '(2) Electric Piano',
                fileName: '2-electric-piano'
            },
            {
                name: '(3) Organ',
                fileName: '3-organ'
            },
            {
                name: '(4) Guitar',
                fileName: '4-guitar'
            },
            {
                name: '(5) Electric Guitar',
                fileName: '5-electric-guitar'
            },
            {
                name: '(6) Bass',
                fileName: '6-bass'
            },
            {
                name: '(7) Pizzicato',
                fileName: '7-pizzicato'
            },
            {
                name: '(8) Cello',
                fileName: '8-cello'
            },
            {
                name: '(9) Trombone',
                fileName: '9-trombone'
            },
            {
                name: '(10) Clarinet',
                fileName: '10-clarinet'
            },
            {
                name: '(11) Saxophone',
                fileName: '11-saxophone'
            },
            {
                name: '(12) Flute',
                fileName: '12-flute'
            },
            {
                name: '(13) Wooden Flute',
                fileName: '13-wooden-flute'
            },
            {
                name: '(14) Bassoon',
                fileName: '14-bassoon'
            },
            {
                name: '(15) Choir',
                fileName: '15-choir'
            },
            {
                name: '(16) Vibraphone',
                fileName: '16-vibraphone'
            },
            {
                name: '(17) Music Box',
                fileName: '17-music-box'
            },
            {
                name: '(18) Steel Drum',
                fileName: '18-steel-drum'
            },
            {
                name: '(19) Marimba',
                fileName: '19-marimba'
            },
            {
                name: '(20) Synth Lead',
                fileName: '20-synth-lead'
            },
            {
                name: '(21) Synth Pad',
                fileName: '21-synth-pad'
            }
        ];
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
     * The maximum number of sounds to allow to play simultaneously.
     * @type {number}
     */
    static get CONCURRENCY_LIMIT () {
        return 30;
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
                drums: this._buildMenu(this.DRUM_INFO),
                instruments: this._buildMenu(this.INSTRUMENT_INFO)
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
            drum = Math.round(drum);
            drum -= 1; // drums are one-indexed
            drum = MathUtil.wrapClamp(drum, 0, this.DRUM_INFO.length - 1);
            let beats = Cast.toNumber(args.BEATS);
            beats = this._clampBeats(beats);
            this._playDrumNum(util, drum);
            this._startStackTimer(util, this._beatsToSec(beats));
        } else {
            this._checkStackTimer(util);
        }
    }

    _playDrumNum (util, drumNum) {
        if (util.target.audioPlayer === null) return;
        if (this._drumConcurrencyCounter > Scratch3MusicBlocks.CONCURRENCY_LIMIT) {
            return;
        }
        const outputNode = util.target.audioPlayer.getInputNode();
        const bufferSource = this.runtime.audioEngine.audioContext.createBufferSource();
        bufferSource.buffer = this._drumBuffers[drumNum];
        bufferSource.connect(outputNode);
        bufferSource.start();
        this._drumConcurrencyCounter++;
        bufferSource.onended = () => {
            this._drumConcurrencyCounter--;
        };
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
