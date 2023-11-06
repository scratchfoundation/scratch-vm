const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
const TargetType = require('../../extension-support/target-type');

const log = require('../../util/log');
const cast = require('../../util/cast');
const formatMessage = require('format-message');

const Base64Util = require('../../util/base64-util');
const MXSLink = 'ws://localhost:8000';

// const SerialPort = require('serialport')
// const port = new SerialPort({
//     path: '/dev/ttyHK0',
//     baudRate: 9600,
// })

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */


let mxsSerialPort = ['None', '/dev/ttyHK0', '/dev/ttyACM0', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7'];
const mxsBaudRate = ['115200', '57600', '38400', '19200', '9600', '4800'];

// 0th byte
const HEAD_CMD = {
    HEAD_SERIAL: 0xFF,
    HEAD_MULTIROTOR: 0x55,
    HEAD_DATA: 0xAA
};

// 1th byte
const CMD_DIRECTION = {
    SEND: 0xCD,
    RECEIVE: 0xCB,

    DATA_UP: 0xAA,
    DATA_DOWN: 0xAF
};

// 2nd byte
const CMD_Type = {
    SERIAL_SEND_CMD: 0x01,
    SERIAL_SEND_DATA: 0x02,
    SERIAL_GET_MESSAGE: 0x03,

    CMD_MOTION: 0xA1,
    CMD_SENSE: 0xA2,
    CMD_INTERACTIVE: 0xA3,
    CMD_CTROL: 0xA4,
    CMD_MATH: 0xA5,
    CMD_EXECUTION: 0xFC
};

// return 8th byte
const CMD_Status = {
    CMD_EXECUTE_ERROR: 0x00,
    CMD_EXECUTEING: 0x01,
    CMD_EXECUTE_OVER: 0x02
};

// 3rd byte
const CMD_METHOD = {
    SERIAL_REFRESH_LIST: 0x00,
    SERIAL_OPEN_PORT: 0x01,
    SERIAL_CLOSE_PORT: 0x02,
    SERIAL_READ_DATA: 0x03,

    MOVE_TYPE_LRFB: 0x11,
    MOVE_TYPE_UPDOWN: 0x12,
    MOVE_TYPE_TAKEOFFHIGHT: 0x13,
    MOVE_TYPE_LAND: 0x14,
    MOVE_TYPE_YAW_ANGLE: 0x15,
    MOVE_TYPE_HOVERING: 0x1A
};

// 7th byte
const FLY_DIRECTION = {
    DIRECTION_UP: 0x01,
    DIRECTION_DOWN: 0x02,

    DIRECTION_FORWARD: 0x03,
    DIRECTION_RIGHT: 0x04,
    DIRECTION_BACKWARD: 0x05,
    DIRECTION_LEFT: 0x06,

    DIRECTION_RIGHT_FORWARD: 0x07,
    DIRECTION_RIGHT_BACKWARD: 0x08,
    DIRECTION_LEFT_BACKWARD: 0x09,
    DIRECTION_LEFT_FORWARD: 0x0A,

    DIRECTION_TAKEOFF: 0xA0,
    DIRECTION_LAND: 0xB0,

    DIRECTION_CLOCKWISE: 0xC0,
    DIRECTION_COUNTER_CLOCKWISE: 0xC1
};

/***************************************************/

const DATA_TYPE = {
    MSG_REV: 0x00,
    MSG_GESTURE: 0x01,
    MSG_GESTURE_DATA: 0x02,
    MSG_CTLDATA: 0x03,
    MSG_GESTURE_SENSOR_STATE: 0x04,
    MSG_POWER: 0x05,
    MSG_MOTOR_PWM: 0x06,
    MSG_ALT_SENSOR_DATA: 0x07,
    MSG_FLOW_DATA: 0x08,
    MSG_POSTION_DATA: 0x0b
};

let PWR_VOLTAGE; var PWR_CURRENT;
let MOTOR_PWM;
let strDataReceved = '';

function mapValues (val, aMin, aMax, bMin, bMax) {
    let output = (((bMax - bMin) * (val - aMin)) / (aMax - aMin)) + bMin;
    if (output > 255)
        {output = 255;}
    if (output < 0)
        {output = 0;}
    return Math.round(output);
}

var startTime = Date.now();

function millis () {
    return Date.now() - startTime;
}

function Str2Bytes (str) {

    let pos = 0;
    let len = str.length;

    if (len % 2 != 0) {
        return null;
    }

    len /= 2;
    let hexA = new Array();

    for (let i = 0; i < len; i++) {
        let s = str.substr(pos, 2);
        let v = parseInt(s, 16);
        hexA.push(v);
        pos += 2;
    }
    return hexA;
}

function Bytes2Str (arr) {

    let str = '';
    for (let i = 0; i < arr.length; i++) {
        let tmp = arr[i].toString(16);

        if (tmp.length == 1) {
            tmp = '0' + tmp;
        }
        str += tmp;
    }
    return str;
}

class Scratch3FoxBotExtension {
    /**
     * @return {string} - the ID of this extension.
     */
    static get EXTENSION_ID () {
        return 'foxbot';
    }

    constructor (runtime) {
        this.runtime = runtime;
        startTime = Date.now();
        // this.lastMillis = 0;
        // RGB1 = Cast.toRgbColorObject('#000000');
        // RGB2 = Cast.toRgbColorObject('#000000');

        this.ws = new WebSocket(MXSLink);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onmessage = this._getWsData;
        this.ws.onopen = this._openSocket;
        this.ws.onclose = this._closeSocket;
        this.ws.onerror = this._errorSocket;

        this._sendWsData = this._sendWsData.bind(this);
        this._getWsData = this._getWsData.bind(this);
        this._openSocket = this._openSocket.bind(this);
        this._closeSocket = this._closeSocket.bind(this);
        this._errorSocket = this._errorSocket.bind(this);
    }
    
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'foxbot',
            name: 'foxbot',
            color1: '#5b8c00',
            color2: '#3f6600',
            color3: '#000000',
            
            // icons to display
            blockIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',
            menuIconURI: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAAAAACyOJm3AAAAFklEQVQYV2P4DwMMEMgAI/+DEUIMBgAEWB7i7uidhAAAAABJRU5ErkJggg==',

            showStatusButton: true,

            // your Scratch blocks
            blocks: [
                {
                    opcode: 'openSeialPort',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        default: 'open port [PORT] Baudrate [Baudrate]'
                    }),
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'serialPorts',
                            defaultValue: 0
                        },
                        Baudrate: {
                            type: ArgumentType.NUMBER,
                            menu: 'baudRate',
                            defaultValue: 0
                        }
                    }
                },
                {
                    opcode: 'closePort',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        default: 'close port [PORT]'
                    }),
                    arguments: {
                        PORT: {
                            type: ArgumentType.STRING,
                            menu: 'serialPorts',
                            defaultValue: 0
                        }
                    }
                },
                '---',
                {
                    opcode: 'cmdsequencestart',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'FoxBot.cmdsequencestart',
                        default: 'sequence start'
                    })
                },
                {
                    opcode: 'cmdexecution',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'FoxBot.cmdexecution',
                        default: 'cmd execution'
                    })   
                },
                {
                    opcode: 'getMessageCMD',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        default: 'getMSG'
                        // default: 'get last incoming message: [MESSAGE]',
                    })    
                },
                {
                    opcode: 'getLastMessageReceived',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        default: 'getLastMSG'
                        // default: 'get last incoming message: [MESSAGE]',
                    })
                    // arguments: {
                    //     MESSAGE: {
                    //         type: ArgumentType.STRING,
                    //     }
                    // }
                },
                '---',                
                {
                    opcode: 'setMessage',                    
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        default: 'set Message [MSG]',
                        description: 'send string message'
                    }),
                    arguments: {
                        MSG: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hi!'
                        }
                    }
                }           
            ],
            menus: {
                serialPorts: this._formatMenu(mxsSerialPort),
                baudRate: this._formatMenu(mxsBaudRate),
            }
        };
    }

    /**
     * implementation of the block with the opcode that matches this name
     *  this will be called when the block is used
     */
    
    openSeialPort (args) {
        port.on('open', () => {
            console.log('Port is open!')
        })       

        console.log(args.PORT);
        const byteCommands = []; // a compound command

        byteCommands[0] = parseInt(args.PORT);
        byteCommands[1] = parseInt(args.Baudrate);

        const cmd = this.generateCommand(
            HEAD_CMD.HEAD_SERIAL,
            CMD_DIRECTION.SEND,
            CMD_Type.SERIAL_SEND_CMD,
            CMD_METHOD.SERIAL_OPEN_PORT,

            byteCommands,
        );
        this.ws.send(JSON.stringify(cmd));

        return args.PORT;
    }

    closePort (args) {
        // console.log(args.PORT);
        const byteCommands = []; // a compound command

        // byteCommands[0] = SendCMDList.CLOSE_PORT;
        byteCommands[0] = parseInt(args.PORT);

        const cmd = this.generateCommand(
            HEAD_CMD.HEAD_SERIAL,
            CMD_DIRECTION.SEND,
            CMD_Type.SERIAL_SEND_CMD,
            CMD_METHOD.SERIAL_CLOSE_PORT,

            byteCommands,
        );
        this.ws.send(JSON.stringify(cmd));
        console.log('close wsconnection!');
        // this.ws.close();
    }

    setMessage (args) {
        //port.write(args.MSG);
    }


    cmdsequencestart () {
        CmdSequence = 0;
    }

    cmdexecution () {
        let byteCommands = []; // a compound command

        byteCommands[0] = 0x44;
        byteCommands[1] = 0x52;
        byteCommands[2] = 0x55;
        byteCommands[3] = 0x4E; // var HIGHT = parseFloat(args.HEIGHT);
        // Header (Bytes 0 - 6)

        let command = []; // command[0] = HEAD_CMD.HEAD_SEND_HIGH;

        command[0] = HEAD_CMD.HEAD_MULTIROTOR;
        command[1] = CMD_DIRECTION.SEND; // Calculate command length minus first two header bytes

        command[2] = CMD_Type.CMD_EXECUTION;
        command[3] = 0x46; // cmd number

        command[4] = CmdSequence >> 8 & 0xFF; // 상위 8비트
        command[5] = CmdSequence & 0xFF; // 하위 8비트

        let len = byteCommands.length;
        command[6] = len; // 처음 7바이트를 제외한 메시지 길이
        // Bytecodes (Bytes 7 - n)
        // Bytes 8 --- 나중에 전송된 명령 바이트.

        command = command.concat(byteCommands);
        let tmpsum = 0;

        for (i = 0; i < command.length; i++) {
            tmpsum += command[i];
        }

        command[6 + byteCommands.length + 1] = tmpsum & 0xFF; // 하위 8비트 가져옴

        console.log(command);
        this.ws.send(JSON.stringify(command));
    }

    getMessageCMD () {
        const byteCommands = []; // a compound command

        const cmd = this.generateCommand(
            HEAD_CMD.HEAD_SERIAL,
            CMD_DIRECTION.SEND,
            CMD_Type.SERIAL_GET_MESSAGE,
            CMD_METHOD.SERIAL_READ_DATA,
            byteCommands,
        );
        this.ws.send(JSON.stringify(cmd));
    }

    getLastMessageReceived () {
        // refresh message
        return strDataReceved;
    }

    hovering (args) {
        let byteCommands = []; // a compound command
        let SECONDS = parseFloat(args.SECONDS);

        if (SECONDS <= 0) {
            SECONDS = 0;
        } else if (SECONDS >= 300000) {
            SECONDS = 300000; //
        } else {
            SECONDS = parseFloat(args.SECONDS);
        }

        byteCommands[0] = SECONDS >> 3 * 8 & 0xFF;
        byteCommands[1] = SECONDS >> 2 * 8 & 0xFF;
        byteCommands[2] = SECONDS >> 1 * 8 & 0xFF;
        byteCommands[3] = SECONDS >> 0 * 8 & 0xFF;

        let cmd = this.generateCommand(
            HEAD_CMD.HEAD_MULTIROTOR,
            CMD_DIRECTION.SEND,
            CMD_Type.CMD_MOTION,
            CMD_METHOD.MOVE_TYPE_HOVERING,

            byteCommands
        );

        // eslint-disable-next-line no-console
        console.log(cmd);
        this.ws.send(JSON.stringify(cmd));
    }

    parseCmd (msg) {
        msg = msg.toString();
        if (isNumber(msg)) {
            return parseInt(msg, 10);
        } 
            return msg;
        
    }

    /* openSocket(), set ping timings and connection status */
    _openSocket () {
        //  console.log('WebSocket connection: ', this.ws.readyState);
        console.log('WebSocket connection Opened');
    }
    /* closeSocket() */
    _closeSocket () {
        console.log('WebSocket  connection Closed!');
    }
    /* errorSocket() */
    _errorSocket (err) {
        console.log(err);
        this.ws.close();
    }
    
        /**
     * Formats menus into a format suitable for block menus, and loading previously
     * saved projects:
     * [
     *   {
     *    text: label,
     *    value: index
     *   },
     *   {
     *    text: label,
     *    value: index
     *   },
     *   etc...
     * ]
     *
     * @param {array} menu - a menu to format.
     * @return {object} - a formatted menu as an object.
     * @private
     */
        _formatMenu (menu) {
            const m = [];
            for (let i = 0; i < menu.length; i++) {
                const obj = {};
                obj.text = menu[i];
                obj.value = i.toString();
                m.push(obj);
            }
            return m;
        }
    
        /**
         *
         * @param {*} head
         * @param {*} directionlow
         * @param {*} type
         * @param {*} methods
         * @param {array} byteCommands
         */
        generateCommand (head, directionlow, type, methods, byteCommands) {
            // Header (Bytes 0 - 6)
            let command = []; // command[0] = HEAD_CMD.HEAD_SEND_HIGH;
    
            command[0] = head;
            command[1] = directionlow; // Calculate command length minus first two header bytes
    
            command[2] = type;
            command[3] = methods; // 명령 번호
    
            command[4] = CmdSequence >> 8 & 0xFF; // 상위 8비트
            command[5] = CmdSequence & 0xFF; // 하위 8비트
    
            CmdSequence++; // 명령어가 오버플로우되면 명령어 시퀀스 번호를 0으로 재설정
    
            if (CmdSequence > 65535) {
                CmdSequence = 0;
            }
    
            let len = byteCommands.length;
            command[6] = len; // 처음 7바이트를 제외한 메시지 길이
            // Bytecodes (Bytes 7 - n)
            // Bytes 8 --- 나중에 전송된 명령 바이트.
    
            command = command.concat(byteCommands);
            let tmpsum = 0;
    
            for (i = 0; i < command.length; i++) {
                tmpsum += command[i];
            }
    
            command[6 + byteCommands.length + 1] = tmpsum & 0xFF; // 하위 8비트 가져옴
    
            return command;
        }
    
    
        // _sendWsData(cmd, elem, par1, par2 = 0, par3 = 0, par4 = 0) {
        _sendWsData (head, directionlow, type, methods, byteCommands) {
            //     mils = millis();
            //     var msg = [SerialOpcode.SerialHead, cmd, elem, par1, par2, par3, par4, END_SYS];
            //     var computed_crc = crc.compute(msg);
            //     msg.push(computed_crc >> 8);
            //     msg.push(computed_crc & 0xFF);
            //     //console.log( mils, this.lastMillis )
            //     if (mils - this.lastMillis > 5) {
            //         this.lastMillis = mils;
            //         this.ws.send(msg);
            //         console.log(msg);
            //     }
            // const byteCommands = []; // a compound command
    
            // byteCommands[0] = 1;
            // byteCommands[1] = 2;
            // byteCommands[2] = 3;
    
            const cmd = this.generateCommand(
                head, // byte 0
                directionlow, // byte  1
                type, // byte 2
                methods, // byte 3
    
                byteCommands, // byte 7
            );
            this.ws.send(JSON.stringify(cmd));
        }
        // str2hex

        /* get called whenever there is new Data from the ws server. */
        _getWsData (msg) {
            strDataReceved = '';
            dataArray = '';
            dataArray = JSON.parse(msg.data);
            strDataArray = new Uint8Array(1024);
            // dataArray = (msg.data);
    
            strDataReceved = dataArray.toString();
            console.log(`strDataReceved:${  strDataReceved}`);
    
            strDataArray = Str2Bytes(strDataReceved);
            console.log(`strDataArray:${  strDataArray}`);
    
            if (strDataArray[0] === HEAD_CMD.HEAD_DATA) {
                if (strDataArray[1] === CMD_DIRECTION.DATA_UP) {
                    switch (strDataArray[2]) {
                    case DATA_TYPE.MSG_REV:
                    {
                        break;
                    }
                    case DATA_TYPE.MSG_GESTURE_DATA:
                    {
                        if (parseInt(strDataArray[3]) == 18) {
                            // ACC_X = parseInt((strDataArray[4].toString(16) + strDataArray[5].toString(16)), 16);
                            // ACC_Y = parseInt((strDataArray[6].toString(16) + strDataArray[7].toString(16)), 16);
                            // ACC_Z = parseInt((strDataArray[8].toString(16) + strDataArray[9].toString(16)), 16);
    
                            // GYRO_X = parseInt((strDataArray[10].toString(16) + strDataArray[11].toString(16)), 16);
                            // GYRO_Y = parseInt((strDataArray[12].toString(16) + strDataArray[13].toString(16)), 16);
                            // GYRO_Z = parseInt((strDataArray[14].toString(16) + strDataArray[15].toString(16)), 16);
    
                            // MAG_X = parseInt((strDataArray[16].toString(16) + strDataArray[17].toString(16)), 16);
                            // MAG_Y = parseInt((strDataArray[18].toString(16) + strDataArray[19].toString(16)), 16);
                            // MAG_Z = parseInt((strDataArray[20].toString(16) + strDataArray[21].toString(16)), 16);
                        }
                        break;
                    }
                    case DATA_TYPE.MSG_POSTION_DATA:
                    {
                        if (parseInt(strDataArray[3]) == 6) {
                            // POS_X = parseInt((strDataArray[4].toString(16) + strDataArray[5].toString(16)), 16);
                            // POS_Y = parseInt((strDataArray[6].toString(16) + strDataArray[7].toString(16)), 16);
                            // POS_Z = parseInt((strDataArray[8].toString(16) + strDataArray[9].toString(16)), 16);
                        }
                        break;
                    }
                    default:
                    {
                        break;
                    }
                    }
                }
            }
    
            return strDataReceved;
            // return parseInt(ROLL,16)/100;
        }

}

module.exports = Scratch3FoxBotExtension;
