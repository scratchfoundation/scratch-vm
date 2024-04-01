const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Cast = require('../../util/cast');
const formatMessage = require('format-message');
const Video = require('../../io/video');


/**
 * Url of icon to be displayed at the left edge of each extension block.
 * Url of icon to be displayed in the toolbox menu for the extension category.
 * @type {string}
 */
// eslint-disable-next-line max-len
const iconURI = 'data:image/png;base64,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';


// Core, Team, and Official extension classes should be registered statically with the Extension Manager.
// See: scratch-vm/src/extension-support/extension-manager.js
class ArduinoRobot {    
    constructor (runtime) {
        /**
         * Store this for later communication with the Scratch VM runtime.
         * If this extension is running in a sandbox then `runtime` is an async proxy object.
         * @type {Runtime}
         */
        this.scratch_vm = runtime;
        
        this.robot = this;
        
        this._mStatus = 1;
        this._mConnection = null;
        this.CHROME_EXTENSION_ID = "jpehlabbcdkiocalmhikacglppfenoeo"; // "molfimodiodghknifkeikkldkogpapki"; APP ID on Chrome Web Store

        this.msg1 = {};
        this.msg2 = {};
        this.dist_read  = 0;
    
        this.scratch_vm.on('PROJECT_STOP_ALL', this.stopMotors.bind(this));
    
        this.connectToExtension();
    }

    /**
     * @return {object} This extension's metadata.
     */
    getInfo () {
        return {
            id: 'arduinoRobot',
            name: formatMessage({
                id: 'arduinoRobot',
                default: 'PRG Arduino Robot Blocks',
                description: 'Extension using Gizmo Robot Chrome extension to communicate with Arduino robot'
            }),
            blockIconURI: iconURI,
            menuIconURI: iconURI,

            blocks: [
                {
                    opcode: 'setLEDColor',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.setLEDColor',
                        default: 'set LED color [COLOR]',
                        description: 'Set the LED color'
                    }),
                    arguments: {
                        COLOR: {
                            type:ArgumentType.COLOR
                            // should I put a default color?
                        }    
                    }
                },
                {
                    opcode: 'ledOff',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.ledOff',
                        default: 'turn LED off',
                        description: 'Turn off the LED'
                    }),
                    arguments: { }
                },
                {
                    opcode: 'readDistance',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'arduinoBot.readDistance',
                        default: 'read distance',
                        description: 'Get distance read from ultrasonic distance sensor'
                    }),
                    arguments: { }
                },
                {
                    opcode: 'driveForward',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.driveForward',
                        default: 'drive forward [NUM] second(s)',
                        description: 'The amount of time to drive forward for'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'driveBackward',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.driveBackward',
                        default: 'drive backward [NUM] second(s)',
                        description: 'The amount of time to drive backward for'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'turnLeft',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.turnLeft',
                        default: 'turn left [NUM] second(s)',
                        description: 'The amount of time to turn left for'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'turnRight',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.turnRight',
                        default: 'turn right [NUM] second(s)',
                        description: 'The amount of time to turn right for'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                }
                // add blocks for speech?
            ]
        };
    }

    connectToExtension() {
        // Save reference to robot for use later
        var robot = this;
        var boundMsgHandler = this.onMsgFromExtension.bind(this);
        
        // Attenpt to connect to the Gizmo Chrome Extension
        chrome.runtime.sendMessage(this.CHROME_EXTENSION_ID, {message: "STATUS"}, function (response) {
            if (response === undefined) { //Chrome app not found
                // Must have the wrong extension ID (if extension was not downloaded from Chrome webstore, the extension id is not consistent)
                console.log("Chrome app not found with extension ID: " + robot.CHROME_EXTENSION_ID);
                
                // Attempt to get the extension ID from local browser storage
                robot.CHROME_EXTENSION_ID = window.localStorage.getItem('gizmo_extension_id');
                console.log("Stored extension ID: " + robot.CHROME_EXTENSION_ID);
                if (robot.CHROME_EXTENSION_ID === undefined || robot.CHROME_EXTENSION_ID === "" || robot.CHROME_EXTENSION_ID === null) {
                    // If there is no extension ID in local browser storage, prompt user to enter one
                   robot.CHROME_EXTENSION_ID = window.prompt("Enter the correct Chrome Extension ID", "pnjoidacmeigcdbikhgjolnadkdiegca");  
                }
                robot._mStatus = 0;
                // Try to connect to the Chrome extension again
                robot.connectToExtension();
            } else if (response.status === false) { //Chrome app says not connected
                console.log("Chome extension is not running"); // what does this mean?
                robot._mStatus = 1;
            } else {// Chrome app is connected
                console.log("Chrome extension found");
                // Save the extension ID in local browser storage for next time
                window.localStorage.setItem('gizmo_extension_id', robot.CHROME_EXTENSION_ID);
                if (robot._mStatus !== 2) {
                    robot._mConnection = chrome.runtime.connect(robot.CHROME_EXTENSION_ID);
                    // Add listener that triggers onMsgFromExtension everytime the Chrome extension gets a message from the robot
                    robot._mConnection.onMessage.addListener(boundMsgHandler);
                    // We're not sure that it's working until we start receiving messages
                    robot._mStatus = 1;
                }
            }
        });
    }
    
    /**
     * Implement onMsgFromExtension
     * @msg {chrome.runtime.Message} the message received from the connected Chrome extension
     * When a message is received from the Chrome extension, and therefore the robot, this handles that message
     */
    onMsgFromExtension (msg) {
      if (this._mStatus == 1) {
        console.log("Receiving messages from robot");
      }
      this._mStatus = 2;
      var buffer = msg.buffer;
      
      // The beginning of the buffer (from firmata) starts with 224, if this buffer starts with 224 it is the beginning of the message
      if ( buffer[0]==224) {
        this.messageParser(buffer);
        last_reading = 0; // Last reading signifies that the last thing stored in the msg buffer is the first part of the message
      }
  
      if (buffer[0] != 224 && last_reading == 0) { // Checking last reading makes sure that we don't concatenate the wrong part of the message
          this.messageParser(buffer);
          last_reading = 1;
      }
    }
    
    /**
     * Implement messageParser
     * @buf {byte buffer} a buffer containing a series of opcode keys and data value pairs
     * @dist_read {int} the last reading from the ultrasonic distance sensor
     * @msg1 {byte buffer} since the entire buffer does not always get transmitted in a message, this will store the first part of the buffer
     * @msg2 {byte buffer} since the entire buffer does not always get transmitted in a message, this will store the second part of the buffer
     */
    messageParser (buf) {
      var msg = {};
      if (buf[0]==224){
        this.msg1 = buf;
      } else if (buf[0] != 224) {
        this.msg2 = buf;
      }
      msg.buffer = this.msg1.concat(this.msg2);
      
      if (msg.buffer.length > 10) {
        msg.buffer = msg.buffer.slice(0,10); // The length of the buffer (from firmata) is only 10 bytes
      }
      if (msg.buffer.length == 10){
        if (msg.buffer[8] == 240) { // The opcode key before the ultrasonic distance reading data is 240
          this.dist_read = Math.round(msg.buffer[9] );
        }
        // We currently don't read any other data from the robot, but if we did we would put it here
      }
  }
  
  /**
   *
   */
  setLEDColor (args) {
    var h = args.COLOR;
    
    // Translate color arg to red, green, blue values
    var rVal = parseInt("0x" + h[1] + h[2], 16);
    var gVal = parseInt("0x" + h[3] + h[4], 16);
    var bVal = parseInt("0x" + h[5] + h[6], 16);

    console.log("set LED color: " + args.COLOR);    
    console.log("R:" + rVal + " B:" + bVal + " G:" + gVal);
    
    // Send message
    var msg = {}
    msg.buffer = [204,rVal];
    this._mConnection.postMessage(msg);
    
    msg.buffer = [205,gVal];
    this._mConnection.postMessage(msg);
	
	msg.buffer = [206,bVal]; 
    this._mConnection.postMessage(msg);
    
    return;
  }
  
  ledOff () {
    console.log("LED off");
    var msg = {}
    msg.buffer = [204,0];
    this._mConnection.postMessage(msg);
    
    msg.buffer = [205,0];
    this._mConnection.postMessage(msg);
	
	msg.buffer = [206,0]; 
    this._mConnection.postMessage(msg);
    
    return;
  }
  
  /**
     * Implement readDistance
     * @returns {string} the distance, in cm, of the nearest object. -1 means error
     */
  readDistance () {
    var distance = this.dist_read;
    if (distance == 0) {
        distance = -1;
    }
    return distance;
  }

    stopMotors () {
        var msg = {};
        console.log("Sending 207 to stop servos");
        msg.buffer = [207,99];
        this._mConnection.postMessage(msg);
      }
  
  /**
   * Implement driveForward
   * @secs {number} the number of seconds to drive forward
   * @callback {function} the code to call when this function is done executing
   */
  driveForward (args) {
	var msg = {};
    var secs = args.NUM;
	console.log("Sending 208 to drive forward, secs: " + secs);
	msg.buffer = [208,99];
    this._mConnection.postMessage(msg);
    
    return new Promise(resolve => {
            setTimeout(() => {
                this.stopMotors();
                resolve();
            }, secs*1000);
        });
  }
  
  /**
   * Implement driveBackward
   * @secs {number} the number of seconds to drive backward
   * @callback {function} the code to call when this function is done executing
   */
  driveBackward (args) {
	var msg = {};
    var secs = args.NUM;
	console.log("Sending 209 to drive backward, secs: " + secs);
	msg.buffer = [209,99];
    this._mConnection.postMessage(msg);
    
    return new Promise(resolve => {
            setTimeout(() => {
                this.stopMotors();
                resolve();
            }, secs*1000);
        });
  }
 
  /**
   * Implement turnLeft
   * @secs {number} the number of seconds to turn left
   * @callback {function} the code to call when this function is done executing
   */
  turnLeft (args) {
	var msg = {};
    var secs = args.NUM;
	console.log("Sending 210 to turn left, secs: " + secs);
	msg.buffer = [210,99];
    this._mConnection.postMessage(msg);
    
    return new Promise(resolve => {
            setTimeout(() => {
                this.stopMotors();
                resolve();
            }, secs*1000);
        });
  }

  /**
   * Implement turnRight
   * @secs {number} the number of seconds to turn right
   * @callback {function} the code to call when this function is done executing
   */
  turnRight (args) {
	var msg = {};
    var secs = args.NUM;
	console.log("Sending 211 to turn right, secs: " + secs);
	msg.buffer = [211,99];
    this._mConnection.postMessage(msg);
    
    return new Promise(resolve => {
            setTimeout(() => {
                this.stopMotors();
                resolve();
            }, secs*1000);
        });
  } 

}
module.exports = ArduinoRobot;