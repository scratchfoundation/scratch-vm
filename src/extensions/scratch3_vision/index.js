const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const log = require('../../util/log');

/**
 * Array of acceptable labels returned by the vision server.
 * @todo This should be provided by the vision server at initialization of
 *       the extension rather than statically defined.
 * @type {Array}
 */
const ACCEPTED_LABELS = [
    'cat',
    'cow',
    'dog',
    'fish',
    'horse',
    'sheep',
    'bird',
    'flower',
    'tree',
    'apple',
    'banana',
    'corn',
    'drink',
    'orange',
    'pizza',
    'taco',
    'waffle',
    'baseball',
    'basketball',
    'soccer',
    'book',
    'chair',
    'clock',
    'computer',
    'hat',
    'table'
];

/**
 * "Vision" (object-detection) blocks for Scratch 3.0.
 * @constructor
 */
class VisionBlocks {
    constructor () {
        // Video
        this._video = null;
        this._track = null;
        this._nativeWidth = null;
        this._nativeHeight = null;

        // Server
        this._socket = null;

        // Labels
        this._lastLabels = [];
        this._currentLabels = [];

        // Setup system and start streaming video to analysis server
        this._setupVideo();
        this._setupServer();
        this._loop();
    }

    static get HOST () {
        return 'ws://scratch-vision-prod.us-east-1.elasticbeanstalk.com';
    }

    static get INTERVAL () {
        return 500;
    }

    static get WIDTH () {
        return 240;
    }

    _setupVideo () {
        this._video = document.createElement('video');
        navigator.getUserMedia({
            video: true,
            audio: false
        }, (stream) => {
            this._video.src = window.URL.createObjectURL(stream);
            this._track = stream.getTracks()[0]; // @todo Is this needed?
        }, (err) => {
            // @todo Properly handle errors
            log(err);
        });
    }

    _setupServer () {
        this._socket = new WebSocket(VisionBlocks.HOST);

        // Handle message events
        this._socket.onmessage = (e) => {
            // Extract data
            let data;
            try {
                data = JSON.parse(e.data);
            } catch (err) {
                console.log(err);
            }

            // Push data to label storage arrays
            this._lastLabels = this._currentLabels;
            this._currentLabels = [];
            for (let i in data.labels) {
                this._currentLabels.push(data.labels[i]);
            }

            // Print debug information
            console.clear();
            for (let i in data.debug) {
                console.log(data.debug[i]);
            }
        };

        // Handle error events
        this._socket.onerror = (e) => {
            console.log(e);
            // @todo Handle reconnection
        };

        // Handle close events
        this._socket.onclose = (e) => {
            console.log(e);
            // @todo Handle reconnection
        }
    }

    _loop () {
        setInterval(() => {
            // Ensure video stream is established
            if (!this._video) return;
            if (!this._track) return;
            if (typeof this._video.videoWidth !== 'number') return;
            if (typeof this._video.videoHeight !== 'number') return;

            // Ensure server connection is established
            if (!this._socket) return;

            // Create low-resolution PNG for analysis
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const nativeWidth = this._video.videoWidth;
            const nativeHeight = this._video.videoHeight;

            // Generate video thumbnail for analysis
            ctx.drawImage(
                this._video,
                0,
                0,
                nativeWidth,
                nativeHeight,
                0,
                0,
                VisionBlocks.WIDTH,
                nativeHeight * (VisionBlocks.WIDTH / nativeWidth)
            );
            const data = canvas.toDataURL();

            // Forward to websocket server
            if (this._socket.readyState === 1) {
                this._socket.send(data);
            };
        }, VisionBlocks.INTERVAL);
    }

    getInfo () {
        return {
            id: 'vision',
            name: 'Vision',
            blocks: [
                {
                    opcode: 'whenSeen',
                    text: 'when [LABEL] seen',
                    blockType: BlockType.HAT,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'allLabels',
                            defaultValue: ACCEPTED_LABELS[0]
                        }
                    }
                },
                {
                    opcode: 'isSeen',
                    text: 'see [LABEL] ?',
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        LABEL: {
                            type: ArgumentType.STRING,
                            menu: 'allLabels',
                            defaultValue: ACCEPTED_LABELS[0]
                        }
                    }
                }
            ],
            menus: {
                allLabels: ACCEPTED_LABELS
            }
        };
    }

    whenSeen (args) {
        const current = this._currentLabels.indexOf(args.LABEL) > -1;
        const last = this._lastLabels.indexOf(args.LABEL) > -1;
        return (current && !last);
    }

    isSeen (args) {
        return this._currentLabels.indexOf(args.LABEL) > -1;
    }
}

module.exports = VisionBlocks;
