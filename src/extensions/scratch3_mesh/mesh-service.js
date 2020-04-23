/* global chrome */

const log = require('../../util/log');
const formatMessage = require('format-message');
const Variable = require('../../engine/variable');

const DEBUG = true;
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
            this.debugLog(`Scan: hostMeshId=<${hostMeshId}>`);

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
            this.errorLog(`Failed to scan: reason=<${error}>`);
        }
    }

    connect () {
    }

    isConnected () {
        return this.connectionState === 'connected';
    }

    disconnect () {
        if (this.connectionState === 'disconnected') {
            this.infoLog('Already disconnected.');
            return;
        }
        if (this.connectionState === 'disconnecting') {
            this.infoLog('Now disconnecting, please wait to disconnect.');
            return;
        }

        if (this.connectTimeoutId) {
            clearTimeout(this.connectTimeoutId);
            this.connectTimeoutId = null;
        }

        this.setConnectionState('disconnecting');
        this.webSocket.close();

        Object.keys(this.rtcConnections).forEach(meshId => {
            this.rtcConnections[meshId].close();
        });
        this.rtcConnections = {};
        this.rtcDataChannels = {};
    }

    setConnectionState (connectionState) {
        this.debugLog(`set connection state: from=<${this.connectionState}> to=<${connectionState}>`);

        const prevConnectionState = this.connectionState;

        this.connectionState = connectionState;

        switch (this.connectionState) {
        case 'connected':
            clearTimeout(this.connectTimeoutId);
            this.connectTimeoutId = null;
            this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_CONNECTED);
            break;
        case 'request_error':
            this.disconnect();
            this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_REQUEST_ERROR);
            break;
        case 'disconnected':
            if (prevConnectionState === 'disconnecting') {
                this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_DISCONNECTED);
            } else if (prevConnectionState === 'connecting') {
                this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_REQUEST_ERROR);
            } else {
                this.emitPeripheralEvent(this.runtime.constructor.PERIPHERAL_CONNECTION_LOST_ERROR);
            }
            break;
        }
    }

    onWebSocketOpen () {
        try {
            this.debugLog('WebSocket opened.');

            this.sendWebSocketMessage('list', {
                meshId: this.meshId
            });
        } catch (error) {
            this.errorLog(`Failed in WebSocket open event handler: reason=<${error}>`);
        }
    }

    onWebSocketMessage (event) {
        try {
            this.debugLog(`Received WebSocket message: message=<${event.data}>`);

            const message = JSON.parse(event.data);
            const {action, result, data} = message;

            const actionMethodName = `${action}WebSocketAction`;
            if (this[actionMethodName]) {
                this.infoLog(`Process WebSocket message: ` +
                             `action=${action} result=<${result}> data=<${JSON.stringify(data)}>`);
                this[actionMethodName](result, data);
            } else {
                this.errorLog(`Unknown WebSocket message action: ${action}`);
            }
        } catch (error) {
            this.errorLog(`Failed to process WebSocket message: reason=<${error}>`);
        }
    }

    onWebSocketClose () {
        this.debugLog('WebSocket closed.');
    }

    onWebSocketError (event) {
        this.errorLog(`Occured WebSocket error: ${event}`);
    }

    listWebSocketAction (result, data) {
        if (!result) {
            this.errorLog(`Failed to list: reason=<${data.error}>`);
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

        this.debugLog(`Send WebSocket message: message=<${JSON.stringify(message)}>`);

        this.webSocket.send(JSON.stringify(message));
    }

    openRTCPeerConnection (meshId) {
        if (this.rtcConnections[meshId]) {
            this.infoLog(`Already open WebRTC connection: peer=<${meshId}>`);

            const channel = this.rtcDataChannels[meshId];
            if (channel) {
                channel.onopen = null;
                channel.onmessage = null;
                channel.onclose = null;
                delete this.rtcDataChannels[meshId];
            }
            this.closeRTCPeerConnection(meshId);
        }

        this.debugLog(`Open WebRTC connection: peer=<${meshId}>`);

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
        this.debugLog(`Changed WebRTC connection state: ${connection.connectionState}`);

        switch (connection.connectionState) {
        case 'disconnected':
            this.errorLog(`Disconnected WebRTC connection by peer: peer=<${peerMeshId}>`);
            this.closeRTCPeerConnection(peerMeshId);
            break;
        case 'failed':
            this.errorLog(`Failed WebRTC connection: peer=<${peerMeshId}>`);
            this.closeRTCPeerConnection(peerMeshId);
            break;
        }
    }

    onRTCICECandidate (connection, peerMeshId, event, onDescriptionCreate) {
        if (event.candidate) {
            this.debugLog(`ICE candidate: peer=<${peerMeshId}> candidate=<\n` +
                          `${JSON.stringify(event.candidate, null, 2)}\n` +
                          `>`);
        } else {
            onDescriptionCreate(connection.localDescription);
        }
    }

    closeRTCPeerConnection (meshId) {
        this.debugLog(`Close WebRTC connection: peer=<${meshId}>`);

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
        this.debugLog(`Open WebRTC data channel: peer=<${peerMeshId}>`);

        this.revertWebRTCIPHandlingPolicy();

        if (this.rtcDataChannels[peerMeshId]) {
            this.errorLog(`Already open WebRTC data channel: peer=<${peerMeshId}>`);
        }
        this.rtcDataChannels[peerMeshId] = dataChannel;

        this.sendVariablesTo(this.getGlobalVariables(), peerMeshId);
    }

    onRTCDataChannelMessage (connection, dataChannel, peerMeshId, event) {
        try {
            this.debugLog(`Received WebRTC message: peer=<${peerMeshId}> data=<${event.data}>`);

            const message = JSON.parse(event.data);

            const {type, data} = message;

            const actionMethodName = `${type}RTCAction`;
            if (this[actionMethodName]) {
                this.infoLog(`Process WebRTC message: ` +
                             `type=${type} peer=<${peerMeshId}> data=<${JSON.stringify(data)}>`);

                this[actionMethodName](peerMeshId, message);
            } else {
                this.errorLog(`Unknown WebRTC message type: type=<${type}> peer=<${peerMeshId}>`);
            }
        } catch (error) {
            this.errorLog(`Failed to process WebRTC message: ${error}`);
            return;
        }
    }

    onRTCDataChannelClose (connection, dataChannel, peerMeshId) {
        this.debugLog(`Close WebRTC data channel: peer=<${peerMeshId}>`);

        this.closeRTCPeerConnection(peerMeshId);
        delete this.rtcDataChannels[peerMeshId];
    }

    sendMessageToChromeMeshExtension (action) {
        try {
            this.debugLog(`Send message to Chrome mesh extension: action=<${action}>`);

            chrome.runtime.sendMessage(CHROME_MESH_EXTENSION_ID, {action: action}, null, response => {
                if (typeof chrome.runtime.lastError === 'undefined') {
                    this.debugLog(`Succeeded sending message to Chrome mesh extension: ` +
                                  `response=<${JSON.stringify(response)}>`);
                } else {
                    this.errorLog(`Failed to send message to Chrome extension: ` +
                                  `lastError=<${JSON.stringify(chrome.runtime.lastError)}>`);
                }
            });
        } catch (error) {
            this.debugLog(`Failed to send message to Chrome extension: ${error}`);
        }
    }

    changeWebRTCIPHandlingPolicy () {
        this.debugLog('Change WebRTC IPHandlingPolicy to default.');

        this.sendMessageToChromeMeshExtension('change');
    }

    revertWebRTCIPHandlingPolicy () {
        this.debugLog('Revert WebRTC IPHandlingPolicy to before default.');

        this.sendMessageToChromeMeshExtension('revert');
    }

    emitPeripheralEvent (event) {
        this.debugLog(`Emit Peripheral event: event=<${event}>`);

        if (event === this.runtime.constructor.PERIPHERAL_LIST_UPDATE) {
            this.runtime.emit(event, this.availablePeripherals);
        } else {
            this.runtime.emit(event, {
                extensionId: this.blocks.constructor.EXTENSION_ID
            });
        }
    }

    setVariable (name, value, owner) {
        if (this.variables[name]) {
            this.infoLog(`Update variable: name=<${name}> value=<${value}> from=<${this.getVariable(name)}> ` +
                         `owner=<${owner}>`);
        } else {
            this.infoLog(`Create variable: name=<${name}> value=<${value}> ` +
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

        this.debugLog(`Send WebRTC message to all peers: ` +
                      `message=<${JSON.stringify(message)}> peers=<${peers.join(', ')}>`);

        try {
            peers.forEach(meshId => {
                const channel = this.rtcDataChannels[meshId];
                channel.send(JSON.stringify(message));
            });
        } catch (error) {
            this.errorLog(`Failed to send WebRTC message: error=<${error}> message=<${JSON.stringify(message)}>`);
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

            this.debugLog(`Send WebRTC message: ` +
                          `message=<${JSON.stringify(message)}> peer=<${peerMeshId}>`);

            channel.send(JSON.stringify(message));
        });
    }

    debugLog (message) {
        if (DEBUG) {
            log.log(`(${this.logPrefix}) ${message}`);
        }
    }

    infoLog (message) {
        log.info(`(${this.logPrefix}) ${message}`);
    }

    errorLog (message) {
        log.error(`(${this.logPrefix}) ${message}`);
    }
}

module.exports = MeshService;
