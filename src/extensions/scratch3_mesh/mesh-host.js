const MeshService = require('./mesh-service');
const MeshPeer = require('./mesh-peer');

const log = require('../../util/log');
const debugLogger = require('../../util/debug-logger');
const debug = debugLogger(true);

const HEATBEAT_MINUTES = 4;

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
            log.info('Already connected');
            return;
        }
        if (this.connectionState === 'connecting') {
            log.info('Now connecting, please wait to connect.');
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

    restartHeatbeat () {
        debug(() => {
            const at = new Date();
            at.setSeconds(at.getSeconds() + HEATBEAT_MINUTES * 60);
            return `Heatbeat: at=<${at.toLocaleString()}>`;
        });

        clearTimeout(this.restartHeatbeatTimeoutId);
        this.restartHeatbeatTimeoutId = setTimeout(() => {
            if (this.connectionState === 'connected') {
                this.sendWebSocketMessage('heartbeat', {
                    meshId: this.meshId
                });

                this.restartHeatbeat();
            }
        }, HEATBEAT_MINUTES * 60 * 1000);
    }

    onWebSocketClose () {
        debug(() => 'WebSocket closed.');

        clearTimeout(this.restartHeatbeatTimeoutId);
        this.restartHeatbeatTimeoutId = null;

        if (this.connectionState !== 'disconnected') {
            this.disconnect();
        }
    }

    registerWebSocketAction (result, data) {
        if (!result) {
            this.setConnectionState('request_error');
            log.error(`Failed to register: reason=<${data.error}>`);
            return;
        }

        this.setConnectionState('connected');
        log.info('Connected as Mesh Host.');

        this.restartHeatbeat();
    }

    offerWebSocketAction (result, data) {
        const peerMeshId = data.meshId;
        if (data.hostMeshId !== this.meshId) {
            log.error(`Invalid Mesh ID in offer from peer:` +
                      ` peer=<${peerMeshId}> received=<${data.hostMeshId}> own=<${this.meshId}>`);

            this.sendWebSocketMessage('answer', {
                meshId: this.meshId,
                clientMeshId: peerMeshId
            }, false);
            return;
        }

        this.changeWebRTCIPHandlingPolicy().then(() => this.sleep(3)).then(() => {
            const connection = this.openRTCPeerConnection(peerMeshId);

            connection.onconnectionstatechange = () => {
                this.onRTCConnectionStateChange(connection, peerMeshId);
            };
            connection.onicecandidate = event => {
                this.onRTCICECandidate(connection, peerMeshId, event, description => {
                    debug(() => `Answer to Peer: peer=<${peerMeshId}> description=<\n` +
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
                    log.error(`Failed createAnswer: peer=<${peerMeshId}> reason=<${error}>`);
                    this.closeRTCPeerConnection(peerMeshId);
                }
            );
        });
    }

    onRTCDataChannel (connection, peerMeshId, event) {
        debug(() => `WebRTC data channel by remote peer: peer=<${peerMeshId}>`);

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
        this.restartHeatbeat();

        if (!result) {
            this.closeRTCPeerConnection(data.clientMeshId);
            log.error(`Failed to answer: reason=<${data.error}>`);
            return;
        }

        log.info(`Answered to peer: peer=<${data.clientMeshId}>`);
    }

    heartbeatWebSocketAction (result, data) {
        this.restartHeatbeat();

        debug(() => `Heartbeat: result=<${result ? 'OK' : 'NG'}>`);

        if (!result) {
            log.error('Failed Heartbeat: reason=<Already expired>');

            this.webSocket.close();
        }
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
