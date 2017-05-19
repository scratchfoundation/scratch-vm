var Cast = require('../util/cast');

var Scratch3SpeechBlocks = function (runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    this.runtime = runtime;

    /**
     * The most recent result from the speech recognizer, used for a reporter block.
     * @type {String}
     */
    this.latest_speech = '';

    /**
     * The name of the selected voice for speech synthesis.
     * @type {String}
     */
    this.current_voice = 'default';

    /**
     * The current speech synthesis utterance object.
     * Storing the utterance prevents a bug in which garbage collection causes the onend event to fail.
     * @type {String}
     */
    this.current_utterance;

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
        this.recognition = new webkitSpeechRecognition();
        this.recognition.interimResults = true;
        // this.recognition.continuous = true;
        this.recognized_speech = '';

        this.recognition.onresult = function (event) {
            this.recognized_speech = event.results[0][0].transcript.toLowerCase();
            this.latest_speech = this.recognized_speech;
        }.bind(this);

        this.recognition.onend = function () {
            this.recognition.start();
            this.recognized_speech = '';
        }.bind(this);

        this.recognition.start();
    }
};
Scratch3SpeechBlocks.prototype.setVoice = function (args) {
    this.current_voice = args.VOICE;
};

Scratch3SpeechBlocks.prototype.getVoices = function () {
    if(typeof speechSynthesis === 'undefined') {
        return;
    }

    const voices = speechSynthesis.getVoices();

    const scratchVoices = ['Alex', 'Samantha', 'Cellos', 'Whisper', 'Zarvox', 'Bells', 'Bad News',
        'Daniel', 'Fiona', 'Junior', 'Pipe Organ'];

    var availableVoices = [];

    for (let i = 0; i < voices.length; i++) {
        if (scratchVoices.includes(voices[i].name)) {
            availableVoices.push(voices[i]);
        }
    }

    return availableVoices;
};

Scratch3SpeechBlocks.prototype.hatWhenIHear = function (args) {
    var input = Cast.toString(args.STRING).toLowerCase();

    if (input === '') return false;

    if (this.recognized_speech.includes(input)) {
        this.recognized_speech = '';
        return true;
    }
    return false;
};

Scratch3SpeechBlocks.prototype.getLatestSpeech = function () {
    return this.latest_speech;
};

Scratch3SpeechBlocks.prototype.speak = function (args, util) {
    var input = Cast.toString(args.STRING).toLowerCase();

    // Stop any currently playing utterances
    speechSynthesis.cancel();

    this.current_utterance = new SpeechSynthesisUtterance(input);

    const voices = this.getVoices();
    for (let i = 0; i < voices.length; i++) {
        if (this.current_voice === voices[i].name) {
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
