const MeshService = require('./mesh-service');
const MeshPeer = require('./mesh-peer');

class MeshHost extends MeshService {
    constructor (blocks, meshId, webSocket) {
        super(blocks, meshId, webSocket);

        this.isHost = true;
    }

    get logPrefix () {
        return 'Mesh Host';
    }

    connect () {
        if (this.connectionState === 'connected') {
            this.infoLog('Already connected');
            return;
        }
        if (this.connectionState === 'connecting') {
            this.infoLog('Now connecting, please wait to connect.');
            return;
        }

        this.setConnectionState('connecting');

        this.sendWebSocketMessage('register', {
            meshId: this.meshId
        });

        this.connectTimeoutId =
            setTimeout(this.onConnectTimeout.bind(this), this.connectTimeoutSeconds * 1000);
    }

    onConnectTimeout () {
        this.connectTimeoutId = null;
        if (!this.isConnected()) {
            this.webSocket.close();
        }
    }

    onWebSocketClose () {
        this.setConnectionState('disconnected');
    }

    registerWebSocketAction (result, data) {
        if (!result) {
            this.setConnectionState('request_error');
            this.errorLog(`Failed to register: reason=<${data.error}>`);
            return;
        }

        this.setConnectionState('connected');
        this.infoLog('Connected as Mesh Host.');
    }

    offerWebSocketAction (result, data) {
        const peerMeshId = data.meshId;
        if (data.hostMeshId !== this.meshId) {
            this.logError(`Invalid Mesh ID in offer from peer:` +
                          ` peer=<${peerMeshId}> received=<${data.hostMeshId}> own=<${this.meshId}>`);

            this.sendWebSocketMessage('answer', {
                meshId: this.meshId,
                clientMeshId: peerMeshId
            }, false);
            return;
        }

        this.changeWebRTCIPHandlingPolicy();

        const connection = this.openRTCPeerConnection(peerMeshId);

        connection.onconnectionstatechange = () => {
            this.onRTCConnectionStateChange(connection, peerMeshId);
        };
        connection.onicecandidate = event => {
            this.onRTCICECandidate(connection, peerMeshId, event, description => {
                this.debugLog(`Answer to Peer: peer=<${peerMeshId}> description=<\n` +
                              `${JSON.stringify(description, null, 2)}\n` +
                              `>`);

                this.sendWebSocketMessage('answer', {
                    meshId: this.meshId,
                    clientMeshId: peerMeshId,
                    hostDescription: description
                });
            });
        };
        connection.ondatachannel = event => {
            this.onRTCDataChannel(connection, peerMeshId, event);
        };

        connection.setRemoteDescription(new RTCSessionDescription(data.clientDescription));

        connection.createAnswer().then(
            desc => {
                connection.setLocalDescription(desc);
            },
            error => {
                this.errorLog(`Failed createAnswer: peer=<${peerMeshId}> reason=<${error}>`);
                this.closeRTCPeerConnection(peerMeshId);
            }
        );
    }

    onRTCDataChannel (connection, peerMeshId, event) {
        this.debugLog(`WebRTC data channel by remote peer: peer=<${peerMeshId}>`);

        const dataChannel = event.channel;

        dataChannel.onopen = () => {
            this.onRTCDataChannelOpen(connection, dataChannel, peerMeshId);
        };
        dataChannel.onmessage = e => {
            this.onRTCDataChannelMessage(connection, dataChannel, peerMeshId, e);
        };
        dataChannel.onclose = () => {
            this.onRTCDataChannelClose(connection, dataChannel, peerMeshId);
        };
    }

    onRTCDataChannelOpen (connection, dataChannel, peerMeshId) {
        MeshService.prototype.onRTCDataChannelOpen.call(this, connection, dataChannel, peerMeshId);
        this.sendVariablesTo(this.variables, peerMeshId);
    }

    answerWebSocketAction (result, data) {
        if (!result) {
            this.closeRTCPeerConnection(data.clientMeshId);
            this.errorLog(`Failed to answer: reason=<${data.error}>`);
            return;
        }

        this.infoLog(`Answered to peer: peer=<${data.clientMeshId}>`);
    }

    broadcastRTCAction (peerMeshId, message) {
        this.sendRTCMessage(message);

        MeshPeer.prototype.broadcastRTCAction.call(this, peerMeshId, message);
    }

    variableRTCAction (peerMeshId, message) {
        this.sendRTCMessage(message);

        MeshPeer.prototype.variableRTCAction.call(this, peerMeshId, message);
    }
}

module.exports = MeshHost;
