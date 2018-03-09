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
    constructor (runtime) {
        // Renderer
        this.runtime = runtime;
        this._skinId = -1;
        this._skin = null;
        this._drawable = -1;

        // Video
        this._video = null;
        this._track = null;
        this._nativeWidth = null;
        this._nativeHeight = null;

        // Server
        this._socket = null;
        this._lastUpdate = null;

        // Labels
        this._lastLabels = [];
        this._currentLabels = [];

        // Setup system and start streaming video to analysis server
        this._setupPreview();
        this._setupVideo();
        this._setupServer();
        this._loop();
    }

    static get HOST () {
        return 'wss://vision.scratch.mit.edu';
    }

    static get INTERVAL () {
        return 500;
    }

    static get DIMENSIONS () {
        return [480, 360];
    }

    static get ORDER () {
        return 1;
    }

    _setupPreview () {
        if (this._skinId !== -1) return;
        if (this._skin !== null) return;
        if (this._drawable !== -1) return;
        if (!this.runtime.renderer) return;

        this._skinId = this.runtime.renderer.createPenSkin();
        this._skin = this.runtime.renderer._allSkins[this._skinId];
        this._drawable = this.runtime.renderer.createDrawable();
        this.runtime.renderer.setDrawableOrder(
            this._drawable,
            VisionBlocks.ORDER
        );
        this.runtime.renderer.updateDrawableProperties(this._drawable, {
            skinId: this._skinId
        });
    }

    _setupVideo () {
        this._video = document.createElement('video');
        navigator.getUserMedia({
            audio: false,
            video: {
                width: { min: 480, ideal: 640 },
                height: { min: 360, ideal: 480 }
            }
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

            // Create low-resolution image for preview
            const canvas = document.createElement('canvas');
            canvas.width = VisionBlocks.DIMENSIONS[0];
            canvas.height = VisionBlocks.DIMENSIONS[1];
            const ctx = canvas.getContext('2d');
            const nativeWidth = this._video.videoWidth;
            const nativeHeight = this._video.videoHeight;

            // Bail if the camera is *still* not ready
            if (nativeWidth === 0) return;
            if (nativeHeight === 0) return;

            // Mirror
            ctx.scale(-1, 1);

            // Generate video thumbnail for analysis
            ctx.drawImage(
                this._video,
                0,
                0,
                nativeWidth,
                nativeHeight,
                VisionBlocks.DIMENSIONS[0] * -1,
                0,
                VisionBlocks.DIMENSIONS[0],
                VisionBlocks.DIMENSIONS[1]
            );

            // Render to preview layer
            if (this._skin !== null) {
                const xOffset = VisionBlocks.DIMENSIONS[0] / 2 * -1;
                const yOffset = VisionBlocks.DIMENSIONS[1] / 2;
                this._skin.drawStamp(canvas, xOffset, yOffset);
                this.runtime.requestRedraw();
            }

            // Forward to websocket server
            if (this._socket.readyState !== 1) return;
            const time = new Date() / 1000;
            if (this._lastUpdate === null) this._lastUpdate = time;
            const offset = (time - this._lastUpdate) * 1000;
            if (offset > VisionBlocks.INTERVAL) {
                const data = canvas.toDataURL();
                this._socket.send(data);
                this._lastUpdate = time;
            };
        }, this.runtime.THREAD_STEP_INTERVAL_COMPATIBILITY);
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
