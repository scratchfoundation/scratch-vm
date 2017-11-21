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
         * The number of drum and instrument sounds currently being played simultaneously.
         * @type {number}
         * @private
         */
        this._concurrencyCounter = 0;

        /**
         * An array of audio buffers, one for each drum sound.
         * @type {Array}
         * @private
         */
        this._drumBuffers = [];

        /**
         * An array of arrays of audio buffers. Each instrument has one or more audio buffers.
         * @type {Array[]}
         * @private
         */
        this._instrumentBufferArrays = [];

        this._loadAllSounds();
    }

    /**
     * Download and decode the full set of drum and instrument sounds, and
     * store the audio buffers in arrays.
     */
    _loadAllSounds () {
        const loadingPromises = [];
        this.DRUM_INFO.forEach((drumInfo, index) => {
            const fileName = `drums/${drumInfo.fileName}`;
            const promise = this._loadSound(fileName, index, this._drumBuffers);
            loadingPromises.push(promise);
        });
        this.INSTRUMENT_INFO.forEach((instrumentInfo, instrumentIndex) => {
            this._instrumentBufferArrays[instrumentIndex] = [];
            instrumentInfo.samples.forEach((sample, noteIndex) => {
                const fileName = `instruments/${instrumentInfo.dirName}/${sample}`;
                const promise = this._loadSound(fileName, noteIndex, this._instrumentBufferArrays[instrumentIndex]);
                loadingPromises.push(promise);
            });
        });
        Promise.all(loadingPromises).then(() => {
            // @TODO: Update the extension status indicator.
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
        if (!this.runtime.storage) return;
        if (!this.runtime.audioEngine) return;
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
     * An array of info about each drum.
     * @type {object[]} an array of objects.
     * @param {string} name - the translatable name to display in the drums menu.
     * @param {string} fileName - the name of the audio file containing the drum sound.
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
     * An array of info about each instrument.
     * @type {object[]} an array of objects.
     * @param {string} name - the translatable name to display in the instruments menu.
     * @param {string} dirName - the name of the directory containing audio samples for this instrument.
     * @param {number} [releaseTime] - an optional duration for the release portion of each note.
     * @param {number[]} samples - an array of numbers representing the MIDI note number for each
     *                           sampled sound used to play this instrument.
     */
    get INSTRUMENT_INFO () {
        return [
            {
                name: '(1) Piano',
                dirName: '1-piano',
                releaseTime: 0.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: '(2) Electric Piano',
                dirName: '2-electric-piano',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: '(3) Organ',
                dirName: '3-organ',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: '(4) Guitar',
                dirName: '4-guitar',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: '(5) Electric Guitar',
                dirName: '5-electric-guitar',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: '(6) Bass',
                dirName: '6-bass',
                releaseTime: 0.25,
                samples: [36, 48]
            },
            {
                name: '(7) Pizzicato',
                dirName: '7-pizzicato',
                releaseTime: 0.25,
                samples: [60]
            },
            {
                name: '(8) Cello',
                dirName: '8-cello',
                releaseTime: 0.1,
                samples: [36, 48, 60]
            },
            {
                name: '(9) Trombone',
                dirName: '9-trombone',
                samples: [36, 48, 60]
            },
            {
                name: '(10) Clarinet',
                dirName: '10-clarinet',
                samples: [48, 60]
            },
            {
                name: '(11) Saxophone',
                dirName: '11-saxophone',
                samples: [36, 60, 84]
            },
            {
                name: '(12) Flute',
                dirName: '12-flute',
                samples: [60, 72]
            },
            {
                name: '(13) Wooden Flute',
                dirName: '13-wooden-flute',
                samples: [60, 72]
            },
            {
                name: '(14) Bassoon',
                dirName: '14-bassoon',
                samples: [36, 48, 60]
            },
            {
                name: '(15) Choir',
                dirName: '15-choir',
                releaseTime: 0.25,
                samples: [48, 60, 72]
            },
            {
                name: '(16) Vibraphone',
                dirName: '16-vibraphone',
                releaseTime: 0.5,
                samples: [60, 72]
            },
            {
                name: '(17) Music Box',
                dirName: '17-music-box',
                releaseTime: 0.25,
                samples: [60]
            },
            {
                name: '(18) Steel Drum',
                dirName: '18-steel-drum',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: '(19) Marimba',
                dirName: '19-marimba',
                samples: [60]
            },
            {
                name: '(20) Synth Lead',
                dirName: '20-synth-lead',
                releaseTime: 0.1,
                samples: [60]
            },
            {
                name: '(21) Synth Pad',
                dirName: '21-synth-pad',
                releaseTime: 0.25,
                samples: [60]
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
        return {min: 0, max: 130};
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

    /**
     * Play a drum sound using its 0-indexed number.
     * @param {object} util - utility object provided by the runtime.
     * @param  {number} drumNum - the number of the drum to play.
     * @private
     */
    _playDrumNum (util, drumNum) {
        if (util.runtime.audioEngine === null) return;
        if (util.target.audioPlayer === null) return;
        // If we're playing too many sounds, do not play the drum sound.
        if (this._concurrencyCounter > Scratch3MusicBlocks.CONCURRENCY_LIMIT) {
            return;
        }
        const outputNode = util.target.audioPlayer.getInputNode();
        const context = util.runtime.audioEngine.audioContext;
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = this._drumBuffers[drumNum];
        bufferSource.connect(outputNode);
        bufferSource.start();
        this._concurrencyCounter++;
        bufferSource.onended = () => {
            this._concurrencyCounter--;
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
     * This function processes the arguments, and handles the timing of the block's execution.
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
            // If the duration is 0, do not play the note. In Scratch 2.0, "play drum for 0 beats" plays the drum,
            // but "play note for 0 beats" is silent.
            if (beats === 0) return;

            const durationSec = this._beatsToSec(beats);

            this._playNote(util, note, durationSec);

            this._startStackTimer(util, durationSec);
        } else {
            this._checkStackTimer(util);
        }
    }

    /**
     * Play a note using the current instrument for a duration in seconds.
     * This function actually plays the sound, and handles the timing of the sound, including the
     * "release" portion of the sound, which continues briefly after the block execution has finished.
     * @param {object} util - utility object provided by the runtime.
     * @param {number} note - the pitch of the note to play, interpreted as a MIDI note number.
     * @param {number} durationSec - the duration in seconds to play the note.
     * @private
     */
    _playNote (util, note, durationSec) {
        if (util.runtime.audioEngine === null) return;
        if (util.target.audioPlayer === null) return;

        // If we're playing too many sounds, do not play the note.
        if (this._concurrencyCounter > Scratch3MusicBlocks.CONCURRENCY_LIMIT) {
            return;
        }

        // Determine which of the audio samples for this instrument to play
        const musicState = this._getMusicState(util.target);
        const inst = musicState.currentInstrument;
        const instrumentInfo = this.INSTRUMENT_INFO[inst];
        const sampleArray = instrumentInfo.samples;
        const sampleIndex = this._selectSampleIndexForNote(note, sampleArray);

        // Create the audio buffer to play the note, and set its pitch
        const context = util.runtime.audioEngine.audioContext;
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = this._instrumentBufferArrays[inst][sampleIndex];
        const sampleNote = sampleArray[sampleIndex];
        bufferSource.playbackRate.value = this._ratioForPitchInterval(note - sampleNote);

        // Create a gain node for this note, and connect it to the sprite's audioPlayer.
        const gainNode = context.createGain();
        bufferSource.connect(gainNode);
        const outputNode = util.target.audioPlayer.getInputNode();
        gainNode.connect(outputNode);

        // Start playing the note
        bufferSource.start();

        // Schedule the release of the note, ramping its gain down to zero,
        // and then stopping the sound.
        let releaseDuration = this.INSTRUMENT_INFO[inst].releaseTime;
        if (typeof releaseDuration === 'undefined') {
            releaseDuration = 0.01;
        }
        const releaseStart = context.currentTime + durationSec;
        const releaseEnd = releaseStart + releaseDuration;
        gainNode.gain.setValueAtTime(1, releaseStart);
        gainNode.gain.linearRampToValueAtTime(0.0001, releaseEnd);
        bufferSource.stop(releaseEnd);

        // Update the concurrency counter
        this._concurrencyCounter++;
        bufferSource.onended = () => {
            this._concurrencyCounter--;
        };
    }

    /**
     * The samples array for each instrument is the set of pitches of the available audio samples.
     * This function selects the best one to use to play a given input note, and returns its index
     * in the samples array.
     * @param  {number} note - the input note to select a sample for.
     * @param  {number[]} samples - an array of the pitches of the available samples.
     * @return {index} the index of the selected sample in the samples array.
     * @private
     */
    _selectSampleIndexForNote (note, samples) {
        // Step backwards through the array of samples, i.e. in descending pitch, in order to find
        // the sample that is the closest one below (or matching) the pitch of the input note.
        for (let i = samples.length - 1; i >= 0; i--) {
            if (note >= samples[i]) {
                return i;
            }
        }
        return 0;
    }

    /**
     * Calcuate the frequency ratio for a given musical interval.
     * @param  {number} interval - the pitch interval to convert.
     * @return {number} a ratio corresponding to the input interval.
     * @private
     */
    _ratioForPitchInterval (interval) {
        return Math.pow(2, (interval / 12));
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
        util.yield();
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
     */
    setInstrument (args, util) {
        const musicState = this._getMusicState(util.target);
        let instNum = Cast.toNumber(args.INSTRUMENT);
        instNum = Math.round(instNum);
        instNum -= 1; // instruments are one-indexed
        instNum = MathUtil.wrapClamp(instNum, 0, this.INSTRUMENT_INFO.length - 1);
        musicState.currentInstrument = instNum;
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
