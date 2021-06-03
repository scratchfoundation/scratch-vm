const Cast = require('../util/cast');
const convert = require('../engine/parseSequence');
const convertBase = new convert();
const Color = require('../util/color');
const SoundData = require('../import/SoundFiles/soundData');
const Timer = require('../util/timer');

class VirtualSatBlocks {
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
            virtualsat_stopEvent: this.stopEvent,
            virtualsat_addNewVirtualSat: this.addNewSat,
            virtualsat_setRadarSensitivities: this.setRadarSensitivity,
            virtualsat_cycleSatellitePower: this.cycleSatellitePower,
            virtualsat_rebootSatellite: this.rebootSatellite
        };
    }

    getHats () {
        return {
            event_whenstarted: {
                restartExistingThreads: true
            }
        };
    }

    cycleSatellitePower () {
        this.runtime.emit('CYCLE_POWER');
    }

    rebootSatellite (args) {
        this.runtime.emit('REBOOT_SATELLITE', args);
    }

    stopSequence () {
        this._timeoutIds.forEach(id => clearTimeout(id));
        this._time = 0;
        const positions = ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000'];
        this.positionsCopy = [...positions];
        this.runtime.emit('PIXEL_EVENT_1', {
            type: 'sequence1',
            value: this.positionsCopy
        });
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

    setRadarSensitivity (args) {
        this.runtime.emit('SET_RADAR', args);
    }


    addNewSat (args, util) {
        console.log(args.NAME, 'args');
        if (args.NAME === undefined) {
            return;
        }
        this.runtime.emit('ADD_NEW', {
            name: args.NAME
        });
    }

    stopEvent (args, util) {
        if (args.SATELLITE && args.VALUE) {
            const message = args.VALUE;
            const satList = args.SATELLITE.split(' ');
            for (let i = 0; i < satList.length; i++) {
                const topic = `sat/${satList[i]}/cmd/fx`;
                this.runtime.emit('STOP_EVENT', {
                    topic: topic,
                    message: message
                });
            }
        }
    }

}

module.exports = VirtualSatBlocks;
