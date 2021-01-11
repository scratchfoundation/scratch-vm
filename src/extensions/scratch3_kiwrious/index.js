require('core-js/stable');
require('regenerator-runtime/runtime');

const BlockType = require('../../extension-support/block-type');

const filters = [
    {usbVendorId: 0x04d8, usbProductId: 0xec19},
];

let isRunning = false;
let isConnected = false;

let port;

class Scratch3Kiwrious {
    constructor (runtime) {
        this.runtime = runtime;

        this.runtime.on('PROJECT_STOP_ALL', () => {isRunning = false;});
        this._disconnectListener();
    }

    getInfo () {
        return {
            id: 'kiwrious',
            name: 'Kiwrious',
            blocks: [
                {
                    opcode: 'Connect',
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'Read',
                    blockType: BlockType.COMMAND
                }
            ],
            menus: {
            }
        };
    }

    async Connect () {

        if (!('serial' in navigator)) {
            alert("This feature only works on Chrome with 'Experimental Web Platform features' enabled");
            return;
        }

        if (!isConnected) {
            port = await navigator.serial.requestPort({filters});
            await port.open({baudRate: 230400});

            isConnected = true;
        }
    }

    async Read () {

        if (!(port && port.readable)) {
            alert('Sensor setup failed');
            return;
        }

        isRunning = true;
        const reader = port.readable.getReader();

        while (isRunning) {
            const {value, done} = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }
            if (value.length === 26) {
                console.log(value);
            }
        }

        await reader.cancel();
    }

    _disconnectListener () {
        if ('serial' in navigator) {
            navigator.serial.addEventListener('disconnect', (event) => {
                isConnected = false;
                isRunning = false;
            });
        }
    }
}

module.exports = Scratch3Kiwrious;
