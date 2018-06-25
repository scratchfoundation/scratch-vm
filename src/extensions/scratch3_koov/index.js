/* -*- indent-tabs-mode: nil; js-indent-level: 4 -*-
 */

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');

/**
 * Manage communication with a KOOV device over a Device Manager client socket.
 */
class KOOV {

    /**
     * @return {string} - the type of Device Manager device socket that this class will handle.
     */
    static get DEVICE_TYPE () {
        return 'koov';
    }

    /**
     * Construct a KOOV communication object.
     * @param {Socket} socket - the socket for a KOOV device, as provided by a Device Manager client.
     */
    constructor (socket) {
        /**
         * The socket-IO socket used to communicate with the Device Manager about this device.
         * @type {Socket}
         * @private
         */
        this._socket = socket;

        this._onDisconnect = this._onDisconnect.bind(this);

        this._connectEvents();
    }

    /**
     * Set actuator state.
     * @param {string} actuator - the name of actuator.
     * @param {object} args - parameters to describe the expected state.
     * @param {function} ack - continuation.
     */
    setActuator (actuator, args, ack) {
        args.ACTUATOR = actuator;
        this._send('set-actuator', args, ack);
    }

    /**
     * Get sensor value.
     * @param {string} sensor - the name of sensor.
     * @param {object} args - parameters to specifiy the sensor.
     * @param {function} ack - continuation.
     */
    getSensor (sensor, args, ack) {
        args.SENSOR = sensor;
        this._send('get-sensor', args, ack);
    }

    /**
     * Move multiple servo motors.
     * @param {object} servos - list of servo motor and its expected position.
     * @param {object} args - parameters to specifiy the motion.
     * @param {function} ack - continuation.
     */
    moveServomotors (servos, args, ack) {
        args.SERVOS = servos;
        this._send('move-servomotors', args, ack);
    }

    /**
     * Transfer scratch3 script to KOOV with converting it to native format.
     * @param {object} args - script to be transferred.
     * @param {function} ack - continuation.
     */
    transfer (args, ack) {
        this._send('transfer-script', args, ack);
    }

    /**
     * Manually dispose of this object.
     */
    dispose () {
        this._disconnectEvents();
    }

    /**
     * Attach event handlers to the device socket.
     * @private
     */
    _connectEvents () {
        this._socket.on('deviceWasClosed', this._onDisconnect);
        this._socket.on('disconnect', this._onDisconnect);
    }

    /**
     * Detach event handlers from the device socket.
     * @private
     */
    _disconnectEvents () {
        this._socket.off('deviceWasClosed', this._onDisconnect);
        this._socket.off('disconnect', this._onDisconnect);
    }

    /**
     * React to device disconnection. May be called more than once.
     * @private
     */
    _onDisconnect () {
        this._disconnectEvents();
    }

    /**
     * Send a message to the device socket.
     * @param {string} message - the name of the message, such as 'playTone'.
     * @param {object} [details] - optional additional details for the message, such as tone duration and pitch.
     * @param {function} [ack] - optional argument to receive response.
     * @private
     */
    _send (message, details, ack) {
        this._socket.emit(message, details, ack);
    }
}

/**
 * Scratch 3.0 blocks to interact with a KOOV device.
 */
class Scratch3KOOVBlocks {

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'koov';
    }

    /**
     * Construct a set of KOOV blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.connect();
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3KOOVBlocks.EXTENSION_ID,
            name: 'KOOV',
            blocks: [
                {
                    opcode: 'turnLED',
                    text: 'turn LED [PORT] [MODE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'digialOutputPort',
                            defaultValue: 'V2'
                        },
                        MODE: {
                            type: ArgumentType.STRING,
                            menu: 'modeOnOff',
                            defaultValue: 'ON'
                        }
                    }
                },
                {
                    opcode: 'buzzerOn',
                    text: 'buzzer [PORT] on [FREQUENCY]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'digialOutputPort',
                            defaultValue: 'V2'
                        },
                        FREQUENCY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 60
                        }
                    }
                },
                {
                    opcode: 'buzzerOff',
                    text: 'buzzer [PORT] off',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'digialOutputPort',
                            defaultValue: 'V2'
                        }
                    }
                },
                {
                    opcode: 'multiLED',
                    text: 'set multiLED to R: [R] G: [G] B: [B]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        R: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        G: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        },
                        B: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'dcMotorPower',
                    text: 'set DC-Motor [PORT] power to [POWER]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'dcMotorPort',
                            defaultValue: 'V0'
                        },
                        POWER: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'dcMotorOn',
                    text: 'turn DC-Motor [PORT] on [DIRECTION]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'dcMotorPort',
                            defaultValue: 'V0'
                        },
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: 'dcMotorDirection',
                            defaultValue: 'NORMAL'
                        }
                    }
                },
                {
                    opcode: 'dcMotorOff',
                    text: 'turn DC-Motor [PORT] off [MODE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'dcMotorPort',
                            defaultValue: 'V0'
                        },
                        MODE: {
                            type: ArgumentType.STRING,
                            menu: 'dcMotorStopMode',
                            defaultValue: 'BRAKE'
                        }
                    }
                },
                {
                    opcode: 'setServoMotorDegree',
                    text: 'set Servo-Motor [PORT] to [DEGREE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'digialOutputPort',
                            defaultValue: 'V2'
                        },
                        DEGREE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 90
                        }
                    }
                },
                {
                    opcode: 'servoMotorSynchronizedMotion',
                    text: 'move Servo-Motors with speed [SPEED]',
                    blockType: BlockType.CONDITIONAL,
                    branchCount: 1,
                    arguments: {
                        SPEED: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'getLightSensor',
                    text: 'light sensor [PORT]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'analogInputPort',
                            defaultValue: 'K2'
                        }
                    }
                },
                {
                    opcode: 'getSoundSensor',
                    text: 'sound sensor [PORT]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'analogInputPort',
                            defaultValue: 'K2'
                        }
                    }
                },
                {
                    opcode: 'getIrPhotoReflector',
                    text: 'IR photo reflector [PORT]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'analogInputPort',
                            defaultValue: 'K2'
                        }
                    }
                },
                {
                    opcode: 'getAccelerometer',
                    text: 'accelerometer [PORT] direction [DIRECTION]',
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'i2cPort',
                            defaultValue: 'K0'
                        },
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            menu: '3dAxis',
                            defaultValue: 'x'
                        }
                    }
                },
                {
                    opcode: 'getTouchSensor',
                    text: 'touch sensor [PORT] pressed',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'analogInputPort',
                            defaultValue: 'K2'
                        }
                    }
                },
                {
                    opcode: 'getCoreButton',
                    text: 'core button [PORT] pressed',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'coreButtonPort',
                            defaultValue: 'UP'
                        }
                    }
                // },
                // /*
                //  * This is not an programming block.
                //  */
                // {
                //     opcode: 'transfer',
                //     text: 'transfer to KOOV',
                //     blockType: BlockType.REPORTER
                }
            ],
            menus: {
                'digialOutputPort': [
                    'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9'
                ],
                'dcMotorPort': [
                    'V0', 'V1'
                ],
                'analogInputPort': [
                    'K2', 'K3', 'K4', 'K5', 'K6', 'K7'
                ],
                'i2cPort': [
                    'K0', 'K1'
                ],
                '3dAxis': [
                    'x', 'y', 'z' // must be lower case
                ],
                'coreButtonPort': [
                    {
                        value: 'A0',
                        text: 'UP'
                    },
                    {
                        value: 'A1',
                        text: 'RIGHT'
                    },
                    {
                        value: 'A2',
                        text: 'BOTTOM'
                    },
                    {
                        value: 'A3',
                        text: 'LEFT'
                    }
                ],
                'modeOnOff': [
                    'ON', 'OFF'
                ],
                'dcMotorDirection': [
                    'NORMAL',
                    'REVERSE'
                ],
                'dcMotorStopMode': [
                    'BRAKE', 'COAST'
                ]
            }
        };
    }

    /**
     * Use the Device Manager client to attempt to connect to a KOOV device.
     */
    connect () {
        if (this._device || this._finder) {
            return;
        }
        const deviceManager = this.runtime.ioDevices.deviceManager;
        const finder = this._finder =
            deviceManager.searchAndConnect(Scratch3KOOVBlocks.EXTENSION_ID, KOOV.DEVICE_TYPE);
        this._finder.promise.then(
            socket => {
                if (this._finder === finder) {
                    this._finder = null;
                    this._device = new KOOV(socket);
                } else {
                    log.warn('Ignoring success from stale KOOV connection attempt');
                }
            },
            reason => {
                if (this._finder === finder) {
                    this._finder = null;
                    log.warn(`KOOV connection failed: ${reason}`);
                } else {
                    log.warn('Ignoring failure from stale KOOV connection attempt');
                }
            });
    }

    _currentContext (util) {
        // the thread executing this block.
        const id = x => x.target.id;
        const thread = this.runtime.threads.find(x => id(x) === id(util));
        const blocks = util.target.blocks;
        const blkid = thread.peekStack();
        const block = blocks.getBlock(blkid);
        return {
            thread, blocks, block
        };
    }

    _setActuator (actuator, args) {
        return new Promise(resolve => {
            this._device.setActuator(actuator, args, () => {
                // TODO: error handling.
                resolve();
            });
        });
    }

    /**
     * Turn LED on or off.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the LED port.
     * @property {string} MODE - 'ON' if the LED should be turned on, 'OFF' otherwise.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    turnLED (args) {
        return this._setActuator('turn-led', args);
    }

    /**
     * Turn on buzzer.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the buzzer port.
     * @property {number} FREQUENCY - the frequency of tone.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    buzzerOn (args) {
        return this._setActuator('buzzer-on', args);
    }

    /**
     * Turn off buzzer.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the buzzer port.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    buzzerOff (args) {
        return this._setActuator('buzzer-off', args);
    }

    /**
     * Turn on multi-color LED with specified RGB luminance.
     * @param {object} args - the block's arguments.
     * @property {number} R - the luminance of red.
     * @property {number} G - the luminance of green.
     * @property {number} B - the luminance of blue.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    multiLED (args) {
        return this._setActuator('multi-led', args);
    }

    /**
     * Set the power of DC motor.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the DC motor port.
     * @property {number} POWER - the power of DC motor.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    dcMotorPower (args) {
        return this._setActuator('dcmotor-power', args);
    }

    /**
     * Turn DC motor on for the specified direction.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the DC motor port.
     * @property {string} DIRECTION - the direction of rotation.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    dcMotorOn (args) {
        return this._setActuator('dcmotor-on', args);
    }

    /**
     * Turn DC motor off.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the DC motor port.
     * @property {string} MODE - the mode of stop operation.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    dcMotorOff (args) {
        return this._setActuator('dcmotor-off', args);
    }

    /**
     * Set the expected servo motor position.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the servo motor port.
     * @property {number} DEGREE - the position of servo motor.
     * @param {object} util - an object containing runtime information.
     * @return {Promise} - a promise which will resolve at the end of
     * the operation or undefined if the block is placed under the
     * servoMotorSynchronizedMotion.
     */
    setServoMotorDegree (args, util) {
        const {
            thread
        } = this._currentContext(util);
        const frame = thread.peekParentStackFrame();
        if (frame && frame.servomotor_synchronized_motion) {
            frame.servos[args.PORT] = Number(args.DEGREE);
        } else {
            return this._setActuator('servomotor-degree', args);
        }
    }

    /**
     * Move enclosed servo motors at once.
     * @param {object} args - the block's arguments.
     * @property {number} SPEED - the speed of movement.
     * @param {object} util - an object containing runtime information.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    servoMotorSynchronizedMotion (args, util) {
        const {
            thread
        } = this._currentContext(util);

        const frame = thread.peekStackFrame();
        if (frame.servomotor_synchronized_motion) {
            /*
             * Second call.  Now we have all expected servo motor
             * positions.  Let's move them.
             */
            return new Promise(resolve => {
                this._device.moveServomotors(frame.servos, args, () => {
                    resolve();
                });
            });
        }

        /*
         * First call.  Prepare to gather expected servo motor
         * positions.
         */
        frame.servomotor_synchronized_motion = true;
        frame.servos = {};
        util.startBranch(1, true);
    }

    _getSensor (sensor, args, boolType) {
        return new Promise(resolve => {
            this._device.getSensor(sensor, args, x => {
                resolve(boolType ? x === 0 : x);
            });
        });
    }

    /**
     * Get the light sensor value.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the sensor port.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    getLightSensor (args) {
        return this._getSensor('light-sensor', args);
    }

    /**
     * Get the sound sensor value.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the sensor port.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    getSoundSensor (args) {
        return this._getSensor('sound-sensor', args);
    }

    /**
     * Get the IR photo reflector value.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the sensor port.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    getIrPhotoReflector (args) {
        return this._getSensor('ir-photo-reflector', args);
    }

    /**
     * Get the 3-axis accelerometer value.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the sensor port.
     * @property {string} DIRECTION - the direction of acceleration.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    getAccelerometer (args) {
        return this._getSensor('accelerometer', args);
    }

    /**
     * Get the touch sensor value.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the sensor port.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    getTouchSensor (args) {
        return this._getSensor('touch-sensor', args, true);
    }

    /**
     * Get the KOOV Core button value.
     * @param {object} args - the block's arguments.
     * @property {string} PORT - the button port.
     * @return {Promise} - a promise which will resolve at the end of the operation.
     */
    getCoreButton (args) {
        return this._getSensor('core-button', args, true);
    }

    // TODO: UI to invoke this.
    transfer (/* args */) {
        return new Promise(resolve => {
            let firstTarget = null;
            this.runtime.allScriptsDo((topBlockId, target) => {
                if (!firstTarget) {
                    firstTarget = {
                        topBlockId: topBlockId,
                        target: target
                    };
                }
            }, null);
            // const target = this.runtime.getTargetForStage();
            this._device.transfer(firstTarget, () => resolve());
        });
    }
}

module.exports = Scratch3KOOVBlocks;
