const Cast = require('../util/cast');
const convert = require('../engine/parseSequence');
const convertBase = new convert();
const Color = require('../util/color');
const SoundData = require('../import/SoundFiles/soundData');
const Timer = require('../util/timer');

class MovementBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.positionsCopy = [];
        this.copyThePositions = true;
        this._time = 0;
        this.satellite = '';
        this._timeoutIds = [];
        this.actions = [];
        this.sensingSattelite = '';
        this.isSatelliteSensing = false;
        this.satelliteToCheck = '';

        this.runtime.on('HAS_PRESENCE', data => {
            console.log(data, 'data from issensed movement');
            if (data.sensing === '1') {
                this.sensingSattelite = data.satellite;
                this.isSatelliteSensing = true;
            } else {
                this.sensingSattelite = '';
                this.isSatelliteSensing = false;
            }
            this.translateMovementInput(data);
            console.log(this.sensingSattelite, 'sensed sat', this.isSatelliteSensing, 'is sat sensed');
        });

        this.runtime.on('TOUCH_EVENT_SATELLITE', args => {
            const satellite = args.satellite;
            for (let i = 0; i < this.actions.length; i++) {
                const keys = Object.keys(this.actions[i]);
                if (satellite === keys[0]) {
                    this.actions[i] = {[`${satellite}`]: true};
                    break;
                }
            }
            setTimeout(() => {
                this.resetTouchEvent(satellite);
            }, 2000);
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
            movement_arePresencesSensed: this.arePresencesSensed,
            movement_waitUntilSatSensing: this.mqttWaitUntilSatSensing,
            movement_whenAnyPresenceSensed: this.whenAnyPresenceSensed
        };
    }

    resetTouchEvent (satellite) {
        for (let i = 0; i < this.actions.length; i++) {
            const keys = Object.keys(this.actions[i]);
            if (satellite === keys[0]) {
                this.actions[i] = {[`${satellite}`]: false};
                break;
            }
        }
    }

    arePresencesSensed (args) {
        if (args.SATELLITE !== 'SATELLITE' || args.SATELLITE !== '' || args.SATELLITE !== undefined) {
            const satList = args.SATELLITE.split(' ');
            for (let i = 0; i < satList.length; i++) {
                this.satelliteToCheck = satList[i];
                if (this.satelliteToCheck === this.sensingSattelite && this.isSatelliteSensing) {
                    return true;
                }
            }
        }    
        return this.isSatelliteSensing;
    }

    whenAnyPresenceSensed (args, util) {
        let condition = false;
        if (args.SATELLITE !== 'SATELLITE' || args.SATELLITE !== '' || args.SATELLITE !== undefined) {
            if (args.SATELLITE === this.sensingSattelite && this.isSatelliteSensing){
                condition = true;
            } else {
                condition = false;
            }
        }

        if (!condition){
            util.yield();
        }
    }

    mqttWaitUntilSatSensing (args, util) {
        const condition = this.isSatelliteSensing;
        if (!condition) {
            util.yield();
        }
    }

    translateMovementInput (data) {
        const target = this.runtime.getTargetForStage();
        const uniqueBroadcastVar = target.lookupBroadcastMsg('', `sat/${data.satellite}/ev/radar`);
        const wildBroadcastVar = target.lookupBroadcastMsg('', `sat/+/ev/radar`);
        if (uniqueBroadcastVar) {
            this.runtime.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: `sat/${data.satellite}/ev/radar`
            });
        }
        if (wildBroadcastVar) {
            this.runtime.startHats('event_whenbroadcastreceived', {
                BROADCAST_OPTION: `sat/+/ev/radar`
            });
        }
    }

}

module.exports = MovementBlocks;
