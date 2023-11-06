const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const TargetType = require('../../extension-support/target-type');

const log = require('../../util/log');
const cast = require('../../util/cast');
const formatMessage = require('format-message');

const BLE = require('../../io/ble');
const Base64Util = require('../../util/base64-util');

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
// const blockIconURI = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABG2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS41LjAiPgogPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIi8+CiA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgo8P3hwYWNrZXQgZW5kPSJyIj8+Gkqr6gAAAYJpQ0NQc1JHQiBJRUM2MTk2Ni0yLjEAACiRdZG/S0JRFMc/alGUYVBDQ4NENZmUgtQSpIQFEWIG/Vr05Y9A7fGeEtIatAoFUUu/hvoLag2ag6AogmhpaS5qKXmdp4ISeS7nns/93nsO954L1khayehNw5DJ5rRw0O9cWFxytrxipRsHXtxRRVcnQqEZGtrXAxYz3g2ZtRqf+9faV+O6ApZW4XFF1XLCU8IzGznV5F3hbiUVXRU+F3ZpckHhe1OPVfjN5GSFf0zWIuEAWDuFnck6jtWxktIywvJy+jPpvFK9j/kSezw7PyexT7wXnTBB/DiZZpIAPkYYk9nHEB7csqJB/nA5f5Z1yVVkVimgsUaSFDlcoualelxiQvS4jDQFs/9/+6onvJ5Kdbsfml8M42MAWnagVDSM72PDKJ2A7RmusrX89SMY/RS9WNP6D8GxBRfXNS22B5fb0POkRrVoWbKJWxMJeD+DjkXouoW25UrPqvucPkJkU77qBvYPYFDOO1Z+AZfFZ/yiFCQNAAAACXBIWXMAAAsTAAALEwEAmpwYAAACwklEQVR4nO3az0sUYRzH8feMi2u6aiUmFpVtFARmRIeO7aFD0iFQaruLeOjSocgO0T8QFEKH2DoEQRiFRUQEEnoIIzqVQgmhZWIm2w8bc1fXmS7+2HVn12d11kfa7wsWdmae55nPfJnnYRgGhBBCCCGEEIXIUG0YCVECHASq8hfHE1HgfWsPMZXGSgWIhGgDrgGBNQRbTxZwobWHWys1XLEAkRBNwCMvUmnQ1NpDV7YGpsIg7ckbDub8T3n25J2DkSlXe6Y+C3wK4zcs/Bkr2U1/xVEAamPD1E++yTVrXnwK1DNUegCAfdY76v5+WDh0aKW+We+ASAgT8K81oEb++WvISGUK/NcKvgAqa0BOHAws2/NhAQiYCQwcT8fMKanp2BQ5CQCKHNu1jWX7uBPdv/ZkLlqqBik3Z7PmMnHPlUlOBaiJj1AzMZLTCdZDcGqA4NTAqvrKGrB8RzgcPgbsAOh2HI5/f7DuobzUve3M2XB48eFotLOzszf5uNsUuAQ0AmAY3q44OhjGPZYe+Z8DKQUo+CkgBdAdQDcpgO4AukkBdAfQTQqgO4BuUgDdAXSTAugOoJsUQHcA3aQAugPopvxStGLvYYKnL1NcWQ2APRNn9OVdxnrvp7QLmAlaqga9TZk09nLVRxrZdfIcRZvKAEhM/Wb48XV+9PemtXWjXICdJ9oor2tI2RdsvsS3Vw9xEkuvqg0c11fX+bKn+SL+rdsXt/1baqk7dV65AMpTwFe2Ob1zcQmmr1h1iLzwlVam73PJmknBrwHKBZiLWWn77Nl4yu2vg1uuxPQf5f7KBfj64jbT40PMxSzmYhYzk1E+P+3ATswonywfhp/cIP5zbDFXLDrKl2c3lfsrL4K/Pr7m7dXGVYXMp/G+Lsb7sn4Fk1XBrwFud8AVoGP+v0MOn9JtUMnXMKEziBBCCCGEEGLj+AdrerOu0sUfeQAAAABJRU5ErkJggg==";

const BLETimeout = 2500;
const BLEDataStoppedError = 'foxbot extension stopped receiving data';

const BLEUUID = {
    motor_service:                 0xe005,
    char_motor_set_step:          '34443c33-3356-11e9-b210-d663bd873d93',
    char_motor_set_speed:         '34443c34-3356-11e9-b210-d663bd873d93',
    char_motor_set_distance:      '34443c35-3356-11e9-b210-d663bd873d93',
    char_motor_set_rotation:      '34443c40-3356-11e9-b210-d663bd873d93',
    char_motor_set_accel:         '34443c36-3356-11e9-b210-d663bd873d93',
    misc_service:                  0xe006,
    char_misc_color_led:          '34443c37-3356-11e9-b210-d663bd873d93',
    char_misc_play_sound:         '34443c38-3356-11e9-b210-d663bd873d93',
    char_misc_set_text_oled:      '34443c39-3356-11e9-b210-d663bd873d93',
    char_misc_set_image_oled:     '34443c3a-3356-11e9-b210-d663bd873d93',
    char_misc_status_info:        '34443c3b-3356-11e9-b210-d663bd873d93',
    char_misc_set_msg:                '34443c3b-3356-11e9-b210-d663bd873d93',
    sensor_service:                0xe007,
    char_sensor_floor_sensors:    '34443c3c-3356-11e9-b210-d663bd873d93',
    char_sensor_distance_sensors: '34443c3d-3356-11e9-b210-d663bd873d93',
    char_sensor_imu_sensors:      '34443c3e-3356-11e9-b210-d663bd873d93',
    char_sensor_all_data:         '34443c3f-3356-11e9-b210-d663bd873d93',
};

class FoxBot {

    /**
     * Construct a communication object.
     * @param {Runtime} runtime - the Scratch 3.0 runtime
     * @param {string} extensionId - the id of the extension
     */

    constructor (runtime, extensionId) {
        // put any setup for your extension here

        this._runtime = runtime;

        this._ble = null;
        this._runtime.registerPeripheralExtension(extensionId, this);
        this._extensionId = extensionId;

        this._timeoutID = null;
        this._busy = false;
        this._busyTimeoutID = null;

        this._user_button = 1;

        this._battery = {
            volt_level: 0.0,
            low_warning: 0
        };

        this._robot_is_moving = 0;

        this.disconnect = this.disconnect.bind(this);
        this._onConnect = this._onConnect.bind(this);
        this._onMessage = this._onMessage.bind(this);
    }

    get batteryLevel () {
        return this._battery.volt_level;
    }

    get checkLowWarning () {
        if(this._battery.low_warning == 0)
            return false;
        else
            return true;
    }

    get isRobotMoving () {
        if(this._robot_is_moving == 0)
            return false;
        else
            return true;
    }

    setText (str) {
        var utf8 = [];
        for (var i=0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6),
                          0x80 | (charcode & 0x3f));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12),
                          0x80 | ((charcode>>6) & 0x3f),
                          0x80 | (charcode & 0x3f));
            }
            // surrogate pair
            else {
                i++;
                charcode = ((charcode&0x3ff)<<10)|(str.charCodeAt(i)&0x3ff)
                utf8.push(0xf0 | (charcode >>18),
                          0x80 | ((charcode>>12) & 0x3f),
                          0x80 | ((charcode>>6) & 0x3f),
                          0x80 | (charcode & 0x3f));
            }
        }

        return this.send(BLEUUID.misc_service, BLEUUID.char_misc_set_text_oled, utf8);
    }

    setMessage (str) {
        var utf8 = [];
        for (var i=0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6),
                          0x80 | (charcode & 0x3f));
            }
            else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12),
                          0x80 | ((charcode>>6) & 0x3f),
                          0x80 | (charcode & 0x3f));
            }
            // surrogate pair
            else {
                i++;
                charcode = ((charcode&0x3ff)<<10)|(str.charCodeAt(i)&0x3ff)
                utf8.push(0xf0 | (charcode >>18),
                          0x80 | ((charcode>>12) & 0x3f),
                          0x80 | ((charcode>>6) & 0x3f),
                          0x80 | (charcode & 0x3f));
            }
        }

        return this.send(BLEUUID.misc_service, BLEUUID.char_misc_set_msg, utf8);
    }

    setImage (index) {
        var data = [index];
        return this.send(BLEUUID.misc_service, BLEUUID.char_misc_set_image_oled, data);
    }

    setAccel (accel) {
        var send_data = [accel];
        return this.send(BLEUUID.motor_service, BLEUUID.char_motor_set_accel, send_data);
    }

    setRotation (rotate_angle) {
        var send_data = [];

        send_data.push((rotate_angle >> 8) & 0xFF);
        send_data.push((rotate_angle) & 0xFF);
        send_data.push((this._max_velocity >> 8) & 0xFF);
        send_data.push((this._max_velocity) & 0xFF);

        console.log(send_data);

        return this.send(BLEUUID.motor_service, BLEUUID.char_motor_set_rotation, send_data);
    }

    send (service, characteristic, value) {
        if (!this.isConnected()) return;
        if (this._busy) return;

        this._busy = true;
        this._busyTimeoutID = window.setTimeout(() => {
            this._busy = false;
        }, 5000);

        const data = Base64Util.uint8ArrayToBase64(value);
        this._ble.write(service, characteristic, data, 'base64', false).then(
            () => {
                this._busy = false;
                window.clearTimeout(this._busyTimeoutID);
            }
        );
    }

    scan () {
        if (this._ble) {
            this._ble.disconnect();
        }
        this._ble = new BLE(this._runtime, this._extensionId, {
            filters: [
                {services: [BLEUUID.motor_service, BLEUUID.misc_service, BLEUUID.sensor_service]}
            ]
        }, this._onConnect, this.disconnect);
    }

    connect (id) {
        if (this._ble) {
            this._ble.connectPeripheral(id);
        }
    }

    disconnect () {
        window.clearInterval(this._timeoutID);
        if (this._ble) {
            this._ble.disconnect();
        }
    }

    isConnected () {
        let connected = false;
        if (this._ble) {
            connected = this._ble.isConnected();
        }
        return connected;
    }

    _onConnect () {
        this._ble.read(BLEUUID.sensor_service, BLEUUID.char_sensor_all_data, true, this._onMessage);
        this._timeoutID = window.setInterval(
            () => this._ble.handleDisconnectError(BLEDataStoppedError),
            BLETimeout
        );
    }

    _onMessage(base64) {
        const data = Base64Util.base64ToUint8Array(base64);

        this._robot_is_moving = data[0];
        this._battery.volt_level = data[1] / 10.0;
        this._battery.low_warning = data[2];
        this._user_button = data[3];        

        // cancel disconnect timeout and start a new one
        window.clearInterval(this._timeoutID);
        this._timeoutID = window.setInterval(
            () => this._ble.handleDisconnectError(BLEDataStoppedError),
            BLETimeout
        );
    }
}

const FoxbotImuSensorImuAxis = {
    ROLL: 'roll',
    PITCH: 'pitch',
    YAW: 'yaw'
}

class Scratch3FoxBotExtension {

     /**
     * @return {string} - the name of this extension.
     */
     static get EXTENSION_NAME () {
        return 'FoxBot';
    }

    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'foxbot';
    }

    /**
     * Construct a set of FoxBot blocks.
     * @param {Runtime} runtime - the Scratch 3.0 runtime.
     */
    constructor (runtime) {
        /**
         * The Scratch 3.0 runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new FoxBot peripheral instance
        this._peripheral = new FoxBot(this.runtime, Scratch3FoxBotExtension.EXTENSION_ID);
    }
    
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: Scratch3FoxBotExtension.EXTENSION_ID,
            name: Scratch3FoxBotExtension.EXTENSION_NAME,

            // colours to use for your extension blocks
            color1: '#000099',
            color2: '#660066',

            // icons to display
            blockIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',
            menuIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

            showStatusButton: true,

            // your Scratch blocks
            blocks: [
                {
                    opcode: 'getImuSensors',
                    text: formatMessage({
                        id: 'foxbot.getImuSensors',
                        default: 'imu sensor [IMU_AXIES]',
                        description: 'the imu returned by the imu sensor'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        IMU_AXIES: {
                            type: ArgumentType.STRING,
                            menu: 'IMU_AXIES',
                            defaultValue: FoxbotImuSensorImuAxis.ROLL
                        }
                    }
                },
                '---',
                {
                    opcode: 'getBatteryLevel',
                    text: formatMessage({
                        id: 'foxbot.getBatteryLevel',
                        default: 'battery level',
                        description: 'the battery level on the foxbot'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                    }
                },
                {
                    opcode: 'isBatteryLow',
                    text: formatMessage({
                        id: 'foxbot.isBatteryLow',
                        default: 'needed charging?',
                        description: 'is the battery on the foxbot needed charging?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                    }
                },
                '---',
                {
                    opcode: 'setText',
                    text: formatMessage({
                        id: 'foxbot.setText',
                        default: 'set text [TEXT]',
                        description: 'display text on the foxbot display'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'foxbot.defaultTextToDisplay',
                                default: 'Hello!',
                                description: `default text to display.`
                            })
                        }
                    }
                },
                {
                    opcode: 'setMessage',
                    text: formatMessage({
                        id: 'foxbot.setMessage',
                        default: 'set Message [MSG]',
                        description: 'send string message'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        MSG: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'foxbot.defaultStringMessage',
                                default: 'Hello!',
                                description: `default msg to foxbot.`
                            })
                        }
                    }
                },
                {
                    opcode: 'setImage',
                    text: formatMessage({
                        id: 'foxbot.setImage',
                        default: 'set display [INDEX]',
                        description: 'display text on the foxbot display'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        INDEX: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },                
                {
                    opcode: 'clearDisplay',
                    text: formatMessage({
                        id: 'foxbot.clearDisplay',
                        default: 'clear display',
                        description: 'clear display on the foxbot display'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                    }
                },
                '---',
                {
                    opcode: 'isRobotMoving',
                    text: formatMessage({
                        id: 'foxbot.isRobotMoving',
                        default: 'is robot moving?',
                        description: 'is the robot charging?'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                    }
                },
                {
                    opcode: 'setRotation',
                    text: formatMessage({
                        id: 'foxbot.setRotation',
                        default: 'rotate by angle [ROTATE_ANGLE]',
                        description: 'rotate by angle'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        ROTATE_ANGLE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'moveForward',
                    text: formatMessage({
                        id: 'foxbot.moveForward',
                        default: 'move forward',
                        description: 'move forward'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                    }
                },                
            ],
            menus: {
                IMU_AXIES: [
                    {
                        text: formatMessage({
                            id: 'foxbot.imuSensorImuAxis.roll',
                            default: 'roll',
                            description: 'label for imu sensor imu axis element in imu menu for Foxbot extension'
                        }),
                        value: FoxbotImuSensorImuAxis.ROLL
                    },
                    {
                        text: formatMessage({
                            id: 'foxbot.imuSensorImuAxis.pitch',
                            default: 'pitch',
                            description: 'label for imu sensor imu axis element in imu menu for Foxbot extension'
                        }),
                        value: FoxbotImuSensorImuAxis.PITCH
                    },
                    {
                        text: formatMessage({
                            id: 'foxbot.imuSensorImuAxis.yaw',
                            default: 'yaw',
                            description: 'label for imu sensor imu axis element in imu menu for Foxbot extension'
                        }),
                        value: FoxbotImuSensorImuAxis.YAW
                    },
                ],
            }
        };
    }



    /**
     * implementation of the block with the opcode that matches this name
     *  this will be called when the block is used
     */
    
    getImuSensors (args) {
       return this._getImuSensors(args.IMU_AXIES);
    }

    _getImuSensors (axis) {
       switch (axis) {
     case FoxbotImuSensorImuAxis.ROLL:
         return this._peripheral.imuRoll;
     case FoxbotImuSensorImuAxis.PITCH:
         return this._peripheral.imuPitch;
     case FoxbotImuSensorImuAxis.YAW:
         return this._peripheral.imuYaw;
        }
    }


    getBatteryLevel (args) {
        return this._peripheral.batteryLevel;
    }

    isBatteryLow (args) {
        return this._peripheral.checkLowWarning;
    }

    isRobotMoving (args) {
        return this._peripheral.isRobotMoving;
    }

    setText (args) {
        const text = String(args.TEXT).substring(0, 19);
        if (text.length > 0) {
            this._peripheral.setText(text);
        }

        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 50);
        });
    }

    setMessage (args) {
        const message = String(args.MSG).substring(0, 19);
        if (message.length > 0) {
            this._peripheral.setMessage(message);
        }

        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 50);
        });
    }

    setImage (args) {
        const index = parseInt(args.INDEX);

        if (index >= 0 && index <= 3) {
            this._peripheral.setImage(index);
        }

        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 50);
        });
    }

    clearDisplay (args) {
        this._peripheral.setText(" ");

        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 50);
        });
    }

    setRotation (args) {
        const rotate_angle = parseInt(args.ROTATE_ANGLE);
        this._peripheral.setRotation(rotate_angle);

        return new Promise(resolve => {
            var first_check = true;
            var ttt = setInterval(() => {
                if(this._peripheral.isRobotMoving == false && first_check == true) {
                    first_check = false;
                }
                else if(this._peripheral.isRobotMoving == false && first_check == false) {
                    resolve();
                    clearInterval(ttt);
                }
            }, 100);
        });
    }

    moveForward (args) {
        //this._peripheral.setVelocity(this._peripheral._max_velocity, this._peripheral._max_velocity);
    }
}

module.exports = Scratch3FoxBotExtension;
