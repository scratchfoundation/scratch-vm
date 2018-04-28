const nets = require('nets');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const cast = require('../../util/cast');
const color = require('../../util/color');
const log = require('../../util/log');
const math = require('../../util/math-util');

/**
 * Host for discovery of Philips Hue bridge devices on the LAN.
 * @type {String}
 */
const DISCOVERY_HOST = 'https://www.meethue.com/api/nupnp';

/**
 * Number of seconds to transition between states of a light.
 * @type {Number}
 */
const TRANSITION_TIME = 1;

/**
 * Accepted color parameters.
 * @type {Array}
 */
const COLOR_PARMETERS = ['color', 'saturation', 'brightness'];

/**
 * Philips Hue extension.
 * @class
 */
class PhilipsHue {
    constructor () {
        // Connection information
        this._host = null;
        this._index = null;
        this._identifier = 'scratch';
        this._username = null;

        // Light state
        this._on = true;
        this._lastOn = false;
        this._color = 10; // orange
        this._saturation = 100;
        this._brightness = 100;
        this._dirty = true;

        // Get light index for extension
        // @todo This should be presented to the user visually, but for now it
        //       accepts a numeric input between 1 and 4.
        const index = window.prompt('Light index:');
        this._index = index;

        // Use NUPNP to automatically discover a Philips Hue bridge on network
        nets({
            method: 'GET',
            uri: DISCOVERY_HOST,
            json: {}
        }, (err, res, body) => {
            if (err) return log.error(err);
            if (res.statusCode !== 200) return log.error(body);

            // Set host IP for bridge
            this._host = body[0].internalipaddress;

            // Authenticate client
            // @todo Present the user with a UI to prompt pressing the pair
            //       button on the bridge.
            // @todo This should probably not create a new user every time if
            //       possible. Can we keep something in local storage?
            this._authenticate((err, username) => {
                if (err) return log.error(err);

                // Set username for future requests
                this._username = username;

                // Start update loop
                this._loop();
            });
        });
    }

    getInfo () {
        return {
            id: 'philipsHue',
            name: 'Philips Hue',
            blocks: [
                {
                    opcode: 'turnLightOnOff',
                    text: 'turn light [VALUE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            menu: 'LIGHT_STATE',
                            defaultValue: 'on'
                        }
                    }
                },
                {
                    opcode: 'setLightColor',
                    text: 'set light color to [VALUE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VALUE: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'changeLightProperty',
                    text: 'change light [PROPERTY] by [VALUE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PROPERTY: {
                            type: ArgumentType.STRING,
                            menu: 'COLOR_PARAM',
                            defaultValue: COLOR_PARMETERS[0]
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                },
                {
                    opcode: 'setLightProperty',
                    text: 'set light [PROPERTY] to [VALUE]',
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PROPERTY: {
                            type: ArgumentType.STRING,
                            menu: 'COLOR_PARAM',
                            defaultValue: COLOR_PARMETERS[0]
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                }
            ],
            menus: {
                LIGHT_STATE: ['on', 'off'],
                COLOR_PARAM: COLOR_PARMETERS
            }
        };
    }

    _xhr (body, callback) {
        // Set HTTP request defaults
        body.uri = `http://${this._host}${body.uri}`;
        body.timeout = 1000;

        // Make XHR request
        nets(body, function (err, res, body) {
            if (err) return callback('Could not connect to bridge');
            if (res.statusCode !== 200) return callback(res.statusCode);
            callback(null, body);
        });
    }

    _authenticate (callback) {
        // @todo Delay by 5 seconds (give time to hit the button)
        // this._xhr({
        //     method: 'POST',
        //     uri: `/api`,
        //     json: {
        //         devicetype: this._identifier
        //     }
        // }, (err, body) => {
        //     if (err) return callback(err);
        //     if (typeof body[0] === 'undefined') return callback(403);
        //     if (typeof body[0].success === 'undefined') return callback(403);
        //     callback(null, body[0].success.username);
        // });
        callback(null, '9boOFwbceEAKbI6fNw9cGeSKAk-Hd-JEqgNagNOw');
    }

    // @note For some reason Philips Hue only accepts numbers between 0 and 254
    //       rather than 255 – thus the odd 8-bit scaling.
    _rangeToEight (input) {
        return Math.floor(input / 100 * 254);
    }

    _rangeToSixteen (input) {
        return Math.floor(input / 100 * 65535);
    }

    _loop () {
        if (!this._dirty) return setTimeout(this._loop.bind(this), 50);

        // Create payload
        const payload = {
            hue: this._rangeToSixteen(this._color),
            sat: this._rangeToEight(this._saturation),
            bri: this._rangeToEight(this._brightness),
            transitiontime: TRANSITION_TIME
        };

        // Add "on" state if needed
        // @note This is done as a performance optimization. The Hue system
        //       is much less responsive if the "on" state is sent as part of
        //       each request.
        if (this._lastOn !== this._on) {
            payload.on = this._on;
            this._lastOn = this._on;
        }

        // Push current light state to hue system via HTTP request
        this._xhr({
            method: 'PUT',
            uri: `/api/${this._username}/lights/${this._index}/state`,
            json: payload
        }, (err) => {
            if (err) log.error(err);
            this._dirty = false;
            setTimeout(this._loop.bind(this), 100);
        });
    }

    turnLightOnOff (args) {
        // Update "on" state
        this._on = (
            args.VALUE === 'on' ||
            (
                args.VALUE !== 'off' &&
                cast.toBoolean(args.VALUE)
            )
        );

        // Set state to "dirty"
        this._dirty = true;
    }

    setLightColor (args) {
        // Convert argument to RGB, HSB, and then update state
        const rgb = cast.toRgbColorObject(args.VALUE);
        const hsv = color.rgbToHsv(rgb);
        this._color = Math.floor(hsv.h / 360 * 100);
        this._saturation = Math.floor(hsv.s * 100);
        this._brightness = Math.floor(hsv.v * 100);

        // Set state to "dirty"
        this._dirty = true;
    }

    changeLightProperty (args) {
        // Parse arguments and update state
        const prop = args.PROPERTY;
        const value = cast.toNumber(args.VALUE);
        if (COLOR_PARMETERS.indexOf(prop) === -1) return;
        this[`_${prop}`] += value;
        if (prop === 'color') {
            this[`_${prop}`] = math.wrapClamp(this[`_${prop}`], 0, 100);
        } else {
            this[`_${prop}`] = math.clamp(this[`_${prop}`], 0, 100);
        }

        // Set state to "dirty"
        this._dirty = true;
    }

    setLightProperty (args) {
        // Parse arguments and update state
        const prop = args.PROPERTY;
        const value = cast.toNumber(args.VALUE);
        if (COLOR_PARMETERS.indexOf(prop) === -1) return;
        if (prop === 'color') {
            this[`_${prop}`] = math.wrapClamp(value, 0, 100);
        } else {
            this[`_${prop}`] = math.clamp(value, 0, 100);
        }


        // Set state to "dirty"
        this._dirty = true;
    }
}

module.exports = PhilipsHue;
