/* eslint-disable linebreak-style */
const mqtt = require('mqtt');
const EventEmitter = require('events');

class MqttConnect extends EventEmitter {
    constructor () {
        super();
        this.broker = null;
        this.username = null;
        this.password = null;
        this._client = null;
        this.runtime = null;
    }

    static connect (host, username, password, runtime) {
        console.log(`connected fired with url = ${host}`);
        this.runtime = runtime;
        console.log(this.runtime, 'runtime from connect');
        if (host && !username) this.broker = `ws://${host}:3000`;
        if (host && username) this.broker = `wss://${host}:3000`;
        if (username) this.username = username;
        if (password) this.password = password;
        if (!this.broker) {
            this._onError();
            return;
        }
        console.log(`will connect with = ${this.broker}`);
        if (this._client) {
        // connect to the possibly new broker
            this._client.end(false, this.performConnection.bind(this));
        } else {
            this.performConnection();
        }
        if (this._client) {
            return this._client;
        }
        return null;
    }

    _onError (error) {
        console.log(`onError fired with: ${error}`);
        // this.props.vm.setClient(null);
        // this.props.setMQTTStatus(false);
        // this.props.setFirstSatName('');
        if (this._client) {
            this._client.end();
            this._client = null;
        }
    }

    static performConnection () {
        let options = null;
        console.log(this.username, 'username');
        console.log(this.password, 'password');
        if (this._clent) {
            console.log(`performConnection fired but already connected`);
            return;
        }
        console.log(`performConnection fired`);
        if (this.username && this.password) {
            options = {
                username: `${this.username}`,
                password: `${this.password}`
            };
        }
        if (!this.username && !this.password) {
            this.username = 'Virtual Sat';
        }
        console.log(options, 'options');
        if (options) {
            this._client = mqtt.connect(this.broker, options);
        } else {
            this._client = mqtt.connect(this.broker);
        }
        if (!this._client) this._onError();

        if (this._client) {
            console.log(this._client, 'client from mqttCOnnect');
            console.log(`Connected to ${this.broker}`);
            this.runtime.emit(this.runtime.constructor.CLIENT_CONNECTED);
            return this._client;
            // this.props.setFirstSatName(this.username);
            // this.props.setMQTTStatus(true);
        }

        // bind the event handlers
        this._client.on('connect', () => this._onConnect());
        this._client.on('close', () => this._onClose());
        this._client.on('error', error => this._onError(error));
        this._client.on('reconnect', () => this._onReconnect());
        this._client.on('message', (topic, payload) => this.runtime.emit('SEND_MESSAGE', (topic, payload)));
      

        // this._onStatusTimer = this._onStatusTimer.bind(this);
        // this._onConnectTimer = this._onConnectTimer.bind(this);

        // this._performConnectTimeout = setTimeout(this._onConnectTimer, 10000);
    }

    _onConnect () {
        console.log(`onConnect fired`);
        // subscribe to all status, radar detection and touch events
        if (this._client) {
            this._client.subscribe('+/sat/+/online');
            this._client.subscribe('sat/+/online');
            this._client.subscribe('fwserver/online');
            this._client.subscribe('fwserver/files');
            this._client.subscribe(`sat/${this.username}/cmd/fx`);
            this._client.subscribe(`+/sat/${this.username}/cmd/fx`);
            this._client.subscribe(`sat/${this.username}/sound/fx`);
            this._client.subscribe(`+/sat/${this.username}/sound/fx`);
            this._client.subscribe('sat/+/ev/radar');
            this._client.subscribe('+/sat/+/ev/radar');
            this._client.subscribe('sat/+/ev/touch');
            this._client.subscribe('+/sat/+/ev/touch');
            this._client.subscribe('app/menu/mode');
            // this.runtime.emit(this.runtime.constructor.CLIENT_CONNECTED);
        }
        // Give everyone 5 seconds to report again
        // this._fetchSatellitesTimeout = setTimeout(this._onStatusTimer, 5000);
    }

    _onReconnect () {
        console.log(`onReconnect fired`);
    }

    _onClose () {
        console.log(`onClose fired`);
        this._connected = false;
        // this.props.setFirstSatName('');
        this.closeConnection();
    }

    static closeConnection () {
        console.log('closeConnection fired');
        if (this._client === null) return;
        this._client.end(true, () => {
            this.props.setClient(null);
            this._client.removeListener('connect', this._onConnect);
            this._client.removeListener('reconnect', this._onReconnect);
            this._client.removeListener('message', this._onMessage);
            this._client.removeListener('close', this._onClose);
            this._client.removeListener('error', this._onError);
            this._client = null;
        });
        // this._runtime.emit(this._runtime.constructor.PERIPHERAL_SCAN_TIMEOUT);
    }

}

module.exports = MqttConnect;
