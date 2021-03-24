/* eslint-disable linebreak-style */
const decoder = new TextDecoder();
// import SoundFiles from '../lib/soundFiles';

class MqttControl {
    constructor () {
        this.positionsCopy = [];
        this.copyThePositions = true;
        this.satellites = {};
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

        this.isSatelliteTouched = false;

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


    static onMessage (topic, payload) {
        // console.log(`onMessage fired for topic: ${topic}, payload: ${payload}`);
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
            this.props.vm.runtime.emit('IS_TOUCHED', data);
        } else if (t[0] === 'app' && t[1] === 'menu' && t[2] === 'mode') {
            this.props.vm.modeHandler(payload); // this is a presence message
        } else if (t[0] === 'sat' && t[2] === 'cmd' && t[3] === 'fx') {
            const message = decoder.decode(payload);
            this.props.setProjectState(true);
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
            this.props.setProjectState(true);
            // if (message === '1') {
            //     // this.props.vm.runtime.emit('TOUCH_EVENT_SATELLITE', {topic: t[1]})
            //     this.touchHandler(t[1], message);
            // } else {
            //     this.touchHandler(t[1], message);
            // }
            this.touchHandler(t[1], message);
        } else if (t[0] === 'sat' && t[2] === 'online') {
            // const message = decoder.decode(payload);
            this._satelliteStatusHandler(t[1]);
        } else if (t[0] === 'fwserver' && t[1] === 'files') {
            this.firmwareHandler(payload);
        } else if (t[0] === 'sat' && t[2] === 'ev' && t[3] === 'radar') {
            const message = decoder.decode(payload);
            const data = {
                satellite: t[1],
                sensing: message
            };
            this.props.vm.runtime.emit('HAS_PRESENCE', data);
        }
    }

    static _satelliteStatusHandler (sender) {
        const satellites = {};
        // log.info(`satelliteStatusHandler fired for sender: ${sender}`);
        console.log(satellites, 'satellites', sender, 'sender');
        console.log(satellites[sender] = {
            isTouched: false,
            hasPresence: false
        });
        // const stage = this.props.vm.runtime.getTargetForStage();
        // let singleSat = stage.lookupVariableByNameAndType(`${sender}`, '');
        // let allSats = stage.lookupVariableByNameAndType('All_Satellites', 'list');
        // if (!allSats) {
        //     allSats = this.props.workspace.createVariable(`All_Satellites`, 'list', false, false);
        //     singleSat = this.props.workspace.createVariable(`${sender}`, '', false, false);
        // }
        // setTimeout(() => {
        //     stage.variables[allSats.id_].value = Object.keys(this._satellites);
        //     stage.variables[singleSat.id_].value = `${sender}`;
        // }, 5000);

        // this.props.vm.setSatellites(this._satellites);
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
        console.log(names);
        // const stage = this.props.vm.runtime.getTargetForStage();
        // const wavs = names.filter(currentValue => (currentValue.includes('.wav')));
        // const soundsByName = {Silence: 'AS: STOP'};
        // wavs.forEach(currentValue => {
        //     const val = currentValue.replace('.wav', '');
        //     soundsByName[val] = `AS: 1,${currentValue}`;
        // });
        // this._soundsByName = Object.freeze(soundsByName);

        // // Setup the variable
        // let allSounds = stage.lookupVariableByNameAndType('All_Sounds', 'list');
        // if (!allSounds) {
        //     allSounds = this.props.workspace.createVariable('All_Sounds', 'list', false, false);
        //     console.log(allSounds, 'allSounds');
        // }
        // setTimeout(() => {
        //     stage.variables[allSounds.id_].value = wavs.map(currentValue => currentValue.replace('.wav', ''));
        // },5000);
    }

}

module.exports = MqttControl;
