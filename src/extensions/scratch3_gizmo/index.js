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
const blockIconURI = 'data:image/png;base64,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';

// Core, Team, and Official extension classes should be registered statically with the Extension Manager.
// See: scratch-vm/src/extension-support/extension-manager.js
class GizmoRobot {    
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
        this.infrared_read = 0;
        this.scratch_vm.on('PROJECT_STOP_ALL', this.stopMotors.bind(this));
    
        this.connectToExtension();
    }

    /**
     * @return {object} This extension's metadata.
     */
    getInfo () {
        return {
            id: 'gizmoRobot',
            name: formatMessage({
                id: 'gizmoRobot',
                default: 'PRG Gizmo Robot',
                description: 'Extension using Gizmo Robot Chrome extension to communicate with Gizmo robot'
            }),
            blockIconURI: blockIconURI,
            menuIconURI: blockIconURI,
            docsURI: 'https://aieducation.mit.edu/poppet.html',

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
                    opcode: 'readInfrared',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'arduinoBot.readInfrared',
                        default: 'read infrared sensor',
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
        if (msg.buffer[0] == 224) {
            this.infrared_read = Math.round(msg.buffer[1]);
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
  
  /**
   * Implement readInfrared
   * @returns {string} 0 if the object is detected or 1 if not
   */
  readInfrared () {
    var val = this.infrared_read;
    if (val == 0) {
        val = -1;
    }
    return val;
  }

  /**
   * Implement stopMotors
   * @callback {function} the code to call when this function is done executing
   */
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
module.exports = GizmoRobot;