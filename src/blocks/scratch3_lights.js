/* eslint-disable linebreak-style */
const Cast = require('../util/cast');
const convert = require('../engine/parseSequence');
const convertBase = new convert();
const Color = require('../util/color');
const SoundData = require('../import/SoundFiles/soundData');
const Timer = require('../util/timer');

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
        // if (args.VALUE === '' ||
        //     args.VALUE === 'Message' ||
        //     args.SATELLITE === '' ||
        //     args.SATELLITE === 'Satellite #') {
        //     return;
        // }

        // this.runtime.emit('SEND_TOUCH_ONE', {
        //     value: message,
        //     satellite: satellite
        // });

        // this.satellite = '';
    }

    startSequence (args) {
        const value = args.value;
        const satellite = args.satellite;
        console.log(args, 'args from startSequence');
        if (this.props.vm.client !== null) {
            if (value.includes('LS')) {
                const topic = `sat/${satellite}/cmd/fx`;
                const message = args.value;
                console.log(topic, message, 'topic and message from startSequence');
                // this.props.vm.client.publish(topic, message);
            } else {
                const topic = `sat/${satellite}/sound/fx`;
                const message = value;
                this.props.vm.client.publish(topic, message);
            }
        }
        // this.runtime.emit('SEQUENCE_STARTED');
        // let seq = '';
        // let splitArgs = [];
        // let loopAmount = '';
        // splitArgs = args.VALUE.split(',');
        // const splitForLoopNum = splitArgs[0].split(':');
        // (splitForLoopNum[1].trim() === '-1') ? loopAmount = 100 : loopAmount = splitForLoopNum[1].trim();
        // const sat = require(`!raw-loader!../import/SatelliteFiles/${splitArgs[1]}`);
        // const split = sat.default.split('\n');
        // console.log(split, 'split');
        // const filtered = split.filter(e => e === 0 || e);
        // console.log(filtered, 'filtered');
        // seq = filtered.join(',');
        // console.log(seq, 'seq');
        // const stringSplit = seq.split(',');
        // console.log(stringSplit, 'stringSplit');
        // const filteredList = stringSplit.filter(e => e === 0 || e === '' || e);
        // console.log(filteredList, 'filteredList');
        // let arrayLength = filteredList.length;
        // console.log(arrayLength, 'arrayLength');
        // const pos = [];
        // const totalPos = [];
        // let count = 0;
        // let j = 0;
        // while (arrayLength > 0) {
        //     console.log(filteredList[j], 'filteredL');
        //     while (filteredList[j].includes('L')) {
        //         pos.push(filteredList[j]);
        //         j++;
        //         arrayLength--;
        //         console.log(j, 'jINL');
        //         count++;
        //     }
        //     totalPos.push(pos.join(','));
        //     if (filteredList[j].includes('D')) {
        //         console.log(filteredList[j], 'filteredD');
        //         totalPos.push(filteredList[j]);
        //         j++;
        //         console.log(j, 'jIND');
        //         pos.length = 0;
        //         arrayLength--;
        //         count++;
        //     }
        // }
        // console.log(totalPos, 'totalPOS');
        // console.log(count, 'count');
        // while (loopAmount > 0) {
        //     const positions = ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff'];
        //     for (let i = 0; i < totalPos.length; i++) {
        //         if (this.copyThePositions) {
        //             this.positionsCopy = [...positions];
        //         }
        //         let splitHex = '';
        //         if (totalPos[i].includes('L')) {
        //             if (totalPos[i].includes(',')) {
        //                 const splitted = totalPos[i].split(',');
        //                 console.log(splitted, 'splitted');
        //                 let splitLength = splitted.length;
        //                 let k = 0;
        //                 while (splitLength > 0) {
        //                     this.copyThePositions = false;
        //                     splitHex = splitted[k].split(' ');
        //                     console.log(splitHex, 'splitHex');
        //                     const convertedHSV = this.convertHSVBrightness(`#${splitHex[1]}`);
        //                     console.log(convertedHSV, 'convertedHSV');
        //                     const converted = convertBase.convertBase(splitHex[2]);
        //                     for (let i = 0; i < converted.length; i++) {
        //                         // this.positionsCopy.splice(converted[i], 1, `${this.shadeHexColor(splitHex[1], 10)}`);
        //                         this.positionsCopy.splice(converted[i], 1, convertedHSV);
        //                     }
        //                     splitLength--;
        //                     k++;
        //                 }
        //                 console.log(this.positionsCopy, 'POSITIONSCOPY');
        //                 console.log(splitHex[3], 'SPLITTIME');
        //                 const sequence = [...this.positionsCopy];
        //                 // const message = ['', sequence];
        //                 const timeoutId = setTimeout(() => {
        //                     this.runtime.emit('PIXEL_EVENT_1', {
        //                         type: 'sequence1',
        //                         value: sequence
        //                     });
        //                 }, this._time += Cast.toNumber(10));
        //                 this._timeoutIds.push(timeoutId);
        //             } else {
        //                 this.copyThePositions = false;
        //                 splitHex = totalPos[i].split(' ');
        //                 console.log(splitHex, 'splitHex');
        //                 const converted = convertBase.convertBase(splitHex[2]);
        //                 console.log(converted, 'converted');
        //                 const convertedHSV = this.convertHSVBrightness(`#${splitHex[1]}`);
        //                 for (let i = 0; i < converted.length; i++) {
        //                     this.positionsCopy.splice(converted[i], 1, convertedHSV);
        //                 }
        //                 console.log(this.positionsCopy, 'POSITIONSCOPYinNOCOMMA');
        //                 console.log(splitHex[3], 'SPLITTIME');
        //                 const sequence = [...this.positionsCopy];
        //                 const timeoutId = setTimeout(() => {
        //                     this.runtime.emit('PIXEL_EVENT_1', {
        //                         type: 'sequence1',
        //                         value: sequence
        //                     });
        //                 }, this._time += Cast.toNumber(10));
        //                 this._timeoutIds.push(timeoutId);
        //             }
        //         } else {
        //             const splitHex = totalPos[i].split(' ');
        //             const sequence = [...this.positionsCopy];
        //             const timeoutId = setTimeout(() => {}, this._time += Cast.toNumber(splitHex[1]));
        //             this._timeoutIds.push(timeoutId);
        //             this.copyThePositions = true;
        //         }
        //     }
        //     loopAmount--;
        // }
        // // const splitHex = totalPos[1].split(' ');
        // const positions = ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000'];
        // const timeoutId = setTimeout(() => {
        //     this.runtime.emit('PIXEL_EVENT_1', {
        //         type: 'sequence1',
        //         value: positions
        //     });
        //     this._time = 0;
        //     this.runtime.emit('SEQUENCE_ENDED');
        // }, this._time += Cast.toNumber(200));
        // this._timeoutIds.push(timeoutId);
    }
}

module.exports = LightBlocks;
