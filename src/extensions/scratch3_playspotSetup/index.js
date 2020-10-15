/* eslint-disable no-lonely-if */
/* eslint-disable no-undef */
/* eslint-disable no-sequences */
/* eslint-disable newline-per-chained-call */
/* eslint-disable no-else-return */
/* eslint-disable linebreak-style */
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Variable = require('../../engine/variable.js');
const mqtt = require('mqtt');
const log = require('minilog')('playspot');
const http = require('http');
const vm = window.vm;
require('minilog').enable();

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAIAAAABc2X6AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE5LTAxLTA0VDE5OjI4OjUzPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5GbHlpbmcgTWVhdCBBY29ybiA2LjIuMzwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbj4yPC90aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KNVxrxwAAIgZJREFUeAGtm2mQJMd1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';

const NOT_FOUND = ' ';

class PlayspotSetup {
    /**
     * Construct a Playspot communication object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */
    constructor (runtime, extensionId) {
        this.broker = `ws://${window.location.hostname}:3000`;
        this._connected = false;
        this._config = null;

        /**
         * The Scratch 3.0 runtime
         * @type {Runtime}
         * @private
         */
        this._runtime = runtime;
        this._runtime.registerPeripheralExtension(extensionId, this);

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * The most recently received value for each sensor.
         * @type {Object.<string, number>}
         * @private
         */
        this._satellites = {};
        this._app = {
            mode: 0
        };
        this._satId = '';
        this._satellitesList = [];

        // Satellite event handlers
        this._satelliteStatusHandler = sender => {
            // log.info(`satelliteStatusHandler fired for sender: ${sender}`);
            this._satellites[sender] = {
                isTouched: false,
                hasPresence: false
            };
            
            const stage = this._runtime.getTargetForStage();
            let allSats = stage.lookupVariableByNameAndType('All_Satellites', Variable.LIST_TYPE);
            if (!allSats) {
                allSats = this._runtime.createNewGlobalVariable('All_Satellites', false, Variable.LIST_TYPE);
            }
            this._satId = allSats.id;
            stage.variables[allSats.id].value = Object.keys(this._satellites);
            this.setRadarConfiguration({
                SATELLITE: sender,
                FSPEED: ['2'],
                BSPEED: ['2'],
                FMAG: ['5'],
                BMAG: ['5'],
                DET: ['1']
            });
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_LIST_UPDATE, this._satellites);
        };

        this._setupSoundVar = names => {
            const stage = this._runtime.getTargetForStage();
            const wavs = names.filter(currentValue => (currentValue.includes('.wav')));
            const soundsByName = {Silence: 'AS: STOP'};
            wavs.forEach(currentValue => {
                const val = currentValue.replace('.wav', '');
                soundsByName[val] = `AS: 1,${currentValue}`;
            });
            this._soundsByName = Object.freeze(soundsByName);

            // Setup the variable
            let allSounds = stage.lookupVariableByNameAndType('All_Sounds', Variable.LIST_TYPE);
            if (!allSounds) {
                allSounds = this._runtime.createNewGlobalVariable('All_Sounds', false, Variable.LIST_TYPE);
            }
            stage.variables[allSounds.id].value = wavs.map(currentValue => currentValue.replace('.wav', ''));
        };

        this._setupLightVar = names => {
            const stage = this._runtime.getTargetForStage();
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
            this._sequencesByName = Object.freeze(sequencesByName);

            // Setup the variable
            let allLights = stage.lookupVariableByNameAndType('All_Lights', Variable.LIST_TYPE);
            if (!allLights) {
                allLights = this._runtime.createNewGlobalVariable('All_Lights', false, Variable.LIST_TYPE);
            }
            stage.variables[allLights.id].value = txts.map(currentValue => currentValue.replace('.txt', ''));
        };

        this._setupAliases = payload => {
            const finalVariableValues = [];
            const stage = this._runtime.getTargetForStage();
            const decoder = new TextDecoder();
            const message = decoder.decode(payload);
            if (message === 'placeholder') {
                let allSats = stage.lookupVariableByNameAndType('All_Satellites', Variable.LIST_TYPE);
                if (!allSats) {
                    allSats = this._runtime.createNewGlobalVariable('All_Satellites', false, Variable.LIST_TYPE);
                }
                stage.variables[allSats.id].value = Object.keys(this._satellites);
                return;
            }
            
            this._setupDictionary(message);
            if (this._satellitesList.length > 1) {
                for (let i = 0; i < this._satellitesList.length; i++) {
                    const [key] = Object.entries(this._satellitesList[i]);
                    const keyValue = `${key}`;
                    const splitKeyValue = keyValue.split(',');
                    const keyToPush = splitKeyValue[0];
                    let variable = stage.lookupVariableByNameAndType(`${keyToPush}`, Variable.SCALAR_TYPE);
                    if (!variable) {
                        variable = vm.workspace.createVariable(`${keyToPush}`, Variable.SCALAR_TYPE, false, false);
                        const id = variable.id_;
                        const newVariable = stage.lookupOrCreateVariable(id, `${keyToPush}`);
                        stage.variables[newVariable.id].value = keyToPush;
                    }
                    finalVariableValues.push(keyToPush);
                }
                const satsSorted = Object.keys(this._satellites).sort();
                for (let j = 0; j < satsSorted.length; j++) {
                    const match = this._matching(satsSorted[j]);
                    if (!match) {
                        finalVariableValues.push(satsSorted[j]);
                    }
                }

                stage.variables[this._satId].value = finalVariableValues;
            } else {
                for (let i = 0; i < this._satellitesList.length; i++) {
                    const [key] = Object.entries(this._satellitesList[i]);
                    const keyValue = `${key}`;
                    const splitKeyValue = keyValue.split(',');
                    const keyToPush = splitKeyValue[0];
                    let variable = stage.lookupVariableByNameAndType(`${keyToPush}`, Variable.SCALAR_TYPE);
                    if (!variable) {
                        variable = vm.workspace.createVariable(`${keyToPush}`, Variable.SCALAR_TYPE, false, false);
                        const id = variable.id_;
                        const newVariable = stage.lookupOrCreateVariable(id, `${keyToPush}`);
                        stage.variables[newVariable.id].value = keyToPush;
                    }
                    finalVariableValues.push(keyToPush);
                }
                const satsSorted = Object.keys(this._satellites).sort();
                for (let i = 0; i < satsSorted.length; i++) {
                    const match = this._matching(satsSorted[i]);
                    if (!match) {
                        finalVariableValues.push(satsSorted[i]);
                    }
                }
                stage.variables[this._satId].value = finalVariableValues;
            }
        };

        this._matching = satellite => {
            let matching = false;
            const satellites = this._satellitesList;
            for (let i = 0; i < satellites.length; i++) {
                const [key] = Object.entries(this._satellitesList[i]);
                const keyValue = `${key}`;
                const splitKeyValue = keyValue.split(',');
                const value = splitKeyValue[1];
                if (satellite === value) {
                    matching = true;
                    return matching;
                }
            }
            return matching;
        };

        this._setupDictionary = payload => {
            if (this._satellitesList.length > 0) {
                this._satellitesList = [];
            }
            if (payload.includes(',')) {
                const splitMessage = payload.split(',');
                for (let i = 0; i < splitMessage.length; i++) {
                    const parsed = JSON.parse(splitMessage[i]);
                    this._satellitesList.push(parsed);
                }
            } else {
                const parsed = JSON.parse(payload);
                this._satellitesList.push(parsed);
            }
        };

        this._setupGroups = (topic, payload) => {
            const stage = this._runtime.getTargetForStage();
            const decoder = new TextDecoder();
            const message = decoder.decode(payload);
            const splitTopic = topic.split('/');
            const groupName = splitTopic[3];
            const groupNameForList = `${splitTopic[3]} Grouping`;

            if (message === ' ') {
                const group = stage.lookupVariableByNameAndType(`${groupNameForList}`, Variable.LIST_TYPE);
                const groupVar = stage.lookupVariableByNameAndType(`${groupName}`, Variable.SCALAR_TYPE);
                if (group) {
                    vm.workspace.deleteVariableById(group.id);
                    vm.workspace.deleteVariableById(groupVar.id);
                } else {
                    return;
                }
                return;
            }

            if (message === 'placeholder') {
                let group = stage.lookupVariableByNameAndType(`${groupNameForList}`, Variable.LIST_TYPE);
                if (!group) {
                    group = vm.workspace.createVariable(`${groupNameForList}`, Variable.LIST_TYPE, false, false);
                }

                let groupVar = stage.lookupVariableByNameAndType(`${groupName}`, Variable.SCALAR_TYPE);
                if (!groupVar) {
                    groupVar = vm.workspace.createVariable(`${groupName}`, Variable.SCALAR_TYPE, false, false);
                    const id = groupVar.id_;
                    const newVariable = stage.lookupOrCreateVariable(id, `${groupName}`);
                    stage.variables[newVariable.id].value = groupName;
                }
                return;
            }

            const parsed = JSON.parse(message);
            const newValue = Object.values(parsed);

            if (newValue[0].includes(',')) {
                const splitValues = newValue[0].split(',');
                let group = stage.lookupVariableByNameAndType(`${groupNameForList}`, Variable.LIST_TYPE);
                if (group) {
                    stage.variables[group.id].value = splitValues;
                } else {
                    group = vm.workspace.createVariable(`${groupNameForList}`, Variable.LIST_TYPE, false, false);
                    newVariable = stage.lookupOrCreateList(group.id_, `${groupNameForList}`);
                    stage.variables[newVariable.id].value = splitValues;
                }

                let groupVar = stage.lookupVariableByNameAndType(`${groupName}`, Variable.SCALAR_TYPE);
                if (groupVar) {
                    stage.variables[groupVar.id].value = groupName;
                } else {
                    groupVar = vm.workspace.createVariable(`${groupName}`, Variable.SCALAR_TYPE, false, false);
                    id = groupVar.id_;
                    const newVariable = stage.lookupOrCreateVariable(id, `${groupName}`);
                    stage.variables[newVariable.id].value = groupName;
                }

            } else {
                let groupVar = stage.lookupVariableByNameAndType(`${groupName}`, Variable.SCALAR_TYPE);
                if (groupVar) {
                    stage.variables[groupVar.id].value = groupName;
                } else {
                    groupVar = vm.workspace.createVariable(`${groupName}`, Variable.SCALAR_TYPE, null, false, false);
                    id = groupVar.id_;
                    newVariable = stage.lookupVariableByNameAndType(`${groupName}`, Variable.SCALAR_TYPE);
                    stage.variables[newVariable.id].value = groupName;
                }

                let group = stage.lookupVariableByNameAndType(`${groupNameForList}`, Variable.LIST_TYPE);
                if (group) {
                    stage.variables[group.id].value = newValue;
                } else {
                    group = vm.workspace.createVariable(`${groupNameForList}`, Variable.LIST_TYPE, null, false, false);
                    newVariable = stage.lookupOrCreateList(group.id_, `${groupNameForList}`);
                    stage.variables[newVariable.id].value = newValue;
                }
            }
        };

        this._firmwareHandler = payload => {
            // log.info(`firmware handler fired`);
            const json = JSON.parse(payload);
            const files = json.files;
            this._setupSoundVar(files);
            this._setupLightVar(files);
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_LIST_UPDATE, this._satellites);
        };

        this._presenceHandler = (sender, payload) => {
            // log.info(`presenceHandler fired for payload: ${payload}`);
            this._satellites[sender].hasPresence = payload[0] === 0x31;
        };

        this._modeHandler = payload => {
            // log.info(`presenceHandler fired for payload: ${payload}`);
            this._app.mode = payload[0];
        };

        this._touchHandler = (sender, payload) => {
            // log.info(`touchHandler fired for payload: ${payload}`);
            this._satellites[sender].isTouched = payload[0] === 0x31;
        };

        this._onMessage = (topic, payload) => {
            // log.info(`onMessage fired for topic: ${topic}, payload: ${payload}`);
            const t = topic.split('/');
            if (topic === null || t.count < 2) return;
            if (t[0] === 'fwserver' && t[1] === 'files') {
                this._firmwareHandler(payload);
            } else if (t.count < 4) {
                return;
            } else if (t[0] === 'sat' && t[2] === 'online') {
                this._satelliteStatusHandler(t[1]); // this is a status message
            } else if (t[0] === 'sat' && t[2] === 'ev' && t[3] === 'touch') {
                this._touchHandler(t[1], payload); // this is a touch message
            } else if (t[0] === 'sat' && t[2] === 'ev' && t[3] === 'radar') {
                this._presenceHandler(t[1], payload); // this is a presence message
            } else if (t[0] === 'app' && t[1] === 'menu' && t[2] === 'mode') {
                this._modeHandler(payload); // this is a presence message
            } else if (t[0] === 'playspots' && t[1] === 'config' && t[2] === 'aliases') {
                this._setupAliases(payload);
            } else if (t[0] === 'playspots' && t[1] === 'config' && t[2] === 'groups') {
                this._setupGroups(topic, payload);
            }
        };

        this._onStatusTimer = () => {
            log.info('status timeout timer fired');
            if (!this._client) return;

            clearTimeout(this._fetchSatellitesTimeout);
            this._fetchSatellitesTimeout = null;

            // Not interested in status messages now
            this._client.unsubscribe('sat/+/online');
            // subscribe to radar and touch
            this._client.subscribe('sat/+/ev/radar');
            this._client.subscribe('sat/+/ev/touch');
            this._client.subscribe('app/menu/mode');
            // The VM to refreshBlocks
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
            this._connected = true;
            vm.refreshWorkspace();
        };

        this._onConnectTimer = () => {
            if (!this._connected) {
                log.info('connection timeout timer fired');
                this._onError();
            }
        };

        this._onConnect = () => {
            log.info(`onConnect fired`);

            // subscribe to all status, radar detection and touch events
            if (this._client) {
                this._client.subscribe('sat/+/online');
                this._client.subscribe('fwserver/online');
                this._client.subscribe('fwserver/files');
                this._client.subscribe('app/menu/mode');
                this._client.subscribe('playspots/config/aliases');
                this._client.subscribe('playspots/config/groups/+');
            }

            // Give everyone 5 seconds to report again
            this._fetchSatellitesTimeout = setTimeout(this._onStatusTimer, 5000);
        };

        this._onReconnect = () => {
            log.info(`onReconnect fired`);
        };

        this._onClose = () => {
            log.info(`onClose fired`);
            this._connected = false;
            this.closeConnection();
        };

        this._onError = error => {
            log.info(`onError fired with: ${error}`);
            if (this._client) {
                this._client.end();
                this._client = null;
            }
            this.closeConnection();
            this.performConnection();
        };

        this._onConnect = this._onConnect.bind(this);
        this._onReconnect = this._onReconnect.bind(this);
        this._onMessage = this._onMessage.bind(this);
        this._onClose = this._onClose.bind(this);
        this._onError = this._onError.bind(this);
        this._onStatusTimer = this._onStatusTimer.bind(this);
        this._onConnectTimer = this._onConnectTimer.bind(this);
    }

    closeConnection () {
        this._connected = false;
        if (this._client === null) return;
        this._client.end(true, () => {
            this._client.removeListener('connect', this._onConnect);
            this._client.removeListener('reconnect', this._onReconnect);
            this._client.removeListener('message', this._onMessage);
            this._client.removeListener('close', this._onClose);
            this._client.removeListener('error', this._onError);
            this._client = null;
        });
        this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }

    performConnection () {
        let options = null;
        if (this._client) {
            log.info(`performConnection fired but already connected`);
            return;
        }
        log.info(`performConnection fired`);
        if (this.userName && this.password) {
            options = {
                username: `${this.userName}`,
                password: `${this.password}`
            };
        }
        if (options) {
            this._client = mqtt.connect(this.broker, options);
        } else {
            this._client = mqtt.connect(this.broker);
        }
        if (!this._client) this._onError();

        // bind the event handlers
        this._client.on('connect', this._onConnect);
        this._client.on('reconnect', this._onReconnect);
        this._client.on('message', this._onMessage);
        this._client.on('close', this._onClose);
        this._client.on('error', this._onError);
        this._onStatusTimer = this._onStatusTimer.bind(this);
        this._onConnectTimer = this._onConnectTimer.bind(this);

        this._performConnectTimeout = setTimeout(this._onConnectTimer, 10000);
    }

    /**
     * Called by the runtime when user wants to scan for a peripheral.
     */
    scan () {
        log.info(`scan fired`);
        this.connect();
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {string} host - the host FQDN or IP Addr to connect to.
     * @param {string} userName - the userName of the client
     * @param {string} password - the password of the client
     */
    connect (host, userName, password) {
        log.info(`connected fired with url = ${host}`);
        if (host && !userName) this.broker = `ws://${host}:3000`;
        if (host && userName) this.broker = `wss://${host}:3000`;
        if (userName) this.userName = userName;
        if (password) this.password = password;
        if (!this.broker) {
            this._onError();
            return;
        }
        log.info(`will connect with = ${this.broker}`);
        if (this._client) {
            // connect to the possibly new broker
            this._client.end(false, this.performConnection.bind(this));
        } else {
            const url = `http://${window.location.hostname}/config/${host}.json`;
            http.get(url, resp => {
                const statusCode = resp.statusCode;
                const contentType = resp.headers['content-type'];

                let error;
                if (statusCode !== 200) {
                    error = new Error(`Request Failed.\nStatus Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error('Invalid content-type.\n' +
                                    `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    // log.info(`Error: ${error.message}`);
                    // Consume response data to free up memory
                    resp.resume();
                    this.performConnection();
                    return;
                }
                let data = '';
                resp.on('data', chunk => {
                    data += chunk;
                });
                resp.on('end', () => {
                    this._config = JSON.parse(data);
                    this.performConnection();
                });
            }).on('error', err => {
                log.info(`Error: ${err.message}`);
                this.performConnection();
            });
        }
    }

    /**
     * Called by the runtime when user wants to connect to a certain peripheral.
     * @param {number} id - the id of the peripheral to connect to.
     */
    disconnect () {
        log.info(`disconnecting`);
        if (this._client) {
            this._client.end(false, this.removeConnection.bind(this));
        }
    }

    /**
     * Return true if connected to the micro:bit.
     * @return {boolean} - whether the micro:bit is connected.
     */
    isConnected () {
        return this._client && this._connected;
    }

    /**
     */
    refreshSatellites () {
        this._client.unsubscribe('sat/+/online');
        this._client.subscribe('sat/+/online');
    }

    setRadarConfiguration (args) {
        const utf8Encode = new TextEncoder();
        const options = {qos: 2};

        const fSpeedTopic = `sat/${args.SATELLITE}/cfg/radar/fSpeed`;
        this._client.publish(fSpeedTopic, utf8Encode.encode(args.FSPEED), options);

        const bSpeedTopic = `sat/${args.SATELLITE}/cfg/radar/bSpeed`;
        this._client.publish(bSpeedTopic, utf8Encode.encode(args.BSPEED), options);

        const fMagTopic = `sat/${args.SATELLITE}/cfg/radar/fMag`;
        this._client.publish(fMagTopic, utf8Encode.encode(args.FMAG), options);

        const bMagTopic = `sat/${args.SATELLITE}/cfg/radar/bMag`;
        this._client.publish(bMagTopic, utf8Encode.encode(args.BMAG), options);

        const detEnTopic = `sat/${args.SATELLITE}/cfg/radar/detEn`;
        this._client.publish(detEnTopic, utf8Encode.encode(args.DET), options);
    }
}

class Scratch3PlayspotSetup {
    /**
     * @return {string} - the name of this extension.
     */
    static get EXTENSION_NAME () {
        return 'PlaySpots Setup';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'playspotsSetup';
    }
    
    /**
     * @return {array} - text and values for each satellites menu element
     */
    get SATELLITES () {
        return Object.keys(this._peripheral._satellites || {}).length === 0 ?
            [{text: NOT_FOUND, value: NOT_FOUND}] :
            Object.keys(this._peripheral._satellites).map(currentValue => ({
                text: currentValue,
                value: currentValue
            }));
    }

    get ALIASES () {
        const sats = [];
        this._peripheral._satellitesList.map(current =>
            sats.push(Object.keys(current)[0])
        );
        return this._peripheral._satellitesList.length === 0 ?
            [{text: NOT_FOUND, value: NOT_FOUND}] :
            sats.map(currentValue => ({
                text: currentValue,
                value: currentValue
            }));
    }
      
    /**
     * Construct a set of Playspot blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this._runtime = runtime;

        this._satellitesList = [];
        
        /**
         * The Playspot handler.
         * @type {Playspot}
         */
        this._peripheral = new PlayspotSetup(this._runtime, Scratch3PlayspotSetup.EXTENSION_ID);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        const defaultSatellite =
          Object.keys(this._peripheral._satellites).length === 0 ?
              NOT_FOUND : this._peripheral._satellites[Object.keys(this._peripheral._satellites)[0]];
        return {
            id: Scratch3PlayspotSetup.EXTENSION_ID,
            name: Scratch3PlayspotSetup.EXTENSION_NAME,
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'updateSatName',
                    text: 'Update satellite name [SATELLITE] to [NEWSAT]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        SATELLITE: {
                            type: ArgumentType.STRING,
                            defaultValue: defaultSatellite
                        },
                        NEWSAT: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    }
                },
                {
                    opcode: 'deleteAlias',
                    text: 'Delete Satellite Name [SATELLITE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        SATELLITE: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    }
                },
                {
                    opcode: 'createGrouping',
                    text: 'Create a grouping with name [GROUP]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        GROUP: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    }
                },
                {
                    opcode: 'addToGrouping',
                    text: 'Add [SATELLITE] to grouping [GROUP]',
                    blockType: BlockType.COMMAND,
                    agruments: {
                        SATELLITE: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        },
                        GROUP: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    }
                },
                {
                    opcode: 'deleteAGrouping',
                    text: 'Delete Grouping [GROUP]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        GROUP: {
                            type: ArgumentType.STRING,
                            defaultValue: ' '
                        }
                    }
                }
            ]
        };
    }

    findSatelliteSerial (satelliteName) {
        let returnSat = '';
        let satellites = [];
        if (this._peripheral._satellitesList.length > 0) {

            for (let i = 0; i < this._peripheral._satellitesList.length; i++) {
                const [key] = Object.entries(this._peripheral._satellitesList[i]);
                const keyValue = `${key}`;
                const splitKeyValue = keyValue.split(',');
                const keyToCheck = splitKeyValue[0];
                if (keyToCheck === satelliteName) {
                    returnSat = splitKeyValue[1];
                }
            }

            satellites = Object.keys(this._peripheral._satellites);
            for (let i = 0; i < satellites.length; i++) {
                if (satellites[i] === satelliteName) {
                    returnSat = satellites[i];
                }
            }

            return returnSat;

        } else {

            satellites = Object.keys(this._peripheral._satellites);
            for (let i = 0; i < satellites.length; i++) {
                if (satellites[i] === satelliteName) {
                    returnSat = satellites[i];
                }
            }

            return returnSat;
        }
    }

    updateSatName (args) {
        const sats = [];
        const newSatVariable = {};
        let newName = '';
        let serialNumber = '';
        if (args.SATELLITE !== ' ') {
            serialNumber = this.findSatelliteSerial(args.SATELLITE);
        }
        if (args.NEWSAT !== 0 || args.NEWSAT !== ' ') {
            newName = args.NEWSAT;
        }
        if (serialNumber === '' || newName === ' ') {
            return;
        } else {
            if (this._peripheral._satellitesList.length > 0) {
                let matching = false;
                for (let i = 0; i < this._peripheral._satellitesList.length; i++) {
                    
                    const [key] = Object.entries(this._peripheral._satellitesList[i]);
                    const keyValue = `${key}`;
                    const splitKeyValue = keyValue.split(',');
                    const valueToCheck = splitKeyValue[1];
                    const serial = this.findSatelliteSerial(args.SATELLITE);
                    if (valueToCheck === serial) {
                        matching = true;
                        newSatVariable[newName] = serialNumber;
                        this._peripheral._satellitesList.splice(i, 1, newSatVariable);
                        sats.push(JSON.stringify(this._peripheral._satellitesList[i]));
                    } else {
                        sats.push(JSON.stringify(this._peripheral._satellitesList[i]));
                    }
                }
                if (!matching) {
                    newSatVariable[newName] = serialNumber;
                    const data = JSON.stringify(newSatVariable);
                    sats.push(data);
                }
                
                const utf8Encode = new TextEncoder();
                const options = {retain: true, qos: 2};
                const aliasesTopic = 'playspots/config/aliases';
                this._peripheral._client.publish(aliasesTopic, utf8Encode.encode(sats), options);

            } else {
                const utf8Encode = new TextEncoder();
                const options = {retain: true, qos: 2};
                const aliasesTopic = 'playspots/config/aliases';
                newSatVariable[newName] = serialNumber;
                const data = JSON.stringify(newSatVariable);
                sats.push(data);
                this._peripheral._client.publish(aliasesTopic, utf8Encode.encode(sats), options);
            }
        }
    }

    deleteAlias (args) {
        const utf8Encode = new TextEncoder();
        const options = {retain: true, qos: 2};
        const aliasesTopic = 'playspots/config/aliases';
        const satToChange = args.SATELLITE;
        const sats = this._peripheral._satellitesList;
        const satsMessage = [];
        let changedKey = '';
        let index = 0;
        const message = 'placeholder';
        for (let i = 0; i < sats.length; i++) {
            if (satToChange === Object.keys(sats[i])[0]) {
                changedKey = Object.values(sats[i])[0];
                index = i;
            }
        }
        sats.splice(index, 1);
        if (sats.length === 0) {
            if (args.SATELLITE !== ' ') {
                this._peripheral._client.publish(aliasesTopic, utf8Encode.encode(message), options);
            }
        } else {
            if (args.SATELLITE !== ' ') {
                for (let i = 0; i < sats.length; i++) {
                    const satsObject = JSON.stringify(sats[i]);
                    satsMessage.push(satsObject);
                }
                this._peripheral._client.publish(aliasesTopic, utf8Encode.encode(satsMessage), options);
            }
        }

    }

    createGrouping (args) {
        let groupName = '';
        const utf8Encode = new TextEncoder();
        const options = {retain: true, qos: 2};

        if (args.GROUP === ' ') {
            return;
        } else {
            groupName = args.GROUP;
        }

        const aliasesTopic = `playspots/config/groups/${groupName}`;
        const placeholder = 'placeholder';

        if (groupName !== '') {
            this._peripheral._client.publish(aliasesTopic, utf8Encode.encode(placeholder), options);
        }
    }

    addToGrouping (args) {
        const groupObject = {};
        const values = [];
        const stage = this._runtime.getTargetForStage();
        const utf8Encode = new TextEncoder();
        const options = {retain: true, qos: 2};
        const grouping = `${args.GROUP} Grouping`;
        const aliasesTopic = `playspots/config/groups/${args.GROUP}`;
        const group = stage.lookupVariableByNameAndType(`${grouping}`, Variable.LIST_TYPE);
        if (group) {
            if (group.value.length === 0) {
                values.push(args.SATELLITE);
                for (let i = 0; i < values.length; i++) {
                    groupObject[args.GROUP] = values[i];
                }
            } else {
                const oldValue = group.value;
                for (let i = 0; i < oldValue.length; i++) {
                    values.push(oldValue[i]);
                }
                values.push(args.SATELLITE);
                const joinedArray = values.join(',');
                groupObject[args.GROUP] = joinedArray;
            }
        } else {
            return;
        }
        if (args.GROUP !== ' ' && args.SATELLITE !== ' ') {
            const groupObjectString = JSON.stringify(groupObject);
            this._peripheral._client.publish(aliasesTopic, utf8Encode.encode(groupObjectString), options);
        }
    }

    deleteAGrouping (args) {
        const message = ' ';
        let group = '';
        const options = {retain: true, qos: 2};
        if (args.GROUP !== ' ') {
            group = args.GROUP;
        }
        const groupTopic = `playspots/config/groups/${group}`;
        if (group !== '') {
            this._peripheral._client.publish(groupTopic, message, options);
        }
        console.log(vm.workspace, 'workspace');
    }

}


module.exports = Scratch3PlayspotSetup;
