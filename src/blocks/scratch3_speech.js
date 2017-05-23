var Cast = require('../util/cast');

var Scratch3SpeechBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;

    this.SpeechRecognition = window.SpeechRecognition ||
                          window.webkitSpeechRecognition ||
                          window.mozSpeechRecognition ||
                          window.msSpeechRecognition ||
                          window.oSpeechRecognition;

    /**
     * The most recent result from the speech recognizer, used for a reporter block.
     * @type {String}
     */
    this.latest_speech = '';

    /**
     * The name of the selected voice for speech synthesis.
     * @type {String}
     */
    this.current_voice_name = 'default';

    /**
     * The current speech synthesis utterance object.
     * Storing the utterance prevents a bug in which garbage collection causes the onend event to fail.
     * @type {String}
     */
    this.current_utterance = null;

    this.runtime.HACK_SpeechBlocks = this;
};

/**
 * Retrieve the block primitives implemented by this package.
 * @return {object.<string, Function>} Mapping of opcode to Function.
 */
Scratch3SpeechBlocks.prototype.getPrimitives = function () {
    return {
        speech_whenihear: this.hatWhenIHear,
        speech_speak: this.speak,
        speech_setvoice: this.setVoice,
        speech_getlatestspeech: this.getLatestSpeech
    };
};

Scratch3SpeechBlocks.prototype.getHats = function () {
    return {
        speech_whenihear: {
            restartExistingThreads: false,
            edgeActivated: true
        }
    };
};

Scratch3SpeechBlocks.prototype.startSpeechRecogntion = function () {
    if (!this.recognition) {
        this.recognition = new this.SpeechRecognition();
        this.recognition.interimResults = true;
        this.recognized_speech = [];

        this.recognition.onresult = function (event) {
            const SpeechRecognitionResult = event.results[event.resultIndex];
            const results = [];
            for (let k = 0; k < SpeechRecognitionResult.length; k++) {
                results[k] = SpeechRecognitionResult[k].transcript.toLowerCase();
            }
            this.recognized_speech = results;

            this.latest_speech = this.recognized_speech[0];
        }.bind(this);

        this.recognition.onend = function () {
            this.recognition.start();
        }.bind(this);

        this.recognition.start();
    }
};
Scratch3SpeechBlocks.prototype.setVoice = function (args) {
    if (args.VOICE === 'Random') {
        const voices = this.getVoices();
        const index = Math.floor(Math.random() * voices.length);
        this.current_voice_name = voices[index].name;
    } else {
        this.current_voice_name = args.VOICE;
    }
};

Scratch3SpeechBlocks.prototype.getVoices = function () {
    if (typeof speechSynthesis === 'undefined') {
        return;
    }

    const voices = speechSynthesis.getVoices();

    const scratchVoiceNames = ['Alex', 'Samantha', 'Whisper', 'Zarvox', 'Bad News',
        'Daniel', 'Pipe Organ', 'Boing', 'Karen', 'Ralph', 'Trinoids'];

    let availableVoices = [];

    for (let i = 0; i < voices.length; i++) {
        if (scratchVoiceNames.includes(voices[i].name)) {
            availableVoices.push(voices[i]);
        }
    }

    return availableVoices;
};

Scratch3SpeechBlocks.prototype.hatWhenIHear = function (args) {
    const input = Cast.toString(args.STRING).toLowerCase();

    if (input === '') return false;

    for (let i = 0; i < this.recognized_speech.length; i++) {
        if (this.recognized_speech[i].includes(input)) {
            this.recognized_speech = [];
            return true;
        }
    }
    return false;
};

Scratch3SpeechBlocks.prototype.getLatestSpeech = function () {
    return this.latest_speech;
};

Scratch3SpeechBlocks.prototype.speak = function (args) {
    const input = Cast.toString(args.STRING).toLowerCase();

    // Stop any currently playing utterances
    speechSynthesis.cancel();

    this.current_utterance = new SpeechSynthesisUtterance(input);

    const voices = this.getVoices();
    for (let i = 0; i < voices.length; i++) {
        if (this.current_voice_name === voices[i].name) {
            this.current_utterance.voice = voices[i];
        }
    }

    speechSynthesis.speak(this.current_utterance);

    return new Promise(resolve => {
        this.current_utterance.onend = function () {
            resolve();
        };
    });
};

module.exports = Scratch3SpeechBlocks;
