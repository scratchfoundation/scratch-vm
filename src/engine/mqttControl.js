/* eslint-disable linebreak-style */
const decoder = new TextDecoder();
const EventEmitter = require('events');
const satellites = {};
// import SoundFiles from '../lib/soundFiles';

class MqttControl extends EventEmitter{
    constructor (runtime) {
        super();
        this.positionsCopy = [];
        this.copyThePositions = true;
        this._time1 = 0;
        this._time2 = 0;
        this._time3 = 0;
        this._time4 = 0;
        this._soundsByName = {};
        this._timeoutIds = [];
        this._timeoutIds1 = [];
        this._timeoutIds2 = [];
        this._timeoutIds3 = [];
        this._timeoutIds4 = [];
        this._satId = '';
        this.NOT_FOUND = ' ';
        this.runtime = runtime;

        this.isSatelliteTouched = false;

        this.runtime.on('PLAY_SOUND_MQTT', data => {
            this.playSoundMQTT(data);
        });
        this.runtime.on('STOP_SEQUENCE', () => {
            this.stopSequences();
        });
        this.runtime.on('STOP_SEQUENCE_1', () => {
            this.stopSequences1();
        });
        this.runtime.on('STOP_SEQUENCE_2', () => {
            this.stopSequences1();
        });
        this.runtime.on('STOP_SEQUENCE_3', () => {
            this.stopSequences1();
        });
        this.runtime.on('STOP_SEQUENCE_4', () => {
            this.stopSequences1();
        });

    }
    

    static findSatelliteName (name) {
        switch (name) {
        case `${this.props.satOneName}`:
            return 1;
        case `${this.props.satTwoName}`:
            return 2;
        case `${this.props.satThreeName}`:
            return 3;
        case `${this.props.satFourName}`:
            return 4;
        }
    }


    static onMessage (topic, payload, runtime) {
        // console.log(`onMessage fired for topic: ${topic}, payload: ${payload}`);
        this.runtime = runtime;
        const t = topic.split('/');
        console.log(topic, 'topics');
        if (topic === null || t.count < 2) return;
        if (t[0] === 'sat' && t[1] === 'Virtual Sat' && t[2] === 'ev' && t[3] === 'touch') {
            let isTouched = false;
            const message = decoder.decode(payload);
            if (message === '1') {
                isTouched = true;
            } else {
                isTouched = false;
            }
            const data = {
                sender: t[1],
                touched: isTouched
            };
            this.runtime.emit('IS_TOUCHED', data);
        } else if (t[0] === 'app' && t[1] === 'menu' && t[2] === 'mode') {
            this.props.vm.modeHandler(payload); // this is a presence message
        } else if (t[0] === 'sat' && t[2] === 'cmd' && t[3] === 'fx') {
            const message = decoder.decode(payload);
            // this.props.setProjectState(true);
            console.log(topic, message, 'DISPLAYMESSAGE');
            if (message === 'LS: STOPCLEAR' || message.includes('AS') || message === 'Stop') {
                return;
            }
            const satellite = this.findSatelliteName(t[1]);
            if (satellite === 1) {
                console.log(this._time1, 'time1');
                if (this._time1 > 1) {
                    this.stopSequences1();
                    setTimeout(() => {
                        this.displaySequence1(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence1(satellite, message);
                }
            } else if (satellite === 2) {
                if (this._time2 > 1) {
                    this.stopSequences2();
                    setTimeout(() => {
                        this.displaySequence2(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence2(satellite, message);
                }
            } else if (satellite === 3) {
                if (this._time3 > 1) {
                    this.stopSequences3();
                    setTimeout(() => {
                        this.displaySequence3(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence3(satellite, message);
                }
            } else if (satellite === 4) {
                if (this._time4 > 1) {
                    this.stopSequences4();
                    setTimeout(() => {
                        this.displaySequence4(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence4(satellite, message);
                }
            }
         
        } else if (t[1] === 'sat' && t[3] === 'cmd' && t[4] === 'fx') {
            const message = decoder.decode(payload);
            this.props.setProjectState(true);
            console.log(topic, message, 'DISPLAYMESSAGE');
            if (message === 'LS: STOPCLEAR' || message.includes('AS')) {
                return;
            }
            console.log(topic, 'topicWE HIT!');
            const satellite = this.findSatelliteName(t[2]);
            if (satellite === 1) {
                console.log(this._time1, 'time1');
                if (this._time1 > 1) {
                    this.stopSequences1();
                    setTimeout(() => {
                        this.displaySequence1(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence1(satellite, message);
                }
            } else if (satellite === 2) {
                if (this._time2 > 1) {
                    this.stopSequences2();
                    setTimeout(() => {
                        this.displaySequence2(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence2(satellite, message);
                }
            } else if (satellite === 3) {
                if (this._time3 > 1) {
                    this.stopSequences3();
                    setTimeout(() => {
                        this.displaySequence3(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence3(satellite, message);
                }
            } else if (satellite === 4) {
                if (this._time4 > 1) {
                    this.stopSequences4();
                    setTimeout(() => {
                        this.displaySequence4(satellite, message);
                    }, 100);
                } else {
                    this.displaySequence4(satellite, message);
                }
            }
        
        } else if (t[0] === 'sat' && t[2] === 'ev' && t[3] === 'touch') {
            const message = decoder.decode(payload);
            console.log(topic[1], 'topic');
            console.log(message, 'message');
            // this.props.setProjectState(true);
            this.touchHandler(t[1], message);
        } else if (t[0] === 'sat' && t[2] === 'online') {
            this._satelliteStatusHandler(t[1]);
        } else if (t[0] === 'fwserver' && t[1] === 'files') {
            this.firmwareHandler(payload);
        } else if (t[0] === 'sat' && t[2] === 'ev' && t[3] === 'radar') {
            const message = decoder.decode(payload);
            const data = {
                satellite: t[1],
                sensing: message
            };
            this.runtime.emit('HAS_PRESENCE', data);
        }
    }

    static _satelliteStatusHandler (sender) {
        // log.info(`satelliteStatusHandler fired for sender: ${sender}`);
        satellites[sender] = {
            isTouched: false,
            hasPresence: false
        };
        this.runtime.emit('SET_SATELLITE_VARS', sender);
        this.runtime.emit('SET_SATELLITES', satellites);
    }

    static firmwareHandler (payload) {
        // log.info(`firmware handler fired`);
        const json = JSON.parse(payload);
        const files = json.files;
        this.setupSoundVar(files);
        // this._setupLightVar(files);
        // this._runtime.emit(this._runtime.constructor.PERIPHERAL_LIST_UPDATE, this._satellites);
    }

    static setupSoundVar (names) {
        const wavs = names.filter(currentValue => (currentValue.includes('.wav')));
        const soundsByName = {Silence: 'AS: STOP'};
        wavs.forEach(currentValue => {
            const val = currentValue.replace('.wav', '');
            soundsByName[val] = `AS: 1,${currentValue}`;
        });
        this._soundsByName = Object.freeze(soundsByName);

        this.runtime.emit('SET_SOUND_VARS', wavs);
    }

    static touchHandler (sender, payload) {
        // log.info(`touchHandler fired for payload: ${payload}`);
        if (!sender.includes('BC')) {
            return;
        }
        this.satellites[sender].isTouched = payload[0] === 0x31;
        console.log(payload, 'TOUCHpayload');
        if (payload === '1') {
            this.runtime.emit('IS_TOUCHED', {
                sender: sender,
                touched: true
            });
            console.log('hit for payload 1');
        } else {
            this.runtime.emit('IS_TOUCHED', {
                sender: sender,
                touched: false
            });
            console.log('hit for payload 0');
        }
    }

    static isTouched (sat) {
        // const sat = this.findSatelliteSerial(satellite);
        console.log(sat, 'sat');
        return sat &&
        sat !== this.NOT_FOUND &&
        this.satellites &&
        this.satellites !== this.NOT_FOUND &&
        this.satellites[sat] &&
        this.satellites[sat] !== this.NOT_FOUND &&
        this.satellites[sat].isTouched;
    }

    static hasPresence (sat) {
        console.log(sat, 'sat from has Presence');
        return sat &&
        sat !== this.NOT_FOUND &&
        this.satellites &&
        this.satellites !== this.NOT_FOUND &&
        this.satellites[sat] &&
        this.satellites[sat] !== this.NOT_FOUND &&
        this.satellites[sat].hasPresence;
    }

}

module.exports = MqttControl;
