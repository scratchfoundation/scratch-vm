/* eslint-disable array-callback-return */
/* eslint-disable no-else-return */
/* eslint-disable no-negated-condition */
/* eslint-disable no-console */
/* eslint-disable no-loop-func */
/* eslint-disable no-return-assign */
const EventEmitter = require('events');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const Variable = require('../../engine/variable.js');
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const log = require('minilog')('playspot');
const http = require('http');
const vm = window.vm;
const original = require('./Assets/originalCostume');
const soundData = require('./Assets/SoundsSat');
const mqtt = require('mqtt');
const Runtime = require('../../engine/runtime');

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
const blockIconURI =
    // eslint-disable-next-line max-len
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAIAAAABc2X6AAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE5LTAxLTA0VDE5OjI4OjUzPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5GbHlpbmcgTWVhdCBBY29ybiA2LjIuMzwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj43MjwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbj4yPC90aWZmOlBob3RvbWV0cmljSW50ZXJwcmV0YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KNVxrxwAAIgZJREFUeAGtm2mQJMd1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';

const _volumes = Object.freeze({
    'Mute': '0',
    'Level 1': '50',
    'Level 2': '60',
    'Level 3': '70',
    'Level 4': '80',
    'Level 5': '90',
    'Level 6': '100'
});

const _sensitivities = Object.freeze({
    Off: 'off',
    Near: 'near',
    Medium: 'medium',
    Far: 'far',
    Max: 'max'
});

const _images = Object.freeze({
    Eight: 'Eight',
    Empty: 'Empty',
    Farm: 'Farm',
    FarmFrame: 'FarmFrame',
    Five: 'Five',
    Four: 'Four',
    GameAgent: 'GameAgent',
    GameAgentFrame: 'GameAgentFrame',
    GameAnimals: 'GameAnimals',
    GameAnimalsFrame: 'GameAnimalsFrame',
    GameMusic: 'GameMusic',
    GameMusicFrame: 'GameMusicFrame',
    GameZombie: 'GameZombie',
    GameZombieFrame: 'GameZombieFrame',
    Go: 'Go',
    HeartFrame: 'HeartFrame',
    HeartFull: 'HeartFull',
    IconJungle: 'IconJungle',
    IconJungleFrame: 'IconJungleFrame',
    IconWeather: 'IconWeather',
    IconWeatherFrame: 'IconWeatherFrame',
    IdleFarm: 'IdleFarm',
    IdleFarmFrame: 'IdleFarmFrame',
    IdleMusic: 'IdleMusic',
    IdleMusicFrame: 'IdleMusicFrame',
    Jungle: 'Jungle',
    JungleFrame: 'JungleFrame',
    Music: 'Music',
    MusicFrame: 'MusicFrame',
    Nine: 'Nine',
    One: 'One',
    Seven: 'Seven',
    Six: 'Six',
    StarFrame: 'StarFrame',
    StarFull: 'StarFull',
    Ten: 'Ten',
    Three: 'Three',
    Two: 'Two',
    Weather: 'Weather',
    WeatherFrame: 'WeatherFrame'
});

const _sequencesByName = {};

const _sequences = Object.freeze({
    'Clear': 'LS: CLEAR',
    'Pause': 'LS: PAUSE',
    'Stop': 'LS: STOP',
    'Stop and Clear': 'LS: STOPCLEAR'
});

const _soundsByName = {};

const _sounds = Object.freeze({Silence: 'AS: STOP'});

const _regions = Object.freeze({
    Upper: 'upper',
    Lower: 'lower'
});

const _directions = Object.freeze({
    Down: 'down',
    Up: 'up',
    Left: 'left',
    Right: 'right'
});

const _modes = Object.freeze({
    'Unknown': 0x30,
    'Cause and Effect': 0x31,
    'Complex': 0x32,
    'Kid': 0x33
});

const NOT_FOUND = ' ';

/**
 * Manage communication with a Playspot peripheral over a MQTT client socket.
 */
class SatellitePeripheral extends EventEmitter {
    /**
     * Construct a Playspot communication object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */
    constructor (runtime, extensionId) {
        super();
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

        this._mode = 0;

        this._messageToDisplay = '';

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

        this._touchHandler = (sender, payload) => {
            // log.info(`touchHandler fired for payload: ${payload}`);
            this._satellites[sender].isTouched = payload[0] === 0x31;
        };

        this._onMessage = (topic, payload) => {
            // log.info(`onMessage fired for topic: ${topic}, payload: ${payload}`);
            const t = topic.split('/');
            if (topic === null || t.count < 2) return;
            if (t[0] === 'app' && t[1] === 'menu' && t[2] === 'mode') {
                this._mode = payload[0];
            } else if (t[0] === 'fwserver' && t[1] === 'files') {
                this._firmwareHandler(payload);
            } else if (t.count < 4) {
                return;
            } else if (t[0] === 'sat' && t[2] === 'online') {
                this._satelliteStatusHandler(t[1]); // this is a status message
            } else if (t[0] === 'sat' && t[2] === 'ev' && t[3] === 'touch') {
                this._touchHandler(t[1], payload); // this is a touch message
            } else if (t[0] === 'sat' && t[2] === 'ev' && t[3] === 'radar') {
                this._presenceHandler(t[1], payload); // this is a presence message
            } else if (t[0] === 'sat' && t[2] === 'sound') {
                this._soundToPlay = decoder.decode(payload);
                this._runtime.emit('playSound', this._soundToPlay);
            } else if (t[0] === 'sat' && t[1] === `${this.userName}`) {
                this._messageToDisplay = decoder.decode(payload);
                this._runtime.emit('displaySequence', this._messageToDisplay);
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
            this._client.subscribe(`sat/${this.userName}/cmd/fx`);
            this._client.subscribe(`sat/${this.userName}/sound/fx`);
            // The VM to refreshBlocks
            this._runtime.emit(this._runtime.constructor.PERIPHERAL_CONNECTED);
            this._connected = true;
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
                this._client.subscribe(`sat/${this.userName}/cmd/fx`);
                this._client.subscribe(`sat/${this.userName}/sound/fx`);
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

    /**
     * @param {object} args - the satellite to display on and the sequence to display
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    displayLightSequence (args) {
        const outboundTopic = `sat/${this.userName}/cmd/fx`;
        // const string = [this._sequencesByName[args.SEQUENCE]];
        const string = args.MESSAGE;
        // const utf8Encode = new TextEncoder();
        // const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, string);
        return Promise.resolve();
    }

    /**
     * @param {object} args - the satellite to display on and the sequence to display
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    cycleSatellitePower () {
        const outboundTopic = `relay`;
        const string = '';
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    /**
     * @param {object} args - the satellite to display on and the sequence to display
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    displayLightSequenceByName (args) {
        const outboundTopic = `sat/${args.SATELLITE}/cmd/fx`;
        const string = [this._sequencesByName[args.SEQUENCENAME]];
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    /**
     * @param {object} args - the satellite to display on and the sound play
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    playSound (args) {
        const outboundTopic = `sat/${args.SATELLITE}/cmd/fx`;
        const string = [this._soundsByName[args.SOUND]];
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    /**
     * @param {object} args - the satellite to display on and the sound play
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    playSoundByName (args) {
        const outboundTopic = `sat/${args.SATELLITE}/cmd/fx`;
        const string = [this._soundsByName[args.SOUNDNAME]];
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    singleImage (upperLower, image) {
        return {
            singleImage: {
                pause: 0,
                region: upperLower,
                name: image,
                duration: 1
            }
        };
    }

    /**
     * @param {object} args - the image to display
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    displayImage (args) {
        const outboundTopic = `display/animation`;
        const img = this.singleImage(
            `${_regions[args.REGION]}`,
            `${_images[args.IMAGE]}`
        );
        const string = JSON.stringify(img);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    imageAnimation (from, to, direction, upperLower) {
        return {
            inOut: {
                region: upperLower,
                endName: to,
                startName: from,
                duration: 1,
                direction: direction,
                pause: 0
            }
        };
    }

    /**
     * @param {object} args - the image to display
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    animateImage (args) {
        const outboundTopic = `display/animation`;
        const animation = this.imageAnimation(
            `${_images[args.FROM]}` || 'Empty',
            `${_images[args.TO]}` || 'Empty',
            `${_directions[args.DIRECTION]}` || 'down',
            `${_regions[args.REGION]}` || 'upper'
        );
        const string = JSON.stringify(animation);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    fill (args) {
        return {
            imageFillSequence: {
                startPercent: Number(args.BEGIN) || 0,
                region: `${_regions[args.REGION]}` || 'upper',
                color: {
                    red: Number(args.RED) || 0,
                    green: Number(args.GREEN) || 0,
                    blue: Number(args.BLUE) || 128
                },
                endPercent: Number(args.END) || 100,
                duration: 1,
                pause: 0,
                name: `${_images[args.IMAGE]}` || 'Empty'
            }
        };
    }

    /**
         * @param {object} args - the image to display
         * @return {Promise} - a Promise that resolves when writing to peripheral.
         */
    fillImage (args) {
        const outboundTopic = `display/animation`;
        const fill = this.fill(args);
        const string = JSON.stringify(fill);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    histogram (red, green, blue, region) {
        return {
            histogram: {
                end: {
                    bar3: Math.random(),
                    bar1: Math.random(),
                    bar4: Math.random(),
                    bar2: Math.random(),
                    bar5: Math.random()
                },
                region: region,
                begin: {
                    bar3: Math.random(),
                    bar1: Math.random(),
                    bar4: Math.random(),
                    bar2: Math.random(),
                    bar5: Math.random()
                },
                steps: 20,
                color: {
                    red: red,
                    green: green,
                    blue: blue
                },
                duration: 1.5,
                pause: 0
            }
        };
    }

    /**
     * @param {object} args - the image to display
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    displayHistogram (args) {
        const outboundTopic = `display/animation`;
        const histo = this.histogram(
            args.RED || 0,
            args.GREEN || 255,
            args.BLUE || 128
        );
        const string = JSON.stringify(histo);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    /**
     * @param {object} args - the satellite to display on and the volume to use
     * @return {Promise} - a Promise that resolves when writing to peripheral.
     */
    setVolume (args) {
        const outboundTopic = `sat/${args.SATELLITE}/cmd/fx`;
        const string = `AS: vol ${[_volumes[args.VOLUME]]}`;
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, arr);
        return Promise.resolve();
    }

    /**
     * @param {object} args - the satellite to display on and the sensitivity to use
    //  */
    setRadarSensitivity (args) {
        const outboundTopic = `sat/${args.SATELLITE}/in/radar/config`;
        this._client.publish(outboundTopic, _sensitivities[args.SENSITIVITY]);
    }

    /**
     * @param {object} args - the satellite to reboot
     */
    rebootSatellite (args) {
        const outboundTopic = `sat/${args.SATELLITE}/cmd/reboot`;
        this._client.publish(outboundTopic, [0x1]);
    }

    /**
     * Return true if touched.
     * @param {string} satellite - the satellite in question
     * @return {boolean} - whether the satelliate is being touched.
     */
    isTouched (satellite) {
        return satellite &&
        satellite !== NOT_FOUND &&
        this._satellites &&
        this._satellites !== NOT_FOUND &&
        this._satellites[satellite] &&
        this._satellites[satellite] !== NOT_FOUND &&
        this._satellites[satellite].isTouched;
    }

    /**
     * Return true if touched.
     * @param {string} satellite - the satellite in question
     * @return {boolean} - whether the satellite is detecting presence.
     */
    hasPresence (satellite) {
        return satellite &&
        satellite !== NOT_FOUND &&
        this._satellites &&
        this._satellites !== NOT_FOUND &&
        this._satellites[satellite] &&
        this._satellites[satellite] !== NOT_FOUND &&
        this._satellites[satellite].hasPresence;
    }

    sendTouch (args) {
        const outboundTopic = `sat/${this.userName}/cmd/fx`;
        // const string = [this._sequencesByName[args.SEQUENCE]];
        const string = args.MESSAGE;
        // const utf8Encode = new TextEncoder();
        // const arr = utf8Encode.encode(string);
        this._client.publish(outboundTopic, string);
    }
}

class Scratch3Satellite extends EventEmitter {
    static get EXTENSION_NAME () {
        return 'sequence';
    }

    static get EXTENSION_ID () {
        return 'sequence';
    }
    constructor (runtime, extensionId) {
        super();
        /**
         * The Scratch 3.0 runtime
         * @type {Runtime}
         * @private
         */
        this.runtime = runtime;

        this._peripheral = new SatellitePeripheral(this.runtime, Scratch3Satellite.EXTENSION_ID);

        /**
         * The storage module for the VM/runtime
         * @param {ScratchStorage} storage The storage module to attach
         */
        const storage = this.runtime.storage;

        /**
         * The id of the extension this peripheral belongs to.
         */
        this._extensionId = extensionId;

        /**
         * Instantiating the SatellitePeripheral class.
         * @param {Runtime} runtime The runtime of the extension
         * @param {string} ExtensionId The extension Id of the current Scratch3Satellite Extension.
         */
        this._runtime = runtime;
        this._peripheral = new SatellitePeripheral(this.runtime, Scratch3Satellite.EXTENSION_ID);

        /**
         * Registering the peripheral.
         * @param {Runtime} runtime The runtime of the extension
         * @param {string} ExtensionId The extension Id of the current Scratch3Satellite Extension.
         */
        this._runtime = runtime;
        this._runtime.registerPeripheralExtension(extensionId, this);
 

        /**
         * Previous positions of light sequence
        @type {Array}
        */
        this._prevPositions = [];

        /**
         * Active state of a thread
        @type {Boolean}
        */
        this._active = false;

        /**
         * The message being passed from MQTT for sequences
        @type {String}
        */
        this._message = '';

        /**
         * The running timer for sequencing.
        @type {String}
        */
        this._time = 0;

        this._message = '';

        this.STORE_WAITING = true;

        this._soundMessage = '';

        this.STORE_WAITING = true;

        this.LOOPING = false;

        this._looping = false;

        this._loopAmount = 0;

        this._timeoutIdAmount = 0;

        this._timeoutIds = [];

        this._connectNumber = 0;

        this._copyOfCostume = {};

        this._connectSoundNumber = 0;

        this._singleSequence = [];

        this._clearGlow = false;

        this._clearSoundGlow = false;

        this._wait = false;

        this._j = 0;

        this._startOver = false;

        this._soundWait = false;

        this._totalAmount = 0;

        this._totalComp = 0;

        this.runtime.on('loopingSet', () => {
            this.LOOPING = true;
        });

        this.runtime.on('loopingStop', () => {
            this.LOOPING = false;
        });


        /**
         * Event listen to set this._active to true
         */
        this.on('started', () => {
            this._active = true;
        });

        this.runtime.on('threadDone', () => {
            this.stopBlock();
        });

        this._satelliteToPublishTo = '';

        /**
         * Event listen to set this._active to false
         * Resets the timing for the sequences and resets the message from MQTT.
         */
        this.on('over', () => {
            this._active = false;
        });

        /**
         * The backdrop for the project
        @type {SVG}
        */
        const backdropCostume = `<svg version="1.1" width="2" height="2" viewBox="-1 -1 2 2" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                                    <!-- Exported by Scratch - http://scratch.mit.edu/ -->
                                         </svg>`;


        /**
         * Encoding the backdrop SVG and Sprite SVG for the project
        @type {SVG}
        */
        const newSVG2 = encoder.encode(backdropCostume);
        const mainSVG = original.originalCostume;
        const svg = Object.values(mainSVG).join('');
        const newSVG = Cast.toString(svg);
        const costume1SVG = encoder.encode(newSVG);

        /**
         * Creating a new asset for backdrop costume and sprite costume from scratch storage.
        */
        const costume1Data = {};
        costume1Data.asset = storage.createAsset(
            storage.AssetType.ImageVector,
            storage.DataFormat.SVG,
            costume1SVG,
            null,
            true // generate md5
        );
        costume1Data.dataFormat = storage.DataFormat.SVG;
        costume1Data.assetId = costume1Data.asset.assetId;
        costume1Data.md5 = `${costume1Data.assetId}.${costume1Data.dataFormat}`;
        costume1Data.name = 'Satellite1';
        costume1Data.rotationCenterX = 28;
        costume1Data.rotationCenterY = 23;

        const backdrop = {};
        backdrop.asset = storage.createAsset(
            storage.AssetType.ImageVector,
            storage.DataFormat.SVG,
            newSVG2,
            null,
            true
        );
        backdrop.dataFormat = storage.DataFormat.SVG;
        backdrop.assetId = backdrop.asset.assetId;
        backdrop.md5 = `${backdrop.assetId}.${backdrop.dataFormat}`;
        backdrop.name = 'backdrop1';
        backdrop.rotationCenterX = 243.00000000000003;
        backdrop.rotationCenterY = 182.96698836567242;

        /**
         * Creating a new project for the extension
        @type {Object}
        */
        const newProject = {
            targets: [
                {
                    isStage: true,
                    name: 'Stage',
                    variables: {'`jEk@4|i[#Fk?(8x)AV.-my variable': ['my variable', 0]},
                    lists: {},
                    broadcasts: {},
                    blocks: {},
                    comments: {},
                    currentCostume: 0,
                    costumes: [backdrop],
                    sounds: [],
                    volume: 100,
                    layerOrder: 0,
                    tempo: 60,
                    videoTransparency: 50,
                    videoState: 'on',
                    textToSpeechLanguage: null
                },
                {
                    isStage: false,
                    name: 'Satellite1',
                    variables: {},
                    lists: {},
                    broadcasts: {},
                    blocks: {},
                    comments: {},
                    currentCostume: 0,
                    costumes: [costume1Data],
                    sounds: soundData.sounds,
                    volume: 100,
                    layerOrder: 1,
                    visible: true,
                    x: -109,
                    y: 124,
                    size: 175,
                    direction: 90,
                    draggable: true,
                    rotationStyle: 'all around'
                }
            ],
            monitors: [],
            extensions: [],
            meta: {
                semver: '3.0.0',
                vm: '0.2.0',
                agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
            }
        };
        vm.loadProject(JSON.stringify(newProject));
    }

    getInfo () {
        return {
            id: Scratch3Satellite.EXTENSION_ID,
            name: 'Satellite Sequence',
            blockIconURI: blockIconURI,
            showStatusButton: true,
            blocks: [
                {
                    opcode: 'startSequence',
                    blockType: BlockType.COMMAND,
                    text: 'Start Sequence By FileName [LIGHT]',
                    arguments: {
                        LIGHT: {
                            type: ArgumentType.LIGHT,
                            defaultValue: 'Light1'
                        }
                    }
                },
                {
                    opcode: 'startSequenceWithSound',
                    blockType: BlockType.COMMAND,
                    text: 'Start Sequence[LIGHT] and play [SOUND_MENU]',
                    arguments: {
                        LIGHT: {
                            type: ArgumentType.LIGHT,
                            defaultValue: 'Light1'
                        },
                        SOUND_MENU: {
                            type: ArgumentType.STRING,
                            defaultValue: 'none',
                            menu: 'sounds'
                        }
                    }
                },
                {
                    opcode: 'whenSpriteIsClicked',
                    text: 'When sprite button clicked send MQTT [MESSAGE]',
                    blockType: BlockType.HAT,
                    arguments: {
                        MESSAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'message'
                        }
                    }
                },
                {
                    opcode: 'whenLightSequenceDetected',
                    text: 'Listen for MQTT Light Sequence',
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'whenMQTTSoundDetected',
                    text: 'Listen for MQTT Sound',
                    blockType: BlockType.HAT
                },
                {
                    opcode: 'mqttStartBranchLoop',
                    text: 'Play MQTT Display Sequence',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'playMQTTsound',
                    text: 'Play MQTT Sound',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'addPosition',
                    blockType: BlockType.REPORTER,
                    text: 'Add Position [LIGHT] and [LIGHT2]',
                    arguments: {
                        LIGHT: {
                            type: ArgumentType.LIGHT
                        },
                        LIGHT2: {
                            type: ArgumentType.LIGHT
                        }
                    }
                },
                {
                    opcode: 'sequenceSpeed',
                    blockType: BlockType.COMMAND,
                    text: 'Delay [DURATION] Seconds',
                    arguments: {
                        DURATION: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'rotateOneClockwise',
                    blockType: BlockType.COMMAND,
                    text: 'Rotate One Spot Clockwise'
                },
                {
                    opcode: 'sendMessage',
                    blockType: BlockType.COMMAND,
                    text: 'Send Display [MESSAGE] to [SATELLITE]',
                    arguments: {
                        MESSAGE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Message'
                        },
                        SATELLITE: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Satellite'
                        }
                    }
                },
                {
                    opcode: 'playSound',
                    blockType: BlockType.COMMAND,
                    text: 'Play Sound [SOUND_MENU]',
                    arguments: {
                        SOUND_MENU: {
                            type: ArgumentType.STRING,
                            defaultValue: 'soundName'
                        }
                    }
                }
            ]
        };
    }

    playSound (args) {
        const soundIndex = this.getSoundIndexByName(args.SOUND_MENU, this.runtime.targets[1].sprite.sounds);
        const soundId = this.runtime.targets[1].sprite.sounds[soundIndex].soundId;
        const sprite = this.runtime.targets[1].sprite;
        return sprite.soundBank.playSound(this.runtime.targets[1], soundId);
    }

    playMQTTsound (args, util) {
        if (!this._soundWait) {
            this._clearSoundGlow = false;
            util.yield();
        }
        if (this._soundMessage !== '') {
            const soundIndex = this.getSoundIndexByName(this._soundMessage, this.runtime.targets[1].sprite.sounds);
            const soundId = this.runtime.targets[1].sprite.sounds[soundIndex].soundId;
            const sprite = this.runtime.targets[1].sprite;
            return sprite.soundBank.playSound(this.runtime.targets[1], soundId)
                .then(() => {
                    this.stopSoundBlock();
                });
        }
    }

    getSoundIndexByName (soundName, util) {
        const sounds = util;
        for (let i = 0; i < sounds.length; i++) {
            if (sounds[i].name === soundName) {
                return i;
            }
        }
        // if there is no sound by that name, return -1
        return -1;
    }

    whenSpriteIsClicked (args, util) {
        if (util.target.isTouchingObject('_mouse_') && this.getMouseDown(args, util)) {
            this._peripheral.sendTouch(args);
        }
    }


    sequenceSpeed (args, util) {
        if (util.stackTimerNeedsInit()) {
            const duration = Cast.toNumber(args.DURATION) * 1000;
            util.startStackTimer(duration);
            this.runtime.requestRedraw();
            util.yield();
        } else if (!util.stackTimerFinished()) {
            util.yield();
        }
    }

    /**
     * Updating the SVG of the currentCostume
     * @param {number} costumeIndex - the index of the costume
     * @param {object} svg - the svg of the costume.
     * @param {number} rotationCenterX - the X axis of the costume.
     * @param {number} rotationCenterY - the Y axis of the costume.
     */
    updateSvg (costumeIndex, svg, rotationCenterX, rotationCenterY) {
        const costume = vm.editingTarget.getCostumes()[costumeIndex];
        if (costume && this.runtime && this.runtime.renderer) {
            costume.rotationCenterX = rotationCenterX;
            costume.rotationCenterY = rotationCenterY;
            this.runtime.renderer.updateSVGSkin(costume.skinId, svg, [rotationCenterX, rotationCenterY]);
            costume.size = this.runtime.renderer.getSkinSize(costume.skinId);
        }
        const storage = this.runtime.storage;
        // If we're in here, we've edited an svg in the vector editor,
        // so the dataFormat should be 'svg'
        costume.dataFormat = storage.DataFormat.SVG;
        costume.bitmapResolution = 1;
        costume.asset = storage.createAsset(
            storage.AssetType.ImageVector,
            costume.dataFormat,
            encoder.encode(svg),
            null,
            true // generate md5
        );
        costume.assetId = costume.asset.assetId;
        costume.md5 = `${costume.assetId}.${costume.dataFormat}`;
        vm.emitTargetsUpdate();
    }

    stopBlock () {
        this._timeoutIdAmount = 0;
        this.emit(Runtime.STOP_FOR_TARGET);
        this.runtime.requestRedraw();
        this._timeoutIds.forEach(id => clearTimeout(id));
        this._time = 0;
        this._message = '';
        const newCostumeSVG2 = original.originalCostume;
        const copyOfCostumeToBeChanged = {};
        Object.assign(copyOfCostumeToBeChanged, newCostumeSVG2);
        const svg = Object.values(copyOfCostumeToBeChanged).join('');
        this.updateSvg(0, svg, 28, 23);
        this._wait = false;
        this._looping = false;
        this._clearGlow = true;
        this._connectNumber = 0;
        this._totalAmount = 0;
        this._totalComp = 0;
        this._copyOfCostume.length = 0;
        this._j = 0;
    }

    stopSoundBlock () {
        this._soundMessage = '';
        this._soundWait = false;
        this._connectSoundNumber = 0;
        this._clearSoundGlow = true;
    }

    mqttStartBranchLoop (args, util) {
        if (!this._wait) {
            this._clearGlow = false;
            util.yield();
        }
        if (this._message !== '') {
            let seq = '';
            let splitArgs = [];
            let loopAmount = '';
            this.emit('started');
            splitArgs = this._message.split(',');
            const splitForLoopNum = splitArgs[0].split(':');
            loopAmount = splitForLoopNum[1].trim();
            const sat = require(`!!raw-loader!./lightSequences/${splitArgs[1]}`);
            const split = sat.split('\n');
            const filtered = split.filter(e => e === 0 || e);
            seq = filtered.join(',');
            const stringSplit = seq.split(',');
            const filteredList = stringSplit.filter(e => e === 0 || e);
            let arrayLength = filteredList.length;
            const positions = [];
            const totalPos = [];
            while (arrayLength > 0) {
                while (filteredList[this._j].includes('L')) {
                    positions.push(filteredList[this._j]);
                    this._j++;
                    arrayLength--;
                }
                totalPos.push(positions.join(','));
                if (filteredList[this._j].includes('D')) {
                    totalPos.push(filteredList[this._j]);
                    this._j++;
                    positions.length = 0;
                    arrayLength--;
                }
            }
            let loops = 5000; // take this out!
            if (loopAmount < 0) {
                while (loops > 0) { // take this out!
                    this.runtime.emit('loopingSet');
                    // util.startBranch(1, true);
                    const Parse = require('./parse-sequence');
                    const parser = new Parse();
                    const color = '';
                    let k = 0;
                    this._j = 0;
                    let totalLength = totalPos.length;
                    while (totalLength > 0) {
                        if (totalPos[k].includes('L')) {
                            const newTime = totalPos[k].slice(14);
                            const copyOfCostume = parser.parseSingleInput(totalPos[k], this._prevPositions, color);
                            this._copyOfCostume = copyOfCostume;
                            
                            const timeoutId = setTimeout(() => {
                                const svg = Object.values(copyOfCostume).join('');
                                this.updateSvg(0, svg, 28, 23);
                            }, this._time += Cast.toNumber(newTime));

                            this._timeoutIds.push(timeoutId);

                        } else {
                            this._prevPositions.length = 0;
                            const delayTime = totalPos[k].slice(2);
                            const timeoutId = setTimeout(() => {}, this._time += Cast.toNumber(delayTime));
                            this._timeoutIds.push(timeoutId);
                        }

                        k++;
                        totalLength--;
                        loops--;
                    }
                }

            } else {
                const arrayLengthForCalc = totalPos.length;
                this._totalAmount = arrayLengthForCalc * loopAmount;
                while (loopAmount > 0) {
                    const Parse = require('./parse-sequence');
                    const parser = new Parse();
                    const color = '';
                    let newArrayLength = totalPos.length;
                    let k = 0;
                    while (newArrayLength > 0) {
                        if (totalPos[k].includes('L')) {
                            const newTime = totalPos[k].slice(14);
                            const copyOfCostume = parser.parseSingleInput(totalPos[k], this._prevPositions, color);
                            this._copyOfCostume = copyOfCostume;
                            
                            const timeoutId = setTimeout(() => {
                                const svg = Object.values(copyOfCostume).join('');
                                this.updateSvg(0, svg, 28, 23);
                                this._totalComp++;
                                if (this._totalComp === this._totalAmount) {
                                    this.runtime.emit('threadDone');
                                }
                            }, this._time += Cast.toNumber(newTime));
                            this._timeoutIds.push(timeoutId);
                        } else {
                            this._prevPositions.length = 0;
                            const delayTime = totalPos[k].slice(2);
                            const timeoutId = setTimeout(() => {
                                this._totalComp++;
                                if (this._totalComp === this._totalAmount) {
                                    this.runtime.emit('threadDone');
                                }
                            }, this._time += Cast.toNumber(delayTime));
                            this._copyOfCostume = {};
                            this._timeoutIds.push(timeoutId);
                        }
                        newArrayLength--;
                        k++;
                    }
                    loopAmount--;
                }
            }
        }
    }

    whenMQTTSoundDetected () {
        if (this._connectSoundNumber === 0) {
            this._connectSoundNumber++;
            this._soundMessage = '';
            this.runtime.on('playSound', data => {
                if (!this._clearSoundGlow) {
                    this._soundMessage = data;
                    this._soundWait = true;
                }
            });
        }
    }


    whenLightSequenceDetected () {
        if (this._connectNumber === 0) {
            this._connectNumber++;
            this._message = '';
            this.runtime.on('displaySequence', data => {
                if (!this._clearGlow) {
                    this._message = data;
                    const splitArgs = this._message.split(',');
                    const splitForLoopNum = splitArgs[0].split(':');
                    const loopAmount = splitForLoopNum[1].trim();
                    if (loopAmount < 0) {
                        this._looping = true;
                        this._loopAmount = loopAmount;
                    } else {
                        this._looping = false;
                        this._loopAmount = loopAmount;
                    }
                    this._wait = true;
                }
            });
        }
    }

    /**
     * Starting the sequence
     * @param {object} args - a light sequence id.
     * @param {object} util - block utility for target
     */
    startSequence (args) {
        let seq = '';
        let splitArgs = [];
        let loopAmount = '';
        this.emit('started');
        splitArgs = args.LIGHT.split(',');
        const splitForLoopNum = splitArgs[0].split(':');
        loopAmount = splitForLoopNum[1].trim();
        const sat = require(`!raw-loader!./lightSequences/${splitArgs[1]}`);
        const split = sat.split('\n');
        const filtered = split.filter(e => e === 0 || e);
        seq = filtered.join(',');
        const stringSplit = seq.split(',');
        const filteredList = stringSplit.filter(e => e === 0 || e);
        let arrayLength = filteredList.length;
        const positions = [];
        const totalPos = [];
        while (arrayLength > 0) {
            while (filteredList[this._j].includes('L')) {
                positions.push(filteredList[this._j]);
                this._j++;
                arrayLength--;
            }
            totalPos.push(positions.join(','));
            if (filteredList[this._j].includes('D')) {
                totalPos.push(filteredList[this._j]);
                this._j++;
                positions.length = 0;
                arrayLength--;
            }
        }
        let loops = 10000; // take this out!
        if (loopAmount < 0) {
            while (loops > 0) { // take this out!
                this.runtime.emit('loopingSet');
                // util.startBranch(1, true);
                const Parse = require('./parse-sequence');
                const parser = new Parse();
                const color = '';
                let k = 0;
                this._j = 0;
                let totalLength = totalPos.length;
                while (totalLength > 0) {
                    if (totalPos[k].includes('L')) {
                        const newTime = totalPos[k].slice(14);
                        const copyOfCostume = parser.parseSingleInput(totalPos[k], this._prevPositions, color);
                        this._copyOfCostume = copyOfCostume;
                        
                        const timeoutId = setTimeout(() => {
                            const svg = Object.values(copyOfCostume).join('');
                            this.updateSvg(0, svg, 28, 23);
                        }, this._time += Cast.toNumber(newTime));

                        this._timeoutIds.push(timeoutId);

                    } else {
                        this._prevPositions.length = 0;
                        const delayTime = totalPos[k].slice(2);
                        const timeoutId = setTimeout(() => {}, this._time += Cast.toNumber(delayTime));
                        this._timeoutIds.push(timeoutId);
                    }

                    k++;
                    totalLength--;
                    loops--;
                }
            }

        } else {
            const arrayLengthForCalc = totalPos.length;
            this._totalAmount = arrayLengthForCalc * loopAmount;
            while (loopAmount > 0) {
                const Parse = require('./parse-sequence');
                const parser = new Parse();
                const color = '';
                let newArrayLength = totalPos.length;
                let k = 0;
                while (newArrayLength > 0) {
                    if (totalPos[k].includes('L')) {
                        const newTime = totalPos[k].slice(14);
                        const copyOfCostume = parser.parseSingleInput(totalPos[k], this._prevPositions, color);
                        this._copyOfCostume = copyOfCostume;
                        
                        const timeoutId = setTimeout(() => {
                            const svg = Object.values(copyOfCostume).join('');
                            this.updateSvg(0, svg, 28, 23);
                            this._totalComp++;
                            if (this._totalComp === this._totalAmount) {
                                this.runtime.emit('threadDone');
                            }
                        }, this._time += Cast.toNumber(newTime));
                        this._timeoutIds.push(timeoutId);
                    } else {
                        this._prevPositions.length = 0;
                        const delayTime = totalPos[k].slice(2);
                        const timeoutId = setTimeout(() => {
                            this._totalComp++;
                            if (this._totalComp === this._totalAmount) {
                                this.runtime.emit('threadDone');
                            }
                        }, this._time += Cast.toNumber(delayTime));
                        this._copyOfCostume = {};
                        this._timeoutIds.push(timeoutId);
                    }
                    newArrayLength--;
                    k++;
                }
                loopAmount--;
            }
        }
    }

    /**
     * Starting the sequence
     * @param {object} args - a light sequence id.
     * @param {object} util - target.
     */
    startSequenceWithSound (args) {
        let seq = '';
        this.emit('started');
        if (this._message === ''){
            seq = Cast.toString(args.LIGHT);
        } else {
            seq = this._message;
        }
        const Parse = require('./parse-sequence');
        const parser = new Parse();
        const color = '';
        const stringSplit = seq.split(',');
        const filteredList = stringSplit.filter(e => e === 0 || e);
        let arrayLength = filteredList.length;
        let k = 0;
        while (arrayLength > 0) {
            if (filteredList[k].includes('L')) {
                const newTime = filteredList[k].slice(14);
                const copyOfCostume = parser.parseSingleInput(filteredList[k], this._prevPositions, color);

                setTimeout(() => {
                    const svg = Object.values(copyOfCostume).join('');
                    this.updateSvg(0, svg, 28, 23);
                }, this._time += Cast.toNumber(newTime));

            } else {
                const newCostumeSVG2 = original.originalCostume;
                const copyOfCostumeToBeChanged = {};
                Object.assign(copyOfCostumeToBeChanged, newCostumeSVG2);
                this._prevPositions.length = 0;
                const delayTime = filteredList[k].slice(2);
                setTimeout(() => {
                    const svg = Object.values(copyOfCostumeToBeChanged).join('');
                    this.updateSvg(0, svg, 28, 23);
                }, this._time += Cast.toNumber(delayTime));
            }
            arrayLength--;
            k++;
        }
    }

    getMouseDown (args, util) {
        return util.ioQuery('mouse', 'getIsDown');
    }

    isTouchingObject (requestedObject) {
        if (requestedObject === '_mouse_') {
            if (!this.runtime.ioDevices.mouse) return false;
            const mouseX = this.runtime.ioDevices.mouse.getClientX();
            const mouseY = this.runtime.ioDevices.mouse.getClientY();
            return this.isTouchingPoint(mouseX, mouseY);
        } else if (requestedObject === '_edge_') {
            return this.isTouchingEdge();
        }
        return this.isTouchingSprite(requestedObject);
    }

    isTouchingPoint (x, y) {
        if (this.renderer) {
            return this.renderer.drawableTouching(this.drawableID, x, y);
        }
        return false;
    }

    /**
     * Adding a another input to the input field
     * @param {object} args - the light positions
     * @return {string} lights - the string of sequence lines.
     */
    addPosition (args) {
        const light1 = Cast.toString(args.LIGHT);
        const light2 = Cast.toString(args.LIGHT2);
        const lights = [];
        lights.push(light1);
        lights.push(light2);
        return lights;
    }

    /**
     * Rotating every current light sequence one spot clockwise.
     * @param {object} util - the block utility
     */
    rotateOneClockwise () {
        const newCostumeSVG = original.originalCostume;
        const copyOfCostume = {};
        Object.assign(copyOfCostume, newCostumeSVG);
        const newPositions = [];
        let color = '';
        let length = this._prevPositions.length;
        const tempArray = [];
        if (length > 1) {
            let i = 0;
            while (length > 0) {
                const stringToEdit = this._prevPositions[i];
                const splitString = stringToEdit.split(',');
                const filteredString = splitString.filter(e => e === 0 || e);
                const theColor = filteredString.splice(0, 1);
                color = theColor;
                tempArray.push(color);
                filteredString.forEach(item => {
                    let newPosition = (+item + Cast.toNumber(1));
                    if (newPosition === 17) {
                        newPosition = 1;
                    }
                    copyOfCostume[`Light${newPosition}`] = `"#${color}"`;
                    tempArray.push(newPosition);
                });
                i++;
                length--;
                let tempString = tempArray.join();
                newPositions.push(tempString);
                tempString = '';
                tempArray.length = 0;
            }
        } else {
            const singleLine = this._prevPositions.join();
            const singleString = singleLine.split(',');
            const theColor = singleString.splice(0, 1);
            color = theColor;
            tempArray.push(color);
            singleString.map(item => {
                let newPosition = (+item + Cast.toNumber(1));
                if (newPosition === 17) {
                    newPosition = 1;
                }
                copyOfCostume[`Light${newPosition}`] = `"#${color}"`;
                tempArray.push(newPosition);
            });
            let tempString = tempArray.join();
            newPositions.push(tempString);
            tempString = '';
            tempArray.length = 0;
        }
        const svg = Object.values(copyOfCostume).join('');
        vm.updateSvg(0, svg, 28, 23);
        this._prevPositions.length = 0;
        newPositions.map(move => {
            this._prevPositions.push(move);
        });
    }

    /**
     * The block to send a MQTT message
     * @param {object} args - the message to be sent to MQTT.
     */
    sendMessage (args) {
        this._peripheral.displayLightSequence(args);
    }
}


module.exports = Scratch3Satellite;
