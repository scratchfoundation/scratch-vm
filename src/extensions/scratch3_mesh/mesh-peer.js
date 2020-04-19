const MeshService = require('./mesh-service');
const BlockUtility = require('../../engine/block-utility.js');

class MeshPeer extends MeshService {
    get logPrefix () {
        return 'Mesh Peer';
    }

    connect (hostMeshId) {
        if (this.connectionState === 'connected') {
            this.infoLog('Already connected');
            return;
        }
        if (this.connectionState === 'connecting') {
            this.infoLog('Now connecting, please wait to connect.');
            return;
        }

        if (!hostMeshId || hostMeshId.trim() === '') {
            this.setConnectionState('request_error');

            this.errorLog('Not select Host Mesh ID');
            return;
        }

        this.hostMeshId = hostMeshId;

        this.setConnectionState('connecting');

        this.changeWebRTCIPHandlingPolicy();

        const connection = this.openRTCPeerConnection(hostMeshId);

        connection.onconnectionstatechange = () => {
            this.onRTCConnectionStateChange(connection, hostMeshId);
        };
        connection.onicecandidate = event => {
            this.onRTCICECandidate(connection, hostMeshId, event, description => {
                this.debugLog(`Offer to Host: host=<${hostMeshId}> description=<\n` +
                              `${JSON.stringify(description, null, 2)}\n` +
                              `>`);

                this.sendWebSocketMessage('offer', {
                    meshId: this.meshId,
                    hostMeshId: hostMeshId,
                    clientDescription: description
                });
            });
        };

        const dataChannel = connection.createDataChannel('dataChannel');
        dataChannel.onopen = () => {
            this.onRTCDataChannelOpen(connection, dataChannel, hostMeshId);
        };
        dataChannel.onmessage = e => {
            this.onRTCDataChannelMessage(connection, dataChannel, hostMeshId, e);
        };
        dataChannel.onclose = () => {
            this.onRTCDataChannelClose(connection, dataChannel, hostMeshId);
        };

        connection.createOffer().then(
            desc => {
                connection.setLocalDescription(desc);
            },
            error => {
                this.setConnectionState('request_error');
                this.errorLog(`Failed createOffer: host=<${hostMeshId}> reason=<${error}>`);
            }
        );

        this.connectTimeoutId =
            setTimeout(this.onConnectTimeout.bind(this), this.connectTimeoutSeconds * 1000);
    }

    onConnectTimeout () {
        this.connectTimeoutId = null;
        if (!this.isConnected()) {
            Object.keys(this.rtcConnections).forEach(meshId => {
                this.rtcConnections[meshId].close();
            });
            this.rtcConnections = {};
            this.rtcDataChannels = {};

            this.webSocket.close();
        }
    }

    onWebSocketClose () {
        this.debugLog('WebSocket closed.');
    }

    offerWebSocketAction (result, data) {
        if (!result) {
            this.setConnectionState('request_error');

            this.errorLog(`Failed to offer: reason=<${data.error}>`);
            return;
        }

        this.infoLog(`Offered to host: host=<${data.hostMeshId}>`);
    }

    answerWebSocketAction (result, data) {
        const hostMeshId = data.meshId;

        if (this.connectionState !== 'connecting') {
            this.logError(`Received answer, but WebRTC not connecting: host=<${hostMeshId}>`);
            return;
        }

        if (data.clientMeshId !== this.meshId) {
            this.setConnectionState('request_error');

            this.logError(`Invalid Mesh ID in answer from host:` +
                          ` host=<${hostMeshId}> received=<${data.clientMeshId}> own=<${this.meshId}>`);
            return;
        }

        const connection = this.rtcConnections[hostMeshId];
        connection.setRemoteDescription(new RTCSessionDescription(data.hostDescription));
    }

    onRTCDataChannelOpen (connection, dataChannel, peerMeshId) {
        MeshService.prototype.onRTCDataChannelOpen.call(this, connection, dataChannel, peerMeshId);

        this.setConnectionState('connected');
    }

    onRTCDataChannelClose (connection, dataChannel, peerMeshId) {
        MeshService.prototype.onRTCDataChannelClose.call(this, connection, dataChannel, peerMeshId);

        this.setConnectionState('disconnected');
    }

    broadcastRTCAction (peerMeshId, message) {
        const broadcast = message.data;

        if (this.meshId === message.owner) {
            this.debugLog(`Ignore broadcast: reason=<own broadcast> ${JSON.stringify(broadcast)}`);
            return;
        }

        this.debugLog(`Process broadcast: name=<${broadcast.name}>`);

        const args = {
            BROADCAST_OPTION: {
                id: null,
                name: broadcast.name
            }
        };
        const util = BlockUtility.lastInstance();
        if (!util.sequencer) {
            util.sequencer = this.runtime.sequencer;
        }
        this.blocks.opcodeFunctions.event_broadcast(args, util);
    }

    variableRTCAction (peerMeshId, message) {
        const variable = message.data;

        if (this.meshId === message.owner) {
            this.debugLog(`Ignore variable: reason=<own variable> ${JSON.stringify(variable)}`);
            return;
        }

        this.setVariable(variable.name, variable.value, message.owner);
    }
}

module.exports = MeshPeer;
