const BlockType = require('../../extension-support/block-type');
const ArgumentType = require('../../extension-support/argument-type');
//const TargetType = require('../../extension-support/target-type');
//const log = require('../../util/log');
//const cast = require('../../util/cast');
const formatMessage = require('format-message');
const Base64Util = require('../../util/base64-util');
const FoxLink = 'ws://localhost:5500';

/**
 * Icon png to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */

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

// 3rd byte
const CMD_METHOD = {
    SERIAL_REFRESH_LIST: 0x00,
    SERIAL_READ_DATA: 0x03
};

let foxConnected = 'no';
let strDataReceved = '';
let strDataSend = '';
var startTime = Date.now();

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

        this.ws = new WebSocket(FoxLink);
        //this.ws.binaryType = 'arraybuffer';
        this.ws.binaryType = 'string';
        
        this.ws.onopen = this._openSocket;
        this.ws.onclose = this._closeSocket;
        this.ws.onerror = this._errorSocket;
        this.ws.onmessage = this._getWsData;

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
                    opcode: 'ConnectFoxBot',                    
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        default: 'Connect Foxbot',
                        description: 'Connect Foxbot via websocket'
                    })
                },
                {
                    opcode: 'getConnected',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        default: 'isConnected'
                    })
                },
                '---',
                {
                    opcode: 'ChangeFace',                    
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        default: 'Change Face',
                        description: 'Change Foxbot Face'
                    })
                },
                {
                    opcode: 'ChangeMotorAngle',                    
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        default: 'Change Motor Angle : Motor id [ID], angle [VAL]',
                        description: 'Change Motor Angle'
                    }),
                    arguments: {
                        ID: {
                            type: ArgumentType.STRING,
                            defaultValue: '1'
                        },
                        VAL: {
                            type: ArgumentType.STRING,
                            defaultValue: '0'
                        }
                    }
                },
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
                },
                {
                    opcode: 'getLastMessageReceived',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        default: 'getLastMSG'
                        // default: 'get last incoming message: [MESSAGE]',
                    })
                }           
            ]
        };
    }

    /**
     * implementation of the block with the opcode that matches this name
     *  this will be called when the block is used
     */
    
    ConnectFoxBot() {
        const myws = new WebSocket(FoxLink);
		this.ws=myws;
		this.ws.onopen = function() {
			// Web Socket is connected, send data using send()
			console.log("Web Socket is connected");
			myws.send("Message to send");
			console.log("Message is sent...");
		};
		this.ws.onmessage = function (evt) { 
			var received_msg = evt.data;
			console.log("received_msg: "+received_msg);
			this.msg=received_msg;
		};
		this.ws.onclose = function() { 
			// websocket is closed.			
		};    
    }

    ChangeFace () {
        strDataSend = 'cf';
        this._sendWsData ();
    }

    ChangeMotorAngle (args) {
        strDataSend = 'an '+args.ID+' '+args.VAL;
        this._sendWsData ();
    }

    setMessage (args) {
        strDataSend = '';
        strDataSend = args.MSG;
        this._sendWsData ();
    }

    getLastMessageReceived () {
        // refresh message
        return strDataReceved;
    }

    getConnected () {
        return foxConnected;
    }

    /* openSocket(), set ping timings and connection status */
    _openSocket () {
        //  console.log('WebSocket connection: ', this.ws.readyState);
        console.log('WebSocket connection Opened');
        foxConnected = 'yes';
    }

    /* closeSocket() */
    _closeSocket () {
        console.log('WebSocket connection Closed!');
        foxConnected = 'no';
    }

    /* errorSocket() */
    _errorSocket (err) {
        console.log(err);
        this.ws.close();
    }

    _sendWsData () {
       this.ws.send(strDataSend);
    }

    /* get called whenever there is new Data from the ws server. */
    _getWsData (msg) {
        strDataReceved = '';
        strDataReceved = msg.data;            
        return strDataReceved;
    }
}

module.exports = Scratch3FoxBotExtension;