const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const formatMessage = require('format-message');

const URL = {
    MOVE: 'http://119.3.234.131:9000/CodeIDE/CarMove',
    TEMPERATUE: 'http://119.3.234.131:9000/CodeIDE/Temperature',
    FAN: 'http://119.3.234.131:9000/CodeIDE/FAN'
};

class XMLDoc {
    constructor () {
        if (window.XMLHttpRequest) {
            this.xmlhttp = new XMLHttpRequest();
        } else {
            // this.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            this.xmlhttp = new XMLHttpRequest();
        }

        this.xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        this.xmlhttp.onreadystatechange = function () {
            if (this.xmlhttp.readyState === 4 && this.xmlhttp.status === 200){
                const data = JSON.parse(this.xmlhttp.responseText);
            } else {
                const data = this.xmlhttp.responseText;
            }
            console.log(data);
        };
    }

    Post (url, data) {
        this.xmlhttp.open('POST', url);
        this.xmlhttp.send(data);
    }
}

class Scratch3inteCarBlocks {
    constructor (runtime) {
        this.runtime = runtime;
        // this._http = new XMLDoc();
    }

    get OPEN_CLOSE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'inteCar.cpen_closeMenu.open',
                    default: 'open',
                    description: 'open something'
                }),
                value: '1'
            },
            {
                text: formatMessage({
                    id: 'inteCar.cpen_closeMenu.close',
                    default: 'close',
                    description: 'close something'
                }),
                value: '0'
            }
        ];
    }

    get HAND_MENU () {
        return [
            {
                text: 'right hand',
                value: 'righthand'
            },
            {
                text: 'left hand',
                value: 'lefthand'
            }
        ];
    }

    get URL () {
        return 'http://119.3.234.131:9000';
    }

    getInfo () {
        return {
            id: 'inteCar',
            name: 'Fxzy Intelligent Car',
            blocks: [
                {
                    opcode: 'move',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.move',
                        default: 'car go [DIRECTION] in [TIME] seconds',
                        description: 'car move'
                    }),
                    arguments: {
                        DIRECTION: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                default: 'front',
                                description: 'car move direction'
                            })
                        },
                        TIME: {
                            type: ArgumentType.NUMBER,
                            defaultValue: formatMessage({
                                default: 1,
                                description: 'default time'
                            })
                        }
                    }
                },

                {
                    opcode: 'showWords',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.showWords',
                        default: 'car show [TEXT]',
                        description: 'car show words'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: formatMessage({
                                id: 'inteCar.defaultTextToShow',
                                default: 'hello world',
                                description: 'default text to show.'
                            })
                        }
                    }
                },

                {
                    opcode: 'showTemperature',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.showTemperature',
                        default: 'car [ISOPEN] show temperature',
                        description: 'car is or not show temperature'
                    }),
                    arguments: {
                        ISOPEN: {
                            type: ArgumentType.STRING,
                            menu: 'open_close',
                            defaultValue: '1'
                        }
                    }
                },

                {
                    opcode: 'fanOpen',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.fanOpen',
                        default: 'car [ISOPEN] fan',
                        description: 'car is or not open fan'
                    }),
                    arguments: {
                        ISOPEN: {
                            type: ArgumentType.STRING,
                            menu: 'open_close_menu',
                            defaultValue: '1'
                        }
                    }
                },

                {
                    opcode: 'getDis',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.getDis',
                        default: 'car [ISOPEN] measure distance',
                        description: 'car is or not measure distance'
                    }),
                    arguments: {
                        ISOPEN: {
                            type: ArgumentType.STRING,
                            menu: 'open_close_menu',
                            defaultValue: '1'
                        }
                    }
                },

                {
                    opcode: 'playSound',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.playSound',
                        default: 'car say [TEXT]',
                        description: 'car play some sound'
                    }),
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            default: 'hello world',
                            description: 'default text for sound play'
                        }
                    }
                },

                {
                    opcode: 'regFace',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.regFace',
                        default: 'recognise face',
                        description: 'car recognise face'
                    })
                },

                {
                    opcode: 'regObj',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.regObj',
                        default: 'recognise Objection',
                        description: 'car recognise Objection'
                    })
                },

                {
                    opcode: 'regLicensePlate',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.regLicensePlate',
                        default: 'recognise regLicensePlate',
                        description: 'car recognise regLicensePlate'
                    })
                },

                {
                    opcode: 'raiseHand',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'inteCar.raiseHand',
                        default: 'car raise [HAND]',
                        description: 'car raise its hand'
                    }),
                    arguments: {
                        HAND: {
                            type: ArgumentType.STRING,
                            menu: 'handmenu',
                            defaultValue: 'righthand'
                        }
                    }
                }

            ],
            menus: {
                open_close_menu: this.OPEN_CLOSE_MENU,
                handmenu: this.HAND_MENU
            }
        };
    }

    showWords (args, util) {
        const message = args.TEXT;
        console.log(message);
        this.runtime.emit('SAY', util.target, 'say', message);
    }

    move (args, util) {
        let time = args.TIME;
        let direction = args.DIRECTION;
        let data = {
            dir: direction,
            time: time
        };
        this._http.Post(URL.MOVE, data);

    }

    showTemperature (args, util) {
        let opt = args.ISOPEN;
    }

    fanOpen (args, util) {
        const opt = args.ISOPEN;
        console.log(opt);
    }

    getDis (args, util) {
        const opt = args.ISOPEN;
        console.log(opt);
    }

    playSound(args, util) {
        const meg = args.TEXT;
        console.log(meg);
    }

    regFace (args, util) {
        console.log('regFace');
    }

    regObj(args, util) {
        console.log('regObj');
    }

    regLicensePlate(args, util) {
        console.log('regLicensePlate');
    }

    raiseHand(args, util) {
        const hand = args.HAND;
        console.log(hand);
    }
}

module.exports = Scratch3inteCarBlocks;
