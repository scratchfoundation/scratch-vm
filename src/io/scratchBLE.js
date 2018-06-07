const JSONRPCWebSocket = require('../util/jsonrpc-web-socket');
const PeripheralChooser = require('./peripheralChooser');
const log = require('../util/log');

class ScratchBLE extends JSONRPCWebSocket {
    constructor (readyCallback) {

        const ws = new WebSocket('ws://localhost:20110/scratch/ble');

        super(ws);

        ws.onopen = () => this.sendRemoteRequest('pingMe').then(
            x => {
                log.info(`Ping request resolved with: ${x}`);
                // TODO: resolve why pinging is needed for readyCallback
                readyCallback();
            },
            e => {
                log.error(`Ping request rejected with: ${e}`);
            }
        );

        this.peripheralChooser = new PeripheralChooser();

    }

    connectDevice (deviceOptions /* , guiOptions*/) {
        /* CWF
        send('discover', ...)
            .then(() => chooser.choosePeripheral)
            .then(peripheralId => this.connect(peripheralId));
        */

        return this.sendRemoteRequest('discover', deviceOptions).then(
            x => {
                log.info(`sendRemoteRequest discover resolved to: ${x}`);
                // *****LAUNCH DEVICE CHOOSER IN GUI
                // const chooser = new this.vm_or_runtime_or_something.ChooserConstructor();
                // chooser.setGuiOptions(guiOptions);
                // *****RELAY BACK CHOSEN peripheralId FROM GUI
                // *****CONNECT TO CHOSEN peripheralId
                // TODO resolve why timeout is needed
                setTimeout(() => {
                    this.sendRemoteRequest(
                        'connect',
                        {peripheralId: this.peripheralChooser.chosenPeripheralId}
                    ).then(
                        x1 => {
                            log.info(`sendRemoteRequest connect resolved to: ${x1}`);
                        },
                        e1 => {
                            log.error(`sendRemoteRequest connect rejected with: ${e1}`);
                        }
                    );
                }, 5000);
            },
            e => {
                log.error(`sendRemoteRequest discover rejected with: ${e}`);
            }
        );
    }

    didReceiveCall (method, params) {
        switch (method) {
        case 'didDiscoverPeripheral':
            log.info(`Peripheral discovered: ${params.peripheralId}`);
            // *****START RECORDING didDiscoverPeripheral MESSAGES FROM WEBSOCKET
            // *****SEND THOSE TO DEVICE CHOOSER GUI
            this.peripheralChooser.updatePeripheral(params.peripheralId);
            break;
        case 'characteristicDidChange':
            log.info(`Characteristic changed: ${params}`);
            return 'test';
        case 'ping':
            return 42;
        }
    }

    read (serviceId, characteristicId, optStartNotifications = false) {
        const params = {
            serviceId,
            characteristicId
        };
        if (optStartNotifications) {
            params.startNotifications = true;
        }
        return this.sendRemoteRequest('read', params);
    }

    write (serviceId, characteristicId, message, encoding = null) {
        const params = {serviceId, characteristicId, message};
        if (encoding) {
            params.encoding = encoding;
        }
        return this.sendRemoteRequest('write', params);
    }
}

module.exports = ScratchBLE;
