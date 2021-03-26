const Cast = require('../util/cast');
const convert = require('../engine/parseSequence');
const Timer = require('../util/timer');
const convertBase = new convert();
const Color = require('../util/color');

class TouchBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The "answer" block value.
         * @type {string}
         */
        this._answer = '';

        /**
         * The timer utility.
         * @type {Timer}
         */
        this._timer = new Timer();

        /**
         * The stored microphone loudness measurement.
         * @type {number}
         */
        this._cachedLoudness = -1;

        /**
         * The time of the most recent microphone loudness measurement.
         * @type {number}
         */
        this._cachedLoudnessTimestamp = 0;

        /**
         * The list of queued questions and respective `resolve` callbacks.
         * @type {!Array}
         */
        this._questionList = [];

        this.positionsCopy = [];
        this.copyThePositions = true;
        this._time = 0;
        this.satellite = '';
        this._timeoutIds = [];
        this.actions = [];

        this.isSatelliteTouched = false;
        this.touchedSattleite = '';
        this.satelliteToCheck = '';

        this.runtime.on('TOUCH_EVENT_ONE', (args) => {
            if (this.runtime._editingTarget.blocks._scripts.length === 0) {
                return;
            } else {
                this.satellite = args.satellite;
                this.touchEventOne = true;
            }
        });

        console.log(this.runtime, ('from touch'));

        this.runtime.on('IS_TOUCHED', (data) => {
            if (data.touched === true) {
                this.touchedSattleite = data.sender;
                this.isSatelliteTouched = (data.touched) ? true : false;
            } else {
                this.touchedSattleite = '';
                this.isSatelliteTouched = (data.touched) ? true : false;
            };
            
            console.log(this.touchedSattleite, "touched sat", this.isSatelliteTouched, "is sat touched");
          });
  

        this.runtime.on('TOUCH_EVENT_SATELLITE', (args) => {
            const satellite = args.satellite;
            for (let i = 0; i < this.actions.length; i++) {
                    const keys = Object.keys(this.actions[i]);
                if (satellite === keys[0]) {
                    this.actions[i] = {[`${satellite}`]: true}
                    break;
                }
            }
            setTimeout(() => {
                this.resetTouchEvent(satellite);
            },2000)
        });

        this.runtime.on('MQTT_RECEIVED', (data) => {
            const parsedData = JSON.parse(data.message);
            for (let i = 0; i < this.actions.length; i++) {
              const keys = Object.keys(this.actions[i]);
              if (parsedData.action === keys[0]) {
                this.actions[i] = {[`${parsedData.action}`]: true}
                break;
              }
            }
          });

        this.runtime.on('STOP_SEQUENCE', () => {
            this.stopSequence();
        });
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            touch_whenAnySatTouched: this.whenAnySatTouched,
            touch_isTouched: this.isTouched,
            touch_waitUntilSatTouched: this.mqttWaitUntilSatTouched,
        };
    }

    resetTouchEvent(satellite) {
        for (let i = 0; i < this.actions.length; i++) {
                const keys = Object.keys(this.actions[i]);
            if (satellite === keys[0]) {
                this.actions[i] = {[`${satellite}`]: false}
                break;
            }
        }
    }

    stopSequence () {
        this._timeoutIds.forEach(id => clearTimeout(id));
        this._time = 0;
        let positions = ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000'];
        this.positionsCopy = [...positions];
        this.runtime.emit('PIXEL_EVENT_1', {
            type: 'sequence1',
            value: this.positionsCopy
        })
    }

    isTouched (args) {
        this.satelliteToCheck = args.SATELLITE;
        if(args.SATELLITE !== 'SATELLITE' || args.SATELLITE !== '' || args.SATELLITE !== undefined) {
            if(this.satelliteToCheck === this.touchedSattleite && this.isSatelliteTouched) {
                return true;
            } else {
                return false;
            }
        }
        return this.isSatelliteTouched;
      } 


    whenAnySatTouched (args, util) {
        let condition = false;
        if(args.SATELLITE !== 'SATELLITE' || args.SATELLITE !== '' || args.SATELLITE !== undefined) {
            if(args.SATELLITE === this.touchedSattleite && this.isSatelliteTouched){
                condition = true;
            } else {
                condition = false;
            }
        }

        if(!condition){
            util.yield();
        }
    }

    mqttWaitUntilSatTouched (args, util) {
        const condition = this.isSatelliteTouched;
        if (!condition) {
            util.yield();
        }
    }
}

module.exports = TouchBlocks;
