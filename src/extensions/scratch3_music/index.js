const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const MathUtil = require('../../util/math-util');
const Timer = require('../../util/timer');

/**
 * The instrument and drum sounds, loaded as static assets.
 * @type {object}
 */
let assetData = {};
try {
    assetData = require('./manifest');
} catch (e) {
    // Non-webpack environment, don't worry about assets.
}

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHRpdGxlPm11c2ljLWJsb2NrLWljb248L3RpdGxlPjxkZWZzPjxwYXRoIGQ9Ik0zMi4xOCAyNS44NzRDMzIuNjM2IDI4LjE1NyAzMC41MTIgMzAgMjcuNDMzIDMwYy0zLjA3IDAtNS45MjMtMS44NDMtNi4zNzItNC4xMjYtLjQ1OC0yLjI4NSAxLjY2NS00LjEzNiA0Ljc0My00LjEzNi42NDcgMCAxLjI4My4wODQgMS44OS4yMzQuMzM4LjA4Ni42MzcuMTguOTM4LjMwMi44Ny0uMDItLjEwNC0yLjI5NC0xLjgzNS0xMi4yMy0yLjEzNC0xMi4zMDIgMy4wNi0xLjg3IDguNzY4LTIuNzUyIDUuNzA4LS44ODUuMDc2IDQuODItMy42NSAzLjg0NC0zLjcyNC0uOTg3LTQuNjUtNy4xNTMuMjYzIDE0LjczOHptLTE2Ljk5OCA1Ljk5QzE1LjYzIDM0LjE0OCAxMy41MDcgMzYgMTAuNDQgMzZjLTMuMDcgMC01LjkyMi0xLjg1Mi02LjM4LTQuMTM2LS40NDgtMi4yODQgMS42NzQtNC4xMzUgNC43NS00LjEzNSAxLjAwMyAwIDEuOTc1LjE5NiAyLjg1NS41NDMuODIyLS4wNTUtLjE1LTIuMzc3LTEuODYyLTEyLjIyOC0yLjEzMy0xMi4zMDMgMy4wNi0xLjg3IDguNzY0LTIuNzUzIDUuNzA2LS44OTQuMDc2IDQuODItMy42NDggMy44MzQtMy43MjQtLjk4Ny00LjY1LTcuMTUyLjI2MiAxNC43Mzh6IiBpZD0iYSIvPjwvZGVmcz48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjx1c2UgZmlsbD0iI0ZGRiIgeGxpbms6aHJlZj0iI2EiLz48cGF0aCBzdHJva2Utb3BhY2l0eT0iLjEiIHN0cm9rZT0iIzAwMCIgZD0iTTI4LjQ1NiAyMS42NzVjLS4wMS0uMzEyLS4wODctLjgyNS0uMjU2LTEuNzAyLS4wOTYtLjQ5NS0uNjEyLTMuMDIyLS43NTMtMy43My0uMzk1LTEuOTgtLjc2LTMuOTItMS4xNDItNi4xMTMtLjczMi00LjIyMy0uNjkzLTYuMDUuMzQ0LTYuNTI3LjUtLjIzIDEuMDYtLjA4IDEuODQuMzUuNDE0LjIyNyAyLjE4MiAxLjM2NSAyLjA3IDEuMjk2IDEuOTk0IDEuMjQyIDMuNDY0IDEuNzc0IDQuOTMgMS41NDggMS41MjYtLjIzNyAyLjUwNC0uMDYgMi44NzYuNjE4LjM0OC42MzUuMDE1IDEuNDE2LS43MyAyLjE4LTEuNDcyIDEuNTE2LTMuOTc1IDIuNTE0LTUuODQ4IDIuMDIzLS44MjItLjIyLTEuMjM4LS40NjUtMi4zOC0xLjI2N2wtLjA5NS0uMDY2Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMy4yOTQgMS4zMzYgMi4wOCA5LjE4NyAyLjYzNyAxMS42NzRsLjAwMi4wMTJjLjUyOCAyLjYzNy0xLjg3MyA0LjcyNC01LjIzNiA0LjcyNC0zLjI5IDAtNi4zNjMtMS45ODgtNi44NjItNC41MjgtLjUzLTIuNjQgMS44NzMtNC43MzQgNS4yMzMtNC43MzQuNjcyIDAgMS4zNDcuMDg1IDIuMDE0LjI1LjIyNy4wNTcuNDM2LjExOC42MzYuMTg3em0tMTYuOTk2IDUuOTljLS4wMS0uMzE4LS4wOS0uODM4LS4yNjYtMS43MzctLjA5LS40Ni0uNTk1LTIuOTM3LS43NTMtMy43MjctLjM5LTEuOTYtLjc1LTMuODktMS4xMy02LjA3LS43MzItNC4yMjMtLjY5Mi02LjA1LjM0NC02LjUyNi41MDItLjIzIDEuMDYtLjA4MiAxLjg0LjM1LjQxNS4yMjcgMi4xODIgMS4zNjQgMi4wNyAxLjI5NSAxLjk5MyAxLjI0MiAzLjQ2MiAxLjc3NCA0LjkyNiAxLjU0OCAxLjUyNS0uMjQgMi41MDQtLjA2NCAyLjg3Ni42MTQuMzQ4LjYzNS4wMTUgMS40MTUtLjcyOCAyLjE4LTEuNDc0IDEuNTE3LTMuOTc3IDIuNTEzLTUuODQ3IDIuMDE3LS44Mi0uMjItMS4yMzYtLjQ2NC0yLjM3OC0xLjI2N2wtLjA5NS0uMDY1Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMi4yOTQgMS4zMzcgMi4wNzggOS4xOSAyLjYzNiAxMS42NzVsLjAwMy4wMTNjLjUxNyAyLjYzOC0xLjg4NCA0LjczMi01LjIzNCA0LjczMi0zLjI4NyAwLTYuMzYtMS45OTMtNi44Ny00LjU0LS41Mi0yLjY0IDEuODg0LTQuNzMgNS4yNC00LjczLjkwNSAwIDEuODAzLjE1IDIuNjUuNDM2eiIvPjwvZz48L3N2Zz4=';

/**
 * Icon svg to be displayed in the category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE2LjA5IDEyLjkzN2MuMjI4IDEuMTQxLS44MzMgMi4wNjMtMi4zNzMgMi4wNjMtMS41MzUgMC0yLjk2Mi0uOTIyLTMuMTg2LTIuMDYzLS4yMy0xLjE0Mi44MzMtMi4wNjggMi4zNzItMi4wNjguMzIzIDAgLjY0MS4wNDIuOTQ1LjExN2EzLjUgMy41IDAgMCAxIC40NjguMTUxYy40MzUtLjAxLS4wNTItMS4xNDctLjkxNy02LjExNC0xLjA2Ny02LjE1MiAxLjUzLS45MzUgNC4zODQtMS4zNzcgMi44NTQtLjQ0Mi4wMzggMi40MS0xLjgyNSAxLjkyMi0xLjg2Mi0uNDkzLTIuMzI1LTMuNTc3LjEzMiA3LjM3ek03LjQ2IDguNTYzYy0xLjg2Mi0uNDkzLTIuMzI1LTMuNTc2LjEzIDcuMzdDNy44MTYgMTcuMDczIDYuNzU0IDE4IDUuMjIgMThjLTEuNTM1IDAtMi45NjEtLjkyNi0zLjE5LTIuMDY4LS4yMjQtMS4xNDIuODM3LTIuMDY3IDIuMzc1LTIuMDY3LjUwMSAwIC45ODcuMDk4IDEuNDI3LjI3Mi40MTItLjAyOC0uMDc0LTEuMTg5LS45My02LjExNEMzLjgzNCAxLjg3IDYuNDMgNy4wODcgOS4yODIgNi42NDZjMi44NTQtLjQ0Ny4wMzggMi40MS0xLjgyMyAxLjkxN3oiIGZpbGw9IiM1NzVFNzUiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==';

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
         * The number of drum and instrument sounds currently being played simultaneously.
         * @type {number}
         * @private
         */
        this._concurrencyCounter = 0;

        /**
         * An array of sound players, one for each drum sound.
         * @type {Array}
         * @private
         */
        this._drumPlayers = [];

        /**
         * An array of arrays of sound players. Each instrument has one or more audio players.
         * @type {Array[]}
         * @private
         */
        this._instrumentPlayerArrays = [];

        /**
         * An array of arrays of sound players. Each instrument mya have an audio player for each playable note.
         * @type {Array[]}
         * @private
         */
        this._instrumentPlayerNoteArrays = [];

        /**
         * An array of audio bufferSourceNodes. Each time you play an instrument or drum sound,
         * a bufferSourceNode is created. We keep references to them to make sure their onended
         * events can fire.
         * @type {Array}
         * @private
         */
        this._bufferSources = [];

        this._loadAllSounds();

        this._onTargetCreated = this._onTargetCreated.bind(this);
        this.runtime.on('targetWasCreated', this._onTargetCreated);
    }

    /**
     * Decode the full set of drum and instrument sounds, and store the audio buffers in arrays.
     */
    _loadAllSounds () {
        const loadingPromises = [];
        this.DRUM_INFO.forEach((drumInfo, index) => {
            const filePath = `drums/${drumInfo.fileName}`;
            const promise = this._storeSound(filePath, index, this._drumPlayers);
            loadingPromises.push(promise);
        });
        this.INSTRUMENT_INFO.forEach((instrumentInfo, instrumentIndex) => {
            this._instrumentPlayerArrays[instrumentIndex] = [];
            this._instrumentPlayerNoteArrays[instrumentIndex] = [];
            instrumentInfo.samples.forEach((sample, noteIndex) => {
                const filePath = `instruments/${instrumentInfo.dirName}/${sample}`;
                const promise = this._storeSound(filePath, noteIndex, this._instrumentPlayerArrays[instrumentIndex]);
                loadingPromises.push(promise);
            });
        });
        Promise.all(loadingPromises).then(() => {
            // @TODO: Update the extension status indicator.
        });
    }

    /**
     * Decode a sound and store the player in an array.
     * @param {string} filePath - the audio file name.
     * @param {number} index - the index at which to store the audio player.
     * @param {array} playerArray - the array of players in which to store it.
     * @return {Promise} - a promise which will resolve once the sound has been stored.
     */
    _storeSound (filePath, index, playerArray) {
        const fullPath = `${filePath}.mp3`;

        if (!assetData[fullPath]) return;

        // The sound player has already been downloaded via the manifest file required above.
        const soundBuffer = assetData[fullPath];

        return this._decodeSound(soundBuffer).then(player => {
            playerArray[index] = player;
        });
    }

    /**
     * Decode a sound and return a promise with the audio buffer.
     * @param  {ArrayBuffer} soundBuffer - a buffer containing the encoded audio.
     * @return {Promise} - a promise which will resolve once the sound has decoded.
     */
    _decodeSound (soundBuffer) {
        const engine = this.runtime.audioEngine;

        if (!engine) {
            return Promise.reject(new Error('No Audio Context Detected'));
        }

        // Check for newer promise-based API
        return engine.decodeSoundPlayer({data: {buffer: soundBuffer}});
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
            obj.value = String(index + 1);
            return obj;
        });
    }

    /**
     * An array of info about each drum.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the drums menu.
     * @param {string} fileName - the name of the audio file containing the drum sound.
     */
    get DRUM_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'music.drumSnare',
                    default: '(1) Snare Drum',
                    description: 'Sound of snare drum as used in a standard drum kit'
                }),
                fileName: '1-snare'
            },
            {
                name: formatMessage({
                    id: 'music.drumBass',
                    default: '(2) Bass Drum',
                    description: 'Sound of bass drum as used in a standard drum kit'
                }),
                fileName: '2-bass-drum'
            },
            {
                name: formatMessage({
                    id: 'music.drumSideStick',
                    default: '(3) Side Stick',
                    description: 'Sound of a drum stick hitting the side of a drum (usually the snare)'
                }),
                fileName: '3-side-stick'
            },
            {
                name: formatMessage({
                    id: 'music.drumCrashCymbal',
                    default: '(4) Crash Cymbal',
                    description: 'Sound of a drum stick hitting a crash cymbal'
                }),
                fileName: '4-crash-cymbal'
            },
            {
                name: formatMessage({
                    id: 'music.drumOpenHiHat',
                    default: '(5) Open Hi-Hat',
                    description: 'Sound of a drum stick hitting a hi-hat while open'
                }),
                fileName: '5-open-hi-hat'
            },
            {
                name: formatMessage({
                    id: 'music.drumClosedHiHat',
                    default: '(6) Closed Hi-Hat',
                    description: 'Sound of a drum stick hitting a hi-hat while closed'
                }),
                fileName: '6-closed-hi-hat'
            },
            {
                name: formatMessage({
                    id: 'music.drumTambourine',
                    default: '(7) Tambourine',
                    description: 'Sound of a tambourine being struck'
                }),
                fileName: '7-tambourine'
            },
            {
                name: formatMessage({
                    id: 'music.drumHandClap',
                    default: '(8) Hand Clap',
                    description: 'Sound of two hands clapping together'
                }),
                fileName: '8-hand-clap'
            },
            {
                name: formatMessage({
                    id: 'music.drumClaves',
                    default: '(9) Claves',
                    description: 'Sound of claves being struck together'
                }),
                fileName: '9-claves'
            },
            {
                name: formatMessage({
                    id: 'music.drumWoodBlock',
                    default: '(10) Wood Block',
                    description: 'Sound of a wood block being struck'
                }),
                fileName: '10-wood-block'
            },
            {
                name: formatMessage({
                    id: 'music.drumCowbell',
                    default: '(11) Cowbell',
                    description: 'Sound of a cowbell being struck'
                }),
                fileName: '11-cowbell'
            },
            {
                name: formatMessage({
                    id: 'music.drumTriangle',
                    default: '(12) Triangle',
                    description: 'Sound of a triangle (instrument) being struck'
                }),
                fileName: '12-triangle'
            },
            {
                name: formatMessage({
                    id: 'music.drumBongo',
                    default: '(13) Bongo',
                    description: 'Sound of a bongo being struck'
                }),
                fileName: '13-bongo'
            },
            {
                name: formatMessage({
                    id: 'music.drumConga',
                    default: '(14) Conga',
                    description: 'Sound of a conga being struck'
                }),
                fileName: '14-conga'
            },
            {
                name: formatMessage({
                    id: 'music.drumCabasa',
                    default: '(15) Cabasa',
                    description: 'Sound of a cabasa being shaken'
                }),
                fileName: '15-cabasa'
            },
            {
                name: formatMessage({
                    id: 'music.drumGuiro',
                    default: '(16) Guiro',
                    description: 'Sound of a guiro being played'
                }),
                fileName: '16-guiro'
            },
            {
                name: formatMessage({
                    id: 'music.drumVibraslap',
                    default: '(17) Vibraslap',
                    description: 'Sound of a Vibraslap being played'
                }),
                fileName: '17-vibraslap'
            },
            {
                name: formatMessage({
                    id: 'music.drumCuica',
                    default: '(18) Cuica',
                    description: 'Sound of a cuica being played'
                }),
                fileName: '18-cuica'
            }
        ];
    }

    /**
     * An array of info about each instrument.
     * @type {object[]}
     * @param {string} name - the translatable name to display in the instruments menu.
     * @param {string} dirName - the name of the directory containing audio samples for this instrument.
     * @param {number} [releaseTime] - an optional duration for the release portion of each note.
     * @param {number[]} samples - an array of numbers representing the MIDI note number for each
     *                           sampled sound used to play this instrument.
     */
    get INSTRUMENT_INFO () {
        return [
            {
                name: formatMessage({
                    id: 'music.instrumentPiano',
                    default: '(1) Piano',
                    description: 'Sound of a piano'
                }),
                dirName: '1-piano',
                releaseTime: 0.5,
                samples: [24, 36, 48, 60, 72, 84, 96, 108]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricPiano',
                    default: '(2) Electric Piano',
                    description: 'Sound of an electric piano'
                }),
                dirName: '2-electric-piano',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentOrgan',
                    default: '(3) Organ',
                    description: 'Sound of an organ'
                }),
                dirName: '3-organ',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentGuitar',
                    default: '(4) Guitar',
                    description: 'Sound of an accoustic guitar'
                }),
                dirName: '4-guitar',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentElectricGuitar',
                    default: '(5) Electric Guitar',
                    description: 'Sound of an electric guitar'
                }),
                dirName: '5-electric-guitar',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentBass',
                    default: '(6) Bass',
                    description: 'Sound of an accoustic upright bass'
                }),
                dirName: '6-bass',
                releaseTime: 0.25,
                samples: [36, 48]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentPizzicato',
                    default: '(7) Pizzicato',
                    description: 'Sound of a string instrument (e.g. violin) being plucked'
                }),
                dirName: '7-pizzicato',
                releaseTime: 0.25,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentCello',
                    default: '(8) Cello',
                    description: 'Sound of a cello being played with a bow'
                }),
                dirName: '8-cello',
                releaseTime: 0.1,
                samples: [36, 48, 60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentTrombone',
                    default: '(9) Trombone',
                    description: 'Sound of a trombone being played'
                }),
                dirName: '9-trombone',
                samples: [36, 48, 60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentClarinet',
                    default: '(10) Clarinet',
                    description: 'Sound of a clarinet being played'
                }),
                dirName: '10-clarinet',
                samples: [48, 60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSaxophone',
                    default: '(11) Saxophone',
                    description: 'Sound of a saxophone being played'
                }),
                dirName: '11-saxophone',
                samples: [36, 60, 84]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentFlute',
                    default: '(12) Flute',
                    description: 'Sound of a flute being played'
                }),
                dirName: '12-flute',
                samples: [60, 72]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentWoodenFlute',
                    default: '(13) Wooden Flute',
                    description: 'Sound of a wooden flute being played'
                }),
                dirName: '13-wooden-flute',
                samples: [60, 72]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentBassoon',
                    default: '(14) Bassoon',
                    description: 'Sound of a bassoon being played'
                }),
                dirName: '14-bassoon',
                samples: [36, 48, 60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentChoir',
                    default: '(15) Choir',
                    description: 'Sound of a choir singing'
                }),
                dirName: '15-choir',
                releaseTime: 0.25,
                samples: [48, 60, 72]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentVibraphone',
                    default: '(16) Vibraphone',
                    description: 'Sound of a vibraphone being struck'
                }),
                dirName: '16-vibraphone',
                releaseTime: 0.5,
                samples: [60, 72]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentMusicBox',
                    default: '(17) Music Box',
                    description: 'Sound of a music box playing'
                }),
                dirName: '17-music-box',
                releaseTime: 0.25,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSteelDrum',
                    default: '(18) Steel Drum',
                    description: 'Sound of a steel drum being struck'
                }),
                dirName: '18-steel-drum',
                releaseTime: 0.5,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentMarimba',
                    default: '(19) Marimba',
                    description: 'Sound of a marimba being struck'
                }),
                dirName: '19-marimba',
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSynthLead',
                    default: '(20) Synth Lead',
                    description: 'Sound of a "lead" synthesizer being played'
                }),
                dirName: '20-synth-lead',
                releaseTime: 0.1,
                samples: [60]
            },
            {
                name: formatMessage({
                    id: 'music.instrumentSynthPad',
                    default: '(21) Synth Pad',
                    description: 'Sound of a "pad" synthesizer being played'
                }),
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
     * When a music-playing Target is cloned, clone the music state.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     * @private
     */
    _onTargetCreated (newTarget, sourceTarget) {
        if (sourceTarget) {
            const musicState = sourceTarget.getCustomState(Scratch3MusicBlocks.STATE_KEY);
            if (musicState) {
                newTarget.setCustomState(Scratch3MusicBlocks.STATE_KEY, Clone.simple(musicState));
            }
        }
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'music',
            name: formatMessage({
                id: 'music.categoryName',
                default: 'Music',
                description: 'Label for the Music extension category'
            }),
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'playDrumForBeats',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.playDrumForBeats',
                        default: 'play drum [DRUM] for [BEATS] beats',
                        description: 'play drum sample for a number of beats'
                    }),
                    arguments: {
                        DRUM: {
                            type: ArgumentType.NUMBER,
                            menu: 'DRUM',
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
                    text: formatMessage({
                        id: 'music.restForBeats',
                        default: 'rest for [BEATS] beats',
                        description: 'rest (play no sound) for a number of beats'
                    }),
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
                    text: formatMessage({
                        id: 'music.playNoteForBeats',
                        default: 'play note [NOTE] for [BEATS] beats',
                        description: 'play a note for a number of beats'
                    }),
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
                    text: formatMessage({
                        id: 'music.setInstrument',
                        default: 'set instrument to [INSTRUMENT]',
                        description: 'set the instrument (e.g. piano, guitar, trombone) for notes played'
                    }),
                    arguments: {
                        INSTRUMENT: {
                            type: ArgumentType.NUMBER,
                            menu: 'INSTRUMENT',
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'setTempo',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'music.setTempo',
                        default: 'set tempo to [TEMPO]',
                        description: 'set tempo (speed) for notes, drums, and rests played'
                    }),
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
                    text: formatMessage({
                        id: 'music.changeTempo',
                        default: 'change tempo by [TEMPO]',
                        description: 'change tempo (speed) for notes, drums, and rests played'
                    }),
                    arguments: {
                        TEMPO: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 20
                        }
                    }
                },
                {
                    opcode: 'getTempo',
                    text: formatMessage({
                        id: 'music.getTempo',
                        default: 'tempo',
                        description: 'get the current tempo (speed) for notes, drums, and rests played'
                    }),
                    blockType: BlockType.REPORTER
                }
            ],
            menus: {
                DRUM: this._buildMenu(this.DRUM_INFO),
                INSTRUMENT: this._buildMenu(this.INSTRUMENT_INFO)
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
        if (util.target.sprite.soundBank === null) return;
        // If we're playing too many sounds, do not play the drum sound.
        if (this._concurrencyCounter > Scratch3MusicBlocks.CONCURRENCY_LIMIT) {
            return;
        }

        const player = this._drumPlayers[drumNum];

        if (typeof player === 'undefined') return;

        if (player.isPlaying && !player.isStarting) {
            // Take the internal player state and create a new player with it.
            // `.play` does this internally but then instructs the sound to
            // stop.
            player.take();
        }

        const engine = util.runtime.audioEngine;
        const chain = engine.createEffectChain();
        chain.setEffectsFromTarget(util.target);
        player.connect(chain);

        this._concurrencyCounter++;
        player.once('stop', () => {
            this._concurrencyCounter--;
        });

        player.play();
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
        if (util.target.sprite.soundBank === null) return;

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

        // If the audio sample has not loaded yet, bail out
        if (typeof this._instrumentPlayerArrays[inst] === 'undefined') return;
        if (typeof this._instrumentPlayerArrays[inst][sampleIndex] === 'undefined') return;

        // Fetch the sound player to play the note.
        const engine = util.runtime.audioEngine;

        if (!this._instrumentPlayerNoteArrays[inst][note]) {
            this._instrumentPlayerNoteArrays[inst][note] = this._instrumentPlayerArrays[inst][sampleIndex].take();
        }

        const player = this._instrumentPlayerNoteArrays[inst][note];

        if (player.isPlaying && !player.isStarting) {
            // Take the internal player state and create a new player with it.
            // `.play` does this internally but then instructs the sound to
            // stop.
            player.take();
        }

        const chain = engine.createEffectChain();
        chain.setEffectsFromTarget(util.target);

        // Set its pitch.
        const sampleNote = sampleArray[sampleIndex];
        const notePitchInterval = this._ratioForPitchInterval(note - sampleNote);

        // Create a gain node for this note, and connect it to the sprite's
        // simulated effectChain.
        const context = engine.audioContext;
        const releaseGain = context.createGain();
        releaseGain.connect(chain.getInputNode());

        // Schedule the release of the note, ramping its gain down to zero,
        // and then stopping the sound.
        let releaseDuration = this.INSTRUMENT_INFO[inst].releaseTime;
        if (typeof releaseDuration === 'undefined') {
            releaseDuration = 0.01;
        }
        const releaseStart = context.currentTime + durationSec;
        const releaseEnd = releaseStart + releaseDuration;
        releaseGain.gain.setValueAtTime(1, releaseStart);
        releaseGain.gain.linearRampToValueAtTime(0.0001, releaseEnd);

        this._concurrencyCounter++;
        player.once('stop', () => {
            this._concurrencyCounter--;
        });

        // Start playing the note
        player.play();
        // Connect the player to the gain node.
        player.connect({getInputNode () {
            return releaseGain;
        }});
        // Set playback now after play creates the outputNode.
        player.outputNode.playbackRate.value = notePitchInterval;
        // Schedule playback to stop.
        player.outputNode.stop(releaseEnd);
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
        return (60 / this.getTempo()) * beats;
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
        const tempo = change + this.getTempo();
        this._updateTempo(tempo);
    }

    /**
     * Update the current tempo, clamping it to the min and max allowable range.
     * @param {number} tempo - the tempo to set, in beats per minute.
     * @private
     */
    _updateTempo (tempo) {
        tempo = MathUtil.clamp(tempo, Scratch3MusicBlocks.TEMPO_RANGE.min, Scratch3MusicBlocks.TEMPO_RANGE.max);
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            stage.tempo = tempo;
        }
    }

    /**
     * Get the current tempo.
     * @return {number} - the current tempo, in beats per minute.
     */
    getTempo () {
        const stage = this.runtime.getTargetForStage();
        if (stage) {
            return stage.tempo;
        }
        return 60;
    }
}

module.exports = Scratch3MusicBlocks;
