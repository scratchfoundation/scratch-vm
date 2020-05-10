/* global chrome */

const formatMessage = require('format-message');
const Variable = require('../../engine/variable');

const log = require('../../util/log');
const debugLogger = require('../../util/debug-logger');
const debug = debugLogger(true);

const CHROME_MESH_EXTENSION_ID = 'ioaoebnfpgnbehdolokpdddomfnhpckn';
const MESH_WSS_URL = 'wss://api.smalruby.app/mesh-signaling';

class MeshService {
    constructor (blocks, meshId, webSocket) {
        this.blocks = blocks;

        this.runtime = this.blocks.runtime;

        this.meshId = meshId;

        this.setWebSocket(webSocket);

        this.connectionState = 'disconnected';

        this.connectTimeoutId = null;

        this.connectTimeoutSeconds = 10;

        this.rtcConnections = {};

        this.rtcDataChannels = {};

        this.variables = {};

        this.variableNames = [];

        this.availablePeripherals = {};
    }

    get logPrefix () {
        return 'Mesh Service';
    }

    setWebSocket (webSocket) {
        this.webSocket = webSocket;

        if (this.webSocket) {
            this.webSocket.onopen = this.onWebSocketOpen.bind(this);
            this.webSocket.onmessage = this.onWebSocketMessage.bind(this);
            this.webSocket.onclose = this.onWebSocketClose.bind(this);
            this.webSocket.onerror = this.onWebSocketError.bind(this);
        }
    }

    isWebSocketOpened () {
        return this.webSocket && this.webSocket.readyState === 1;
    }

    openWebSocket () {
        if (!this.webSocket || this.webSocket.readyState === 2 || this.webSocket.readyState === 3) {
            this.setWebSocket(new WebSocket(MESH_WSS_URL));
        }
    }

    scan (hostMeshId) {
        try {
            debug(() => `Scan: hostMeshId=<${hostMeshId}>`);

            this.availablePeripherals = {};
            this.availablePeripherals[hostMeshId] = {
                name: formatMessage({
                    id: 'mesh.hostPeripheralName',
                    default: 'Host Mesh [{ MESH_ID }]',
                    description: 'label for "Host Mesh" in connect modal for Mesh extension'
                }, {MESH_ID: this.blocks.makeMeshIdLabel(this.meshId)}),
                peripheralId: hostMeshId,
                rssi: 0
            };

            this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_LIST_UPDATE);

            if (this.isWebSocketOpened()) {
                this.sendWebSocketMessage('list', {
                    meshId: this.meshId
                });
            } else {
                this.openWebSocket();
            }
        } catch (error) {
            log.error(`Failed to scan: reason=<${error}>`);
        }
    }

    connect () {
    }

    isConnected () {
        return this.connectionState === 'connected';
    }

    requestDisconnect () {
        debug(() => 'MeshService.requestDisconnect');

        this.setConnectionState('disconnecting');
        this.disconnect();
    }

    disconnect () {
        debug(() => 'MeshService.disconnect');

        if (this.connectionState === 'disconnected') {
            log.info('Already disconnected.');
            return;
        }

        if (this.connectTimeoutId) {
            clearTimeout(this.connectTimeoutId);
            this.connectTimeoutId = null;
        }

        this.webSocket.close();

        Object.keys(this.rtcConnections).forEach(meshId => {
            this.rtcConnections[meshId].close();
        });
        this.rtcConnections = {};
        this.rtcDataChannels = {};

        this.setConnectionState('disconnected');
    }

    setConnectionState (connectionState) {
        const prevConnectionState = this.connectionState;

        debug(() => `set connection state: from=<${prevConnectionState}> to=<${connectionState}>`);

        this.connectionState = connectionState;

        switch (this.connectionState) {
        case 'connected':
            clearTimeout(this.connectTimeoutId);
            this.connectTimeoutId = null;
            this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_CONNECTED);
            break;
        case 'disconnected':
            if (prevConnectionState === 'connecting') {
                this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_REQUEST_ERROR);
            } else if (prevConnectionState !== 'disconnecting' && prevConnectionState !== 'disconnected') {
                this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR);
            }
            this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_DISCONNECTED);
            break;
        }
    }

    onWebSocketOpen () {
        try {
            debug(() => 'WebSocket opened.');

            this.sendWebSocketMessage('list', {
                meshId: this.meshId
            });
        } catch (error) {
            log.error(`Failed in WebSocket open event handler: reason=<${error}>`);
        }
    }

    onWebSocketMessage (event) {
        try {
            debug(() => `Received WebSocket message: message=<${event.data}>`);

            const message = JSON.parse(event.data);
            const {action, result, data} = message;

            const actionMethodName = `${action}WebSocketAction`;
            if (this[actionMethodName]) {
                log.info(`Process WebSocket message: ` +
                         `action=${action} result=<${result}> data=<${JSON.stringify(data)}>`);
                this[actionMethodName](result, data);
            } else {
                log.error(`Unknown WebSocket message action: ${action}`);
            }
        } catch (error) {
            log.error(`Failed to process WebSocket message: reason=<${error}>`);
        }
    }

    onWebSocketClose () {
        debug(() => 'WebSocket closed.');
    }

    onWebSocketError (event) {
        log.error(`Occured WebSocket error: ${event}`);
    }

    listWebSocketAction (result, data) {
        if (!result) {
            log.error(`Failed to list: reason=<${data.error}>`);
            return;
        }

        const now = Math.floor(Date.now() / 1000);
        data.hosts.forEach(host => {
            const t = host.ttl - now;
            let rssi;
            if (t >= 4 * 60) {
                rssi = 0;
            } else if (t >= 3 * 60) {
                rssi = -20;
            } else if (t >= 2 * 60) {
                rssi = -40;
            } else if (t >= 1 * 60) {
                rssi = -60;
            } else {
                rssi = -80;
            }
            this.availablePeripherals[host.meshId] = {
                name: formatMessage({
                    id: 'mesh.clientPeripheralName',
                    default: 'Join Mesh [{ MESH_ID }]',
                    description: 'label for "Join Mesh" in connect modal for Mesh extension'
                }, {MESH_ID: this.blocks.makeMeshIdLabel(host.meshId)}),
                peripheralId: host.meshId,
                rssi: rssi
            };
        });

        this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_LIST_UPDATE);
    }

    sendWebSocketMessage (action, data, result) {
        const message = {
            action: action,
            data: data
        };
        if (typeof result !== 'undefined') {
            message.result = result;
        }

        debug(() => `Send WebSocket message: message=<${JSON.stringify(message)}>`);

        this.webSocket.send(JSON.stringify(message));
    }

    openRTCPeerConnection (meshId) {
        if (this.rtcConnections[meshId]) {
            log.info(`Already open WebRTC connection: peer=<${meshId}>`);

            const channel = this.rtcDataChannels[meshId];
            if (channel) {
                channel.onopen = null;
                channel.onmessage = null;
                channel.onclose = null;
                delete this.rtcDataChannels[meshId];
            }
            this.closeRTCPeerConnection(meshId);
        }

        debug(() => `Open WebRTC connection: peer=<${meshId}>`);

        const connection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        'stun:stun.l.google.com:19302',
                        'stun:stun1.l.google.com:19302',
                        'stun:stun2.l.google.com:19302',
                        'stun:stun3.l.google.com:19302',
                        'stun:stun4.l.google.com:19302'
                    ]
                }
            ]
        });
        this.rtcConnections[meshId] = connection;
        return connection;
    }

    onRTCConnectionStateChange (connection, peerMeshId) {
        debug(() => `Changed WebRTC connection state: ${connection.connectionState}`);

        switch (connection.connectionState) {
        case 'disconnected':
            log.error(`Disconnected WebRTC connection by peer: peer=<${peerMeshId}>`);
            this.closeRTCPeerConnection(peerMeshId);
            break;
        case 'failed':
            log.error(`Failed WebRTC connection: peer=<${peerMeshId}>`);
            this.closeRTCPeerConnection(peerMeshId);
            break;
        }
    }

    onRTCICECandidate (connection, peerMeshId, event, onDescriptionCreate) {
        if (event.candidate) {
            debug(() => `ICE candidate: peer=<${peerMeshId}> candidate=<\n` +
                  `${JSON.stringify(event.candidate, null, 2)}\n` +
                  `>`);
        } else {
            onDescriptionCreate(connection.localDescription);
        }
    }

    closeRTCPeerConnection (meshId) {
        debug(() => `Close WebRTC connection: peer=<${meshId}>`);

        const connection = this.rtcConnections[meshId];
        if (connection) {
            connection.close();
            delete this.rtcConnections[meshId];
        }
    }

    getGlobalVariables () {
        const variables = {};
        const stage = this.runtime.getTargetForStage();
        for (const varId in stage.variables) {
            const currVar = stage.variables[varId];
            if (currVar.type === Variable.SCALAR_TYPE) {
                variables[currVar.name] = {
                    name: currVar.name,
                    value: currVar.value,
                    owner: this.meshId
                };
            }
        }
        return variables;
    }

    onRTCDataChannelOpen (connection, dataChannel, peerMeshId) {
        debug(() => `Open WebRTC data channel: peer=<${peerMeshId}>`);

        this.revertWebRTCIPHandlingPolicy();

        if (this.rtcDataChannels[peerMeshId]) {
            log.error(`Already open WebRTC data channel: peer=<${peerMeshId}>`);
        }
        this.rtcDataChannels[peerMeshId] = dataChannel;

        this.sendVariablesTo(this.getGlobalVariables(), peerMeshId);
    }

    onRTCDataChannelMessage (connection, dataChannel, peerMeshId, event) {
        try {
            debug(() => `Received WebRTC message: peer=<${peerMeshId}> data=<${event.data}>`);

            const message = JSON.parse(event.data);

            const {type, data} = message;

            const actionMethodName = `${type}RTCAction`;
            if (this[actionMethodName]) {
                log.info(`Process WebRTC message: ` +
                         `type=${type} peer=<${peerMeshId}> data=<${JSON.stringify(data)}>`);

                this[actionMethodName](peerMeshId, message);
            } else {
                log.error(`Unknown WebRTC message type: type=<${type}> peer=<${peerMeshId}>`);
            }
        } catch (error) {
            log.error(`Failed to process WebRTC message: ${error}`);
            return;
        }
    }

    onRTCDataChannelClose (connection, dataChannel, peerMeshId) {
        debug(() => `Close WebRTC data channel: peer=<${peerMeshId}>`);

        this.revertWebRTCIPHandlingPolicy();

        this.closeRTCPeerConnection(peerMeshId);
        delete this.rtcDataChannels[peerMeshId];
    }

    sendMessageToChromeMeshExtension (action) {
        debug(() => `Send message to Chrome mesh extension: action=<${action}>`);

        return new Promise((resolve, reject) => {
            try {
                chrome.runtime.sendMessage(CHROME_MESH_EXTENSION_ID, {action: action}, null, response => {
                    if (typeof chrome.runtime.lastError === 'undefined') {
                        debug(() => `Succeeded sending message to Chrome mesh extension: ` +
                              `response=<${JSON.stringify(response)}>`);
                    } else {
                        log.error(`Failed to send message to Chrome extension: ` +
                                  `lastError=<${JSON.stringify(chrome.runtime.lastError)}>`);
                    }
                    resolve();
                });
            } catch (error) {
                debug(() => `Failed to send message to Chrome extension: ${error}`);
                resolve();
            }
        });
    }

    changeWebRTCIPHandlingPolicy () {
        debug(() => 'Change WebRTC IPHandlingPolicy to default.');

        return this.sendMessageToChromeMeshExtension('change');
    }

    revertWebRTCIPHandlingPolicy () {
        debug(() => 'Revert WebRTC IPHandlingPolicy to before default.');

        return this.sendMessageToChromeMeshExtension('revert');
    }

    emitPeripheralEvent (event) {
        debug(() => `Emit Peripheral event: event=<${event}>`);

        if (event === this.runtime.constructor.PERIPHERAL_LIST_UPDATE) {
            return new Promise(() => this.runtime.emit(event, this.availablePeripherals));
        }
        return new Promise(() => this.runtime.emit(event, {
            extensionId: this.blocks.constructor.EXTENSION_ID
        }));
    }

    setVariable (name, value, owner) {
        if (this.variables[name]) {
            log.info(`Update variable: name=<${name}> value=<${value}> from=<${this.getVariable(name)}> ` +
                     `owner=<${owner}>`);
        } else {
            log.info(`Create variable: name=<${name}> value=<${value}> ` +
                     `owner=<${owner}>`);
        }

        if (!this.variableNames.includes(name)) {
            this.variableNames.push(name);
        }

        this.variables[name] = {
            name: name,
            value: value,
            owner: owner
        };
    }

    getVariable (name) {
        const variable = this.variables[name];
        if (!variable) {
            return '';
        }
        return variable.value;
    }

    sendRTCMessage (message) {
        const peers = Object.keys(this.rtcDataChannels);

        debug(() => `Send WebRTC message to all peers: ` +
              `message=<${JSON.stringify(message)}> peers=<${peers.join(', ')}>`);

        try {
            peers.forEach(meshId => {
                const channel = this.rtcDataChannels[meshId];
                channel.send(JSON.stringify(message));
            });
        } catch (error) {
            log.error(`Failed to send WebRTC message: error=<${error}> message=<${JSON.stringify(message)}>`);
        }
    }

    sendRTCBroadcastMessage (name) {
        this.sendRTCMessage({
            owner: this.meshId,
            type: 'broadcast',
            data: {
                name: name
            }
        });
    }

    sendRTCVariableMessage (name, value) {
        this.sendRTCMessage({
            owner: this.meshId,
            type: 'variable',
            data: {
                name: name,
                value: value
            }
        });
    }

    sendVariablesTo (variables, peerMeshId) {
        const channel = this.rtcDataChannels[peerMeshId];
        Object.keys(variables).forEach(name => {
            const variable = variables[name];

            const message = {
                owner: variable.owner,
                type: 'variable',
                data: {
                    name: variable.name,
                    value: variable.value
                }
            };

            debug(() => `Send WebRTC message: ` +
                  `message=<${JSON.stringify(message)}> peer=<${peerMeshId}>`);

            channel.send(JSON.stringify(message));
        });
    }
}

module.exports = MeshService;
