require("regenerator-runtime/runtime");
const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');
const Cast = require('../../util/cast');
const MathUtil = require('../../util/math-util');

const microbit  = require("microbit-web-bluetooth");



const blockIconURI = 'data:image/png;base64,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';
const _colors = ['red', 'green', 'blue', 'yellow', 'cyan', 'magenta', 'white', 'random'];
const _colors_protocol = ['G#','J#','H#','K#','I#','L#','M#'];

const _songs = ['happy','sad','sleeping','angry','up', 'down', 'victory'];
const _songs_notes = [[64, 65, 67], // happy
                      [69, 67, 65, 62, 60], // sad
                      [60, 62, 64, 60, 60, 62, 64, 60], // sleeping
                      [67, 67, 67, 64, 64, 65, 65, 65, 62], // angry
                      [64, 65, 67, 69, 71, 72], // up
                      [72, 71, 69, 67, 65, 64], //down
                      [64, 67, 72]]; // victory
const _notes_protocol = ['1#','B1#', '2#','B2#', '3#','4#','B3#', '5#','B4#', '6#','B5#', '7#','8#',];
const MIN_PIEZO_NOTE = 60;
const MAX_PIEZO_NOTE = 72;

const _drive = ['forward', 'backward'];
const _turn = ['left', 'right'];

const _button = ['A','B','A or B','A and B','neither A nor B'];
const _line_states = ['right side', 'left side', 'neither side', 'both sides'];

const EXTENSION_ID = 'microbitRobot';


// Core, Team, and Official extension classes should be registered statically with the Extension Manager.
// See: scratch-vm/src/extension-support/extension-manager.js
class MicrobitRobot {    
    constructor (runtime) {
        /**
         * Store this for later communication with the Scratch VM runtime.
         * If this extension is running in a sandbox then `runtime` is an async proxy object.
         * @type {Runtime}
         */
        this.scratch_vm = runtime;
        this.scratch_vm.registerPeripheralExtension(EXTENSION_ID, this);
        this.scratch_vm.connectPeripheral(EXTENSION_ID, 0);
        
        this.robot = this;
        
        this._mStatus = 1;
        this._mDevice = null;
        this._mServices = null;

        this.dist_read  = 0;
        this.a_button = 0;
        this.b_button = 0;
        this.left_line = 0;
        this.right_line = 0;
        this.last_reading_time = 0;
        
        this.scratch_vm.on('PROJECT_STOP_ALL', this.resetRobot.bind(this));
        this.scratch_vm.on('CONNECT_MICROBIT_ROBOT', this.connectToBLE.bind(this));
        
        console.log("Version: adding clear led display");
    }

    /**
     * @return {object} This extension's metadata.
     */
    getInfo () {
        return {
            id: EXTENSION_ID,
            name: formatMessage({
                id: 'microbitRobot',
                default: 'PRG Microbit Robot Blocks',
                description: 'Extension using BLE to communicate with Microbit robot. Use hex file in https://sites.google.com/view/httyr-setup'
            }),
            showStatusButton: true,
            blockIconURI: blockIconURI,
            menuIconURI: blockIconURI,

            blocks: [
                {
                    func: 'CONNECT_MICROBIT_ROBOT',
                    blockType: BlockType.BUTTON,
                    text: 'Connect Robot'
                },
                /*{
                    opcode: 'sendCommand',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.sendCommand',
                        default: 'send comand [COMMAND]',
                        description: 'Send a particular command to the robot'
                    }),
                    arguments: {
                        COMMAND: {
                            type:ArgumentType.STRING,
                            defaultValue: "A#"
                        }
                    }
                },*/
                '---',
                {
                    opcode: 'writeLedString',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.writeLEDString',
                        default: 'display text [TEXT]',
                        description: 'Write string to LED display'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: "Hello"
                        }
                    }
                },
                {
                    opcode: 'setLedDisplay',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.setLEDDisplay',
                        default: 'display [MATRIX]',
                        description: 'Set the LED display'
                    }),
                    arguments: {
                        MATRIX: {
                            type: ArgumentType.MATRIX,
                            defaultValue: '0101010101100010101000100'
                        }
                    }
                },
                {
                    opcode: 'clearLedDisplay',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.clearLEDDisplay',
                        default: 'clear display',
                        description: 'Clear LED display'
                    })
                },
                '---',
                {
                    opcode: 'setRgbLedColor',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.setLEDColor',
                        default: 'set headlight color [COLOR]',
                        description: 'Set the RGB headlight color'
                    }),
                    arguments: {
                        COLOR: {
                            type:ArgumentType.STRING,
                            menu: 'COLORS',
                            defaultValue: "random"
                        }    
                    }
                },
                {
                    opcode: 'rgbLedOff',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.ledOff',
                        default: 'turn headlights off',
                        description: 'Turn off the LED'
                    }),
                    arguments: { }
                },
                '---',
                {
                    opcode: 'drive',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.driveForwardBackward',
                        default: 'drive [DIR] for [NUM] seconds',
                        description: 'Send command to robot to drive forward or backward'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        DIR: {
                            type:ArgumentType.String,
                            menu: 'DIRS',
                            defaultValue: _drive[0]
                        }
                    }
                },
                {
                    opcode: 'turn',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.turnRightLeft',
                        default: 'turn [TURN] for [NUM] seconds',
                        description: 'Send command to robot to turn right or left'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        TURN: {
                            type:ArgumentType.String,
                            menu: 'TURNS',
                            defaultValue: _turn[0]
                        }
                    }
                },
                {
                    opcode: 'stopMotors',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.stopMotors',
                        default: 'stop motors',
                        description: 'Stop both motors on the robot'
                    })
                },
                '---',
                {
                    opcode: 'playMusic',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduinoBot.playMusic',
                        default: 'play song [SONG]',
                        description: 'Play song using the piezo'
                    }),
                    arguments: {
                        SONG: {
                            type:ArgumentType.STRING,
                            menu: 'SONGS',
                            defaultValue: _songs[0]
                        }    
                    }
                },
                {
                    opcode: 'playNote',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'microbitBot.playNote',
                        default: 'play note [NOTE] for [NUM] seconds',
                        description: 'Play note using the piezo'
                    }),
                    arguments: {
                        NUM: {
                            type:ArgumentType.NUMBER,
                            defaultValue: 1
                        },
                        NOTE: {
                            type:ArgumentType.NOTE,
                            defaultValue: 60
                        }    
                    }
                },
                '---',
                {
                    opcode: 'whenButtonPressed',
                    text: formatMessage({
                        id: 'arduinoBot.readButtonStatus',
                        default: 'when [BUTTON] button pressed',
                        description: 'Trigger when buttons on microbit are pressed'
                    }),
                    blockType: BlockType.HAT,
                    arguments: {
                        BUTTON: {
                            type:ArgumentType.String,
                            menu: 'BUTTON_STATES',
                            defaultValue: _button[0]
                        }
                    }
                },
                {
                    opcode: 'readLineStatus',
                    blockType: BlockType.BOOLEAN,
                    text: formatMessage({
                        id: 'arduinoBot.readLineSensorStatus',
                        default: 'line detected on [LINE]',
                        description: 'detect line sensor state'
                    }),
                    arguments: {
                        LINE: {
                            type:ArgumentType.String,
                            menu: 'LINE_STATES',
                            defaultValue: _line_states[0]
                        }
                    }
                },
                {
                    opcode: 'readDistance',
                    blockType: BlockType.REPORTER,
                    text: formatMessage({
                        id: 'arduinoBot.readDistance',
                        default: 'read distance',
                        description: 'Get distance read from ultrasonic distance sensor'
                    })
                }
            ],
            menus: {
                SONGS: {
                    acceptReporters: false,
                    items: _songs
                },
                COLORS: {
                    acceptReporters: false,
                    items: _colors
                },
                DIRS: {
                    acceptReporters: false,
                    items: _drive
                },
                TURNS: {
                    acceptReporters: false,
                    items: _turn
                },
                BUTTON_STATES: {
                    acceptReporters: false,
                    items: _button
                },
                LINE_STATES: {
                    acceptReporters: false,
                    items: _line_states
                }
            }
        };
    }
    
    /* The following 4 functions have to exist for the peripherial indicator */
    connect() {
    }
    disconnect() {
    }
    scan() {
        
    }
    isConnected() {
        return (this._mStatus == 2);
    }
    
    onDeviceDisconnected() {
        console.log("Lost connection to robot");   
        this.scratch_vm.emit(this.scratch_vm.constructor.PERIPHERAL_DISCONNECTED);
        this._mDevice = null;
        this._mServices = null;
        this._mStatus = 1;
    }
    
    async connectToBLE() {
        console.log("Getting BLE device");
        
        if (window.navigator.bluetooth) {
            try {
                this._mDevice = await microbit.requestMicrobit(window.navigator.bluetooth);
                this._mServices = await microbit.getServices(this._mDevice);
                console.log(this._mServices);
      
                if (this._mServices.deviceInformationService) {
                    this._mStatus = 2;            
                    this.scratch_vm.emit(this.scratch_vm.constructor.PERIPHERAL_CONNECTED);
    
                    if (this._mServices.uartService) {
                        this._mServices.uartService.addEventListener("receiveText", this.updateSensors.bind(this));
                        this._mDevice.addEventListener("gattserverdisconnected", this.onDeviceDisconnected.bind(this));
                    }
                }
            } catch(err) {
                console.log(err);
                if (err.message == "Bluetooth adapter not available.") alert("Your device does not support BLE connections. Please go to the robot setup instructions to install the Gizmo Robot Extension.");
            }
        } else {
            alert("Error trying to connect to BLE devices. Please try again.");
        }
    }
   
  resetRobot() {
    this.stopMotors();
    this.rgbLedOff();
    this.stopMusic();
  }
  
  /**
   * RANDI just for testing out sending commands to robot via ble
   */
  sendCommand (args) {
    let command = args.COMMAND;
    if (this._mServices) this._mServices.uartService.sendText(command);
    else console.log("No device");
  }
  
  clearLedDisplay (args) {
    let ledMatrix = [[false, false, false, false, false],
                     [false, false, false, false, false],
                     [false, false, false, false, false],
                     [false, false, false, false, false],
                     [false, false, false, false, false]];
    console.log("Clear led display");
    if (this._mServices) this._mServices.ledService.writeMatrixState(ledMatrix);
  }
  
  setLedDisplay (args) {
    let matrix = args.MATRIX;
    let ledMatrix = [[false, false, false, false, false],
                     [false, false, false, false, false],
                     [false, false, false, false, false],
                     [false, false, false, false, false],
                     [false, false, false, false, false]];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
            if (matrix[5*i+j] == 1) ledMatrix[i][j] = true;
        }
    }
    console.log("Set led matrix: " + ledMatrix);
    if (this._mServices) this._mServices.ledService.writeMatrixState(ledMatrix);

  }
  
  writeLedString (args) {
    let text = args.TEXT;
    console.log("Write led string: " + text);
    if (this._mServices) this._mServices.ledService.writeText(text);

  }
  
   /**
   *
   */
  async playMusic (args) {
    console.log("play song: " + args.SONG);    
    
    // Translate song to index to get notes
    let idxStr = _songs.indexOf(args.SONG);
    let song_notes = _songs_notes[idxStr];
    
    // Loop through notes and play them
    let arg = {};
    
    for (let i=0; i<_songs_notes[idxStr].length; i++) {
        arg.NOTE = _songs_notes[idxStr][i];
        arg.NUM = 0.25;
        await this.playNote(arg);
    }
  }

  /**
   *
   */
  playNote (args) {
    console.log("play note: " + args.NOTE);
    let secs = args.NUM;
    let noteIdx = Cast.toNumber(args.NOTE);
    noteIdx = MathUtil.clamp(noteIdx, MIN_PIEZO_NOTE, MAX_PIEZO_NOTE) - 60;
    let note = _notes_protocol[noteIdx];
    console.log(noteIdx + " " + note);
    
    // Play song  
    if (this._mServices) this._mServices.uartService.sendText(note);
    
    return new Promise(resolve => {
            setTimeout(() => {
                this.stopMusic();
                resolve();
            }, secs*1000);
        });
  }
  
  stopMusic () {
    console.log("Music off");     
    if (this._mServices) this._mServices.uartService.sendText('O#');
    
    return;
  }
  
  /**
   *
   */
  setRgbLedColor (args) {
    // Translate color to ble protocol command
    let colorCmd = 0;
    
    if (args.COLOR == 'random') {
        let idx = Math.floor(Math.random() * (_colors.length - 1));
        colorCmd = _colors_protocol[idx];
    } else {
        colorCmd = _colors_protocol[_colors.indexOf(args.COLOR)];
    }
    
    console.log("set LED color: " + args.COLOR + " " + colorCmd);
    // Send message
    if (this._mServices) this._mServices.uartService.sendText(colorCmd);
    
  }
  rgbLedOff () {
    console.log("Headlights off: " + "O#");
    if (this._mServices) this._mServices.uartService.sendText('N#');
        
    return;
  }
  
  /**
   *
   */
  updateSensors (event) {
    console.log("Got UART data: " + event.detail);
    //console.log(event);
    let readings = event.detail.split(",")
    if (readings.length == 5) {
        this.dist_read = parseInt(readings[0].substring(4));
        this.a_button = parseInt(readings[1]);
        this.b_button = parseInt(readings[2]);
        this.left_line = parseInt(readings[3]);
        this.right_line = parseInt(readings[4]);
    }
    if (isNaN(this.dist_read)) this.dist_read = 0;
    if (isNaN(this.a_button)) this.a_button = 0;
    if (isNaN(this.b_button)) this.b_button = 0;
    if (isNaN(this.left_line)) this.left_line = 0;
    if (isNaN(this.right_line)) this.right_line = 0;
  }
  
  /**
     * Implement readDistance
     * @returns {string} the distance, in cm, of the nearest object. -1 means error
     */
  readDistance () {
    let current_time = Date.now();
    if (current_time - this.last_reading_time > 250) {
        console.log("Updating sensors");
        // send command to trigger distance read
        if (this._mServices) this._mServices.uartService.sendText('W#');
        this.last_reading_time = current_time;
    }
    
    let distance = this.dist_read;
    if (distance == 0) {
        distance = -1;
    }
    
    return distance;
  }
  
      /**
     * Implement readButtonStaus
     * @returns {string} t
     */
  readButtonStatus (args) {
    let current_time = Date.now();
    if (current_time - this.last_reading_time > 250) {
        console.log("Updating sensors");
        // send command to trigger distance read
        if (this._mServices) this._mServices.uartService.sendText('W#');
        this.last_reading_time = current_time;
    }
    
    var state = args.BUTTON;
    if (state == 'A') {
        return this.a_button == 1;   
    } else if (state == 'B') {
        return this.b_button == 1;
    } else if (state == 'A or B') {
        return (this.a_button == 1) || (this.b_button == 1);
    } else if (state == 'A and B') {
        return (this.a_button == 1) && (this.b_button == 1);
    } else if (state == 'neither A nor B') {
        return (this.a_button == 0) && (this.b_button == 0);
    }
    return false; // should never get here
  }
  /**
    * Implement whenButtonPressed
    */
  whenButtonPressed(args) {
    return this.readButtonStatus(args);
  }
  
  /**
     * Implement readLineStatus
     * @returns {string} t
     */
  readLineStatus (args) {
    let current_time = Date.now();
    if (current_time - this.last_reading_time > 250) {
        console.log("Updating sensors");
        // send command to trigger distance read
        if (this._mServices) this._mServices.uartService.sendText('W#');
        this.last_reading_time = current_time;
    }
    
    var state = args.LINE;
    
    if (state == 'right side') {
        return this.right_line == 1;   
    } else if (state == 'left side') {
        return this.left_line == 1;
    } else if (state == 'both sides') {
        return (this.right_line == 1) && (this.left_line == 1);
    } else if (state == 'neither side') {
        return (this.right_line == 0) && (this.left_line == 0);
    }
    return false; // should never get here
  }

  stopMotors () {
    console.log("Sending stop motors");
    if (this._mServices) this._mServices.uartService.sendText('0#');
  }
    
  /**
   * Implement drive to drive forward or backward
   * @secs {number} the number of seconds to drive backward
   * @dir {string} whether to turn "left" or "right"
   * @callback {function} the code to call when this function is done executing
   */
  drive (args) {
	var msg = {};
    var secs = args.NUM;
    var dir = args.DIR;
    
    if (dir == 'forward') {
        console.log("Sending drive forward, secs: " + secs);        
        if (this._mServices) this._mServices.uartService.sendText('A#');
    } else {
        console.log('Sending drive backward, secs: ' + secs);
        if (this._mServices) this._mServices.uartService.sendText('B#');

    }
    if (this._mConnection != null) this._mConnection.postMessage(msg);  
    
    if (secs == '') // if seconds is left blank, don't pump the brakes
        return;
    
    return new Promise(resolve => {
            setTimeout(() => {
                this.stopMotors();
                resolve();
            }, secs*1000);
        });
  }
  
  /**
   * Implement turn to turn left or right
   * @secs {number} the number of seconds to turn left
   * @dir {string} whether to turn "left" or "right"
   * @callback {function} the code to call when this function is done executing
   */
  turn(args) {
	var msg = {};
    var secs = args.NUM;
    var dir = args.TURN;
    
    if (dir == 'left') {
        console.log("Sending turn left, secs: " + secs);        
        if (this._mServices) this._mServices.uartService.sendText('E#');
    } else {
        console.log("Sending turn right, secs: " + secs);        
        if (this._mServices) this._mServices.uartService.sendText('D#');
    }

    if (this._mConnection != null) this._mConnection.postMessage(msg);  

    if (secs == '') // if seconds is left blank, don't pump the brakes
        return;
    
    return new Promise(resolve => {
            setTimeout(() => {
                this.stopMotors();
                resolve();
            }, secs*1000);
        });
  }
 
}
module.exports = MicrobitRobot;
