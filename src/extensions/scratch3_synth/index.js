const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');
const formatMessage = require('format-message');
const Cast = require('../../util/cast');
const Timer = require('../../util/timer');

const Tone = require('./tone');


/**
 * Class for the translate block in Scratch 3.0.
 * @constructor
 */
class Scratch3SynthBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The synth object
         * @type {Synth}
         */
        this.synth = this._initSynth();
        this.targetFreq = this.synth.frequency.value;

        // effects chain
        this.autoWah = new Tone.AutoWah();
        this.autoWah.wet.value = 0;
        this.autoWah.sensitivity = -40;

        this.delay = new Tone.FeedbackDelay(0.25, 0.5);
        this.delay.wet.value = 0;

        this.panner = new Tone.Panner(0);

        this.synth.connect(this.delay);
        this.delay.connect(this.panner);
        this.panner.toMaster();

        //this.synth.connect(this.autoWah); // excluding autowah that is buggie
        //this.autoWah.connect(this.delay);
        //this.delay.connect(this.panner);
        //this.panner.toMaster();

        // notes
        this.scaleRoot = 48; // root is note C2
		    this.minNote = 24;
		    this.maxNote = 100;

    }

    /**
     * Initialize the synth and effect chain
     * @private
     */
    _initSynth (){

        var synthOptions = {
            oscillator: {
               type: "triangle"
            },
            envelope: {
              attack: 0.03,
              decay: 0,
              sustain: 1,
              release: 0.03
             },
        };

        var synth = new Tone.Synth(synthOptions);
        synth.setNote(Tone.Frequency(60, "midi"));
        synth.portamento = 0;

        return synth;
    }

    _clamp(input, min, max) {
			   return Math.min(Math.max(input, min), max);
		};

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
     * Check if the stack timer needs initialization.
     * @param {object} util - utility object provided by the runtime.
     * @return {boolean} - true if the stack timer needs to be initialized.
     * @private
     */
    _stackTimerNeedsInit (util) {
        return !util.stackFrame.timer;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'synth',
            name: 'Synth',
            menuIconURI: '', // TODO: Add the final icons.
            blockIconURI: '',
            blocks: [
                {
                    opcode: 'synthOnFor',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthOnFor',
                        default: 'turn synth on for [SECS] seconds',
                        description: 'turn synth on for a number of seconds'
                    }),
                    arguments: {
                        SECS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'synthOnForAndWait',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthOnForAndWait',
                        default: 'turn synth on for [SECS] seconds and wait',
                        description: 'turn synth on for a number of seconds and wait'
                    }),
                    arguments: {
                        SECS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'synthOn',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthOn',
                        default: 'turn synth on',
                        description: 'turn syntn on'
                    })
                },
                {
                    opcode: 'synthOff',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthOff',
                        default: 'turn synth off',
                        description: 'turn synth off'
                    }),
                    arguments: {
                        SECS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'synthSetNote',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthSetNote',
                        default: 'synth set [NOTE_TYPE] [NOTE]',
                        description: 'set note or frequency to synth'
                    }),
                    arguments: {
                        NOTE_TYPE: {
                          type: ArgumentType.STRING,
                          menu: 'note_type',
                          defaultValue: 'note'
                        },
                        NOTE: {
                          type: ArgumentType.NUMBER,
                          defaultValue: '60'
                        }
                    }
                },
                {
                    opcode: 'synthChangeNote',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthChangeNote',
                        default: 'synth change [NOTE_TYPE] by [NOTE]',
                        description: 'change note or frequency to synth'
                    }),
                    arguments: {
                        NOTE_TYPE: {
                          type: ArgumentType.STRING,
                          menu: 'note_type',
                          defaultValue: 'note'
                        },
                        NOTE: {
                          type: ArgumentType.NUMBER,
                          defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'synthGetNote',
                    blockType: BlockType.REPORTER,
                    text:  formatMessage({
                        id: 'synth.synthGetNote',
                        default: 'synth [NOTE_TYPE]',
                        description: 'get the value of current note or frequency'
                    }),
                    arguments: {
                        NOTE_TYPE: {
                            type: ArgumentType.STRING,
                            menu: 'note_type',
                            defaultValue: 'note'
                        }
                    }
                },
                {
                    opcode: 'synthSetEffect',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthSetEffect',
                        default: 'set synth [EFFECT_TYPE] to [EFFECT_VALUE] %',
                        description: 'set effect to synth'
                    }),
                    arguments: {
                        EFFECT_TYPE: {
                          type: ArgumentType.STRING,
                          menu: 'effect_type',
                          defaultValue: 'echo'
                        },
                        EFFECT_VALUE: {
                          type: ArgumentType.NUMBER,
                          defaultValue: '100'
                        }
                    }
                },
                {
                    opcode: 'synthChangeEffect',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthChangeEffect',
                        default: 'change synth [EFFECT_TYPE] by [EFFECT_VALUE] %',
                        description: 'change effect to synth'
                    }),
                    arguments: {
                        EFFECT_TYPE: {
                          type: ArgumentType.STRING,
                          menu: 'effect_type',
                          defaultValue: 'echo'
                        },
                        EFFECT_VALUE: {
                          type: ArgumentType.NUMBER,
                          defaultValue: '100'
                        }
                    }
                },
                {
                    opcode: 'clearEffects',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.clearEffects',
                        default: 'clear all effects',
                        description: 'clear all effects'
                    })
                },
                {
                    opcode: 'synthSetOscType',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'synth.synthSetOscType',
                        default: 'synth oscillator type [OSC_TYPE]',
                        description: 'change oscillator type'
                    }),
                    arguments: {
                        OSC_TYPE: {
                          type: ArgumentType.STRING,
                          menu: 'oscillator_type',
                          defaultValue: 'square'
                        }
                    }
                },
            ],
            menus: {
                note_type: ['note', 'frequency'],
                oscillator_type: ['sine', 'triangle', 'square', 'sawtooth', 'pwm'],
                effect_type: ['echo', /*'wah',*/ 'pan left/right', 'glide', 'volume']
            }
        };
    }

    synthOnFor (args) {
        let durationSec = Cast.toNumber(args.SECS);
        this.synth.triggerAttackRelease(this.targetFreq, durationSec);
    }

    synthOnForAndWait (args, util) {
        if (this._stackTimerNeedsInit(util)) {
            let durationSec = Cast.toNumber(args.SECS);
            this.synth.triggerAttackRelease(this.targetFreq, durationSec);
            this._startStackTimer(util, durationSec);
        } else {
            this._checkStackTimer(util);
        }
    }

    synthOn () {
	       this.synth.triggerAttack(this.targetFreq);
		}

		synthOff () {
	       this.synth.triggerRelease();
		}

    synthSetNote (args) {
        let val = Cast.toNumber(args.NOTE);
        switch (args.NOTE_TYPE) {
            case 'note':
              let note = this._clamp(val, this.minNote, this.maxNote);
              this.targetFreq = Tone.Frequency(note, "midi");
              break;
            case 'frequency':
              this.targetFreq = val;
              break;
        }
        this.synth.setNote(this.targetFreq);
    }

    synthChangeNote (args) {
        let val = Cast.toNumber(args.NOTE);
  		  switch (args.NOTE_TYPE) {
    				case 'note':
      					var ratio = Tone.intervalToFrequencyRatio(val);
      					this.targetFreq *= ratio;
      					break;
      			case 'frequency':
    					  this.targetFreq += val;
    					  break;
    			}
        this.synth.setNote(this.targetFreq);
		}

    synthGetNote (args) {
        switch(args.NOTE_TYPE){
            case 'note':
                return Tone.Frequency(this.targetFreq).toMidi();
            case 'frequency':
                return this.targetFreq;
        }
    }

    synthSetEffect (args) {
        let val = this._clamp(args.EFFECT_VALUE, 0, 100);
  			val /= 100;
        console.log(args.EFFECT_VALUE + ' --> ' + val);

  			switch (args.EFFECT_TYPE) {
    				case 'echo':
      					this.delay.wet.value = val/2;
      					break;
    				case 'wah':
      					if (val == 0) {
      						this.autoWah.wet.value = 0;
      					} else {
      						this.autoWah.wet.value = 1;
      					}
                this.autoWah.Q.value = val * 6;
                break;
    				case 'pan left/right':
      					this.panner.pan.value = (val-0.5)*2;
      					break;
    				case 'glide':
      					this.synth.portamento = val * 0.25;
      					break;
    				case 'volume':
      					var db = Tone.gainToDb(val);
      					Tone.Master.volume.rampTo(db, 0.01);
      					break;
  			}
    }

    synthChangeEffect (args) {

        let val = Cast.toNumber(args.EFFECT_VALUE) / 100;
        console.log(args.EFFECT_VALUE + ' --> ' + val);

        switch(args.EFFECT_TYPE){
            case 'echo':
                this.delay.wet.value += val/2;
                this.delay.wet.value = this._clamp(this.delay.wet.value, 0, 0.5);
                break;
            case 'wah':
                this.autoWah.Q.value += val * 6;
                this.autoWah.Q.value = this._clamp(this.autoWah.Q.value, 0, 6);
                /*if (this.autoWah.Q.value == 0) {
                  this.autoWah.wet.value = 0;
                } else {
                  this.autoWah.wet.value = 1;
                }*/
                break;
            case 'pan left/right':
                this.panner.pan.value += val;
                this.panner.pan.value = this._clamp(this.panner.pan.value, 0, 1);
                break;
            case 'glide':
                this.synth.portamento += val * 0.25;
                break;
            case 'volume':
                var currentDb = Tone.Master.volume.value;
                var currentVol = Tone.dbToGain(currentDb);
                var newVol = currentVol + val;
                newVol = this._clamp(newVol, 0, 1);
                var db = Tone.gainToDb(newVol);
                Tone.Master.volume.rampTo(db, 0.01);
                break;
      }
    }

    clearEffects (args) {
        this.delay.wet.value = 0;
  			this.autoWah.Q.value = 0;
  			this.autoWah.wet.value = 0;
  			this.panner.pan.value = 0.5;
  			this.synth.portamento = 0;
  			Tone.Master.volume.rampTo(0, 0.01);
    }


    synthSetOscType (args) {
        this.synth.oscillator.type = args.OSC_TYPE;
		}

}
module.exports = Scratch3SynthBlocks;
