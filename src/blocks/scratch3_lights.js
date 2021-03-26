/* eslint-disable linebreak-style */
const Cast = require('../util/cast');
const Color = require('../util/color');

class LightBlocks {
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

    getPrimitives () {
        return {
            lights_startsequence: this.startSequence,
            lights_sendMessage: this.mqttSendMessage
        };
    }

    convertHSVBrightness (hex) {
        const rgb = Color.hexToRgb(hex);
        const hsv = Color.rgbToHsv(rgb);
        const newHSV = {
            h: hsv.h,
            s: hsv.s,
            v: (hsv.v === 0) ? hsv.v : hsv.v + Cast.toNumber(5)
        };
        const newRGB = Color.hsvToRgb(newHSV);
        const newHEX = Color.rgbToHex(newRGB);
        return newHEX;
    }
    
    mqttSendMessage (args, util) {
        console.log(args, 'from mqttSendMessage');
        const message = args.VALUE;
        const satellite = args.SATELLITE;
        const topic = `sat/${satellite}/cmd/fx`;
        if (message.includes('LS')) {
            const data = {
                topic: topic,
                message: message
            };
            this.runtime.emit('PUBLISH_TO_CLIENT', data);
        } else {
            const newMessage = `LS: 5,${message}.txt`;
            const data = {
                topic: topic,
                message: newMessage
            };
            this.runtime.emit('PUBLISH_TO_CLIENT', data);
        }
    }

    startSequence (args) {
        const value = args.value;
        const satellite = args.satellite;
        if (this.props.vm.client !== null) {
            if (value.includes('LS')) {
                const topic = `sat/${satellite}/cmd/fx`;
                const message = args.value;
            } else {
                const topic = `sat/${satellite}/sound/fx`;
                const message = value;
                this.props.vm.client.publish(topic, message);
            }
        }
    }
}

module.exports = LightBlocks;
