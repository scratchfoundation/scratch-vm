const Cast = require('../util/cast');
const convert = require('../engine/parseSequence');
const convertBase = new convert();
const Color = require('../util/color');
const Timer = require('../util/timer');

class DisplayBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.positionsCopy = [];
        this.copyThePositions = true;
        this._time = 0;
        this.satellite = '';
        this._timeoutIds = [];
        this.actions = [];
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            playspotDisplay_image: this.displayImage,
            playspotDisplay_animateImage: this.animateImage,
            playspotDisplay_fillImage: this.fillImage,
            playspotDisplay_displayHistogram: this.displayHistogram
        };
    }

    singleImage (upperLower, image) {
        return {
            singleImage: {
                pause: 0,
                region: upperLower,
                name: image,
                duration: 1
            }
        };
    }

    imageAnimation (from, to, direction, upperLower) {
        return {
            inOut: {
                region: upperLower,
                endName: to,
                startName: from,
                duration: 1,
                direction: direction,
                pause: 0
            }
        };
    }

    fill (args) {
        return {
            imageFillSequence: {
                startPercent: Number(args.BEGIN) || 0,
                region: args.REGION || 'upper',
                color: {
                    red: Number(args.RED) || 0,
                    green: Number(args.GREEN) || 0,
                    blue: Number(args.BLUE) || 128
                },
                endPercent: Number(args.END) || 100,
                duration: 1,
                pause: 0,
                name: args.IMAGE || 'Empty'
            }
        };
    }

    histogram (red, green, blue, region) {
        return {
            histogram: {
                end: {
                    bar3: Math.random(),
                    bar1: Math.random(),
                    bar4: Math.random(),
                    bar2: Math.random(),
                    bar5: Math.random()
                },
                region: region,
                begin: {
                    bar3: Math.random(),
                    bar1: Math.random(),
                    bar4: Math.random(),
                    bar2: Math.random(),
                    bar5: Math.random()
                },
                steps: 20,
                color: {
                    red: red,
                    green: green,
                    blue: blue
                },
                duration: 1.5,
                pause: 0
            }
        };
    }

    displayImage (args) {
        const outboundTopic = `display/animation`;
        const img = this.singleImage(args.REGION, args.IMAGE);
        const string = JSON.stringify(img);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        const data = {
            topic: outboundTopic,
            message: arr
        };
        this.runtime.emit('DISPLAY_IMAGE', data);
    }

    animateImage (args) {
        const outboundTopic = `display/animation`;
        const animation = this.imageAnimation(args.FROM, args.TO, args.DIRECTION, args.REGION);
        const string = JSON.stringify(animation);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        const data = {
            topic: outboundTopic,
            message: arr
        };
        this.runtime.emit('ANIMATE_IMAGE', data);
    }

    fillImage (args) {
        const outboundTopic = `display/animation`;
        const fill = this.fill(args);
        const string = JSON.stringify(fill);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        const data = {
            topic: outboundTopic,
            message: arr
        };
        this.runtime.emit('FILL_IMAGE', data);
    }

    displayHistogram (args) {
        const outboundTopic = `display/animation`;
        const histo = this.histogram(
            args.RED || 0,
            args.GREEN || 255,
            args.BLUE || 128
        );
        const string = JSON.stringify(histo);
        const utf8Encode = new TextEncoder();
        const arr = utf8Encode.encode(string);
        const data = {
            topic: outboundTopic,
            message: arr
        };
        this.runtime.emit('DISPLAY_HISTOGRAM', data);
    }
}

module.exports = DisplayBlocks;
