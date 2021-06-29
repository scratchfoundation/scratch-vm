/* eslint-disable linebreak-style */
const decoder = new TextDecoder();
const EventEmitter = require('events');
const satellites = {};
const userSubTopics = [];
let _sequencesByName = {};
// import SoundFiles from '../lib/soundFiles';
let touchedSatVars = {
    ALL_SAT_TOUCH_SATID: '',
    ALL_SAT_TOUCH_VALUE: 0
};

let radarSatVars = {
    ALL_SAT_RADAR_SATID: '',
    ALL_SAT_RADAR_VALUE: 0
};

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
        this.runtime.on('SEND_SOUND', data => {
            this.playSound(data);
        });
        this.runtime.on('SEQUENCE_STARTED', data => {
            this.playLightSequence(data);
        });
        this.runtime.on('ADD_SUB_MQTTCONTROL', topic => {
            this.addUserSub(topic);
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
        this.runtime = runtime;
        const t = topic.split('/');
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
            this.runtime.emit('TOUCH_TO_MESSAGE', data, topic);
        } else if (t[0] === 'app' && t[1] === 'menu' && t[2] === 'mode') {
            if (this.props) {
                this.props.vm.modeHandler(payload); // this is a presence message
            }
        } else if (t[0] === 'alias') {
            const parsedPayload = decoder.decode(payload);
            if (this.IsJson(parsedPayload)) {
                const json = JSON.parse(parsedPayload);
                const data = {
                    payload: json,
                    alias: t[1]
                };
                this.setAliasVars(topic, data, t);
            }
        } else if (t[0] === 'group') {
            const parsedPayload = decoder.decode(payload);
            if (this.IsJson(parsedPayload)) {
                const json = JSON.parse(parsedPayload);
                const data = {
                    payload: json,
                    group: t[1]
                };
                this.setGroupVars(topic, data, t);
            }
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
            this.setTouchVars(topic, message, t);
            this.touchHandler(t[1], message, topic);
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
            this.setRadarVars(topic, message, t);
            this.runtime.emit('HAS_PRESENCE', data);
            this.runtime.emit('RADAR_TO_MESSAGE', data, topic);
        } else if (userSubTopics.includes(topic)) {
            const parsedPayload = decoder.decode(payload);
            const data = {
                payload: parsedPayload,
                topic: topic
            };
            console.log('pub matching user input sub topic', data)
            this.runtime.emit('USER_SUB_MQTT_PUB', data);
        }
    }

    static setTouchVars (topic, message, t) {
        touchedSatVars = {
            ALL_SAT_TOUCH_SATID: t[1],
            ALL_SAT_TOUCH_VALUE: message
        };
        this.runtime.emit('SET_TOUCH_VARS', touchedSatVars);
    }

    static setRadarVars (topic, message, t) {
        radarSatVars = {
            ALL_SAT_RADAR_SATID: t[1],
            ALL_SAT_RADAR_VALUE: message
        };
        this.runtime.emit('SET_RADAR_VARS', radarSatVars);
    }

    static setAliasVars (topic, data, t) {
        if (t[0] === 'alias') {
            const aliasVar = {
                alias: t[1],
                payload: data.payload
            };
            this.runtime.emit('SET_ALIAS_VARS', aliasVar);
        }
    }

    static setGroupVars (topic, data, t) {
        if (t[0] === 'group') {
            const groupVar = {
                group: t[1],
                payload: data.payload
            };
            this.runtime.emit('SET_GROUP_VARS', groupVar);
        }
    }

    static _satelliteStatusHandler (sender) {
        // log.info(`satelliteStatusHandler fired for sender: ${sender}`);
        satellites[sender] = {
            isTouched: false,
            hasPresence: false
        };
        touchedSatVars.ALL_SAT_TOUCH_SATID = sender;
        radarSatVars.ALL_SAT_RADAR_SATID = sender;
        this.runtime.emit('SET_SATELLITE_VARS', sender);
        this.runtime.emit('SET_ALL_SATELLITES', satellites);
        this.runtime.emit('SET_TOUCH_VARS', touchedSatVars);
        this.runtime.emit('SET_RADAR_VARS', radarSatVars);
    }

    static firmwareHandler (payload) {
        // log.info(`firmware handler fired`);
        const json = JSON.parse(payload);
        const files = json.files;
        this.setupSoundVar(files);
        this.setupLightVar(files);
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

    static setupLightVar (names) {
        // const stage = this.runtime.getTargetForStage();
        const txts = names.filter(currentValue => (currentValue.includes('.txt')));
        const sequencesByName = {
            'Clear': 'LS: CLEAR',
            'Pause': 'LS: PAUSE',
            'Stop': 'LS: STOP',
            'Stop and Clear': 'LS: STOPCLEAR'
        };
        txts.forEach(currentValue => {
            const val = currentValue.replace('.txt', '');
            sequencesByName[val] = `LS: -1,${currentValue}`;
        });
        _sequencesByName = Object.freeze(sequencesByName);
        
        // Setup the variable
        this.runtime.emit('SET_LIGHTS', txts);
        console.log(_sequencesByName, 'sequences');
    }

    static touchHandler (sender, payload, topic) {
        // log.info(`touchHandler fired for payload: ${payload}`);
        if (!sender.includes('BC')) {
            return;
        }
        satellites[sender].isTouched = payload[0] === 0x31;
        console.log(payload, 'TOUCHpayload');
        if (payload === '1') {
            this.runtime.emit('IS_TOUCHED', {
                sender: sender,
                touched: true
            });
            this.runtime.emit('TOUCH_TO_MESSAGE', sender, topic);
            console.log('hit for payload 1');
        } else {
            this.runtime.emit('IS_TOUCHED', {
                sender: sender,
                touched: false
            });
            console.log('hit for payload 0');
        }
    }

    static addUserSub (topic) {
        if (!userSubTopics.includes(topic)) {
            userSubTopics.push(topic);
        }
        console.log(`current array of User Subscriptions from Mqtt Control: ${userSubTopics}`)
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

    static playSoundMQTT (args, runtime) {
        this.runtime = runtime;
        console.log('PlaySoundMQTT', args);
        if (this._soundsByName !== undefined) {
            const outboundTopic = `sat/${args.SATELLITE}/cmd/fx`;
            const string = [this._soundsByName[args.SOUND]];

            const utf8Encode = new TextEncoder();
            const arr = utf8Encode.encode(string);
            const data = {
                topic: outboundTopic,
                message: arr
            };
            this.runtime.emit('PUBLISH_TO_CLIENT', data);
            return Promise.resolve();
        }
    }

    static playSound (args) {
        console.log(args, 'args');
        // const satellite = this.findSatelliteSerial(args.SATELLITE);
        const outboundTopic = `sat/${args.satellite}/cmd/fx`;
        console.log(outboundTopic, 'topic');
        const sounds = SoundFiles.sounds;
        const ext = sounds.find((x) => x.name === args.sound);
        const audio = `AS: 1,${ext.md5ext}`;
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(audio);
        this.props.vm.client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    static playLightSequence (args) {
        // const satellite = this.findSatelliteSerial(args.satellite);
        console.log('PlayLights', args);
        // const outboundTopic = `sat/${args.SATELLITE}/cmd/fx`;
        // const string = [this._sequencesByName[args.SOUND]];
        // const utf8Encode = new TextEncoder();
        // const arr = utf8Encode.encode(string);
        // const data = {
        //     topic: outboundTopic,
        //     message: arr
        // };
        // this.runtime.emit('PUBLISH_TO_CLIENT', data);
        // // this._client.publish(outboundTopic, arr);
        // return Promise.resolve();
    }

    static IsJson (variable) {
        try {
            JSON.parse(variable);
        } catch (e) {
            return false;
        }
        return true;
    }
}

module.exports = MqttControl;
