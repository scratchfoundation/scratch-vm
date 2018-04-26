const nets = require('nets');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const cast = require('../../util/cast');
const color = require('../../util/color');
const log = require('../../util/log');
const math = require('../../util/math-util');

class PhilipsHue {
    constructor () {
        // Connection information
        this._host = null;
        this._index = 0;
        this._identifier = 'scratch';
        this._username = null;

        // Light state
        this._on = true;
        this._color = 0;
        this._saturation = 100;
        this._brightness = 100;

        // Get information from user for extension setup
        // @todo Can I use "https://www.meethue.com/api/nupnp" to attempt discovery?
        const host = window.prompt('IP address for Philips Hue hub:');
        // @todo Can I default to "group/0" but provide this in some hidden way?
        const index = window.prompt('Light index:');
        this._host = host;
        this._index = index;

        // Authenticate client
        // @todo Delay N seconds to wait for hitting the button on the bridge?
        // @todo This should probably not create a new user every time if not
        //       needed. Can we keep something in local storage?
        this._authenticate((err, username) => {
            // @todo Retry on failure?
            if (err) return log.error(err);
            this._username = username;
            this._pushState(err => {
                if (err) return log.error(err);
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
                            defaultValue: 'color'
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
                            defaultValue: 'color'
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
                COLOR_PARAM: ['color', 'saturation', 'brightness']
            }
        };
    }

    _xhr (body, callback) {
        // @todo Handle throttling / single queue?
        body.uri = `https://${this._host}${body.uri}`;
        // @todo Set this in a constant somewhere
        body.timeout = 5000;

        // Make XHR request
        nets(body, function (err, res, body) {
            if (err) return callback('Could not connect to bridge');
            if (res.statusCode !== 200) return callback(res.statusCode);
            callback(null, body);
        });
    }

    _authenticate (callback) {
        // @todo Delay by 5 seconds (give time to hit the button)
        this._xhr({
            method: 'POST',
            uri: `/api`,
            json: {
                devicetype: this._identifier
            }
        }, (err, body) => {
            if (err) return callback(err);
            if (typeof body[0] === 'undefined') return callback(403);
            if (typeof body[0].success === 'undefined') return callback(403);
            callback(null, body[0].success.username);
        });
    }

    // @note For some reason Philips Hue only accepts numbers between 0 and 254
    // rather than 255 – thus the odd 8-bit scaling.
    _rangeToEight (input) {
        return Math.floor(input / 100 * 254);
    }

    _rangeToSixteen (input) {
        return Math.floor(input / 100 * 65535);
    }

    _pushState (callback) {
        // Create payload
        // @todo Philips advises to not always send the "on" state if the light
        //       is already on. I suppose I could store the "last" on state and
        //       then determine inclusion of this property.
        // @todo Set transition time (ms) in a constant somewhere
        const payload = {
            on: this._on,
            hue: this._rangeToSixteen(this._color),
            sat: this._rangeToEight(this._saturation),
            bri: this._rangeToEight(this._brightness),
            transitiontime: 100
        };

        // @todo Push current light state to hue system via HTTP request
        // @todo Replace '/groups/0/action' with '/lights/:id/state'
        this._xhr({
            method: 'PUT',
            uri: `/api/${this._username}/groups/0/action`,
            json: payload
        }, callback);
        // @todo Should this block the thread while waiting?
        //       Philips recommends no more than 10 req/sec for individual
        //       lights and no more than 1 req/sec for the whole group
        // @todo If so, what's the timeout?
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

        // Push state
        return new Promise(resolve => {
            this._pushState(resolve);
        });
    }

    setLightColor (args) {
        // Convert argument to RGB, HSB, and then update state
        const rgb = cast.toRgbColorObject(args.VALUE);
        const hsv = color.rgbToHsv(rgb);
        this._color = Math.floor(hsv.h / 360 * 100);
        this._saturation = Math.floor(hsv.s * 100);
        this._brightness = Math.floor(hsv.v * 100);

        // Push state
        return new Promise(resolve => {
            this._pushState(resolve);
        });
    }

    changeLightProperty (args) {
        // Parse arguments and update state
        // @todo Make this list a constant somewhere and update getInfo
        const valid = ['color', 'saturation', 'brightness'];
        const prop = args.PROPERTY;
        const value = cast.toNumber(args.VALUE);
        if (valid.indexOf(prop) === -1) return;
        this[`_${prop}`] += value;
        // @todo Color should probably wrapClamp rather than clamp
        this[`_${prop}`] = math.clamp(this[`_${prop}`], 0, 100);

        // Push state
        return new Promise(resolve => {
            this._pushState(resolve);
        });
    }

    setLightProperty (args) {
        // Parse arguments and update state
        // @todo Make this list a constant somewhere and update getInfo
        const valid = ['color', 'saturation', 'brightness'];
        const prop = args.PROPERTY;
        const value = cast.toNumber(args.VALUE);
        if (valid.indexOf(prop) === -1) return;
        // @todo Color should probably wrapClamp rather than clamp
        this[`_${prop}`] = math.clamp(value, 0, 100);

        // Push state
        return new Promise(resolve => {
            this._pushState(resolve);
        });
    }
}

module.exports = PhilipsHue;
