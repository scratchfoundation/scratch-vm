const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const log = require('../../util/log');
const Timer = require('../../util/timer');

const VideoMotion = require('./lib');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PHRpdGxlPm11c2ljLWJsb2NrLWljb248L3RpdGxlPjxkZWZzPjxwYXRoIGQ9Ik0zMi4xOCAyNS44NzRDMzIuNjM2IDI4LjE1NyAzMC41MTIgMzAgMjcuNDMzIDMwYy0zLjA3IDAtNS45MjMtMS44NDMtNi4zNzItNC4xMjYtLjQ1OC0yLjI4NSAxLjY2NS00LjEzNiA0Ljc0My00LjEzNi42NDcgMCAxLjI4My4wODQgMS44OS4yMzQuMzM4LjA4Ni42MzcuMTguOTM4LjMwMi44Ny0uMDItLjEwNC0yLjI5NC0xLjgzNS0xMi4yMy0yLjEzNC0xMi4zMDIgMy4wNi0xLjg3IDguNzY4LTIuNzUyIDUuNzA4LS44ODUuMDc2IDQuODItMy42NSAzLjg0NC0zLjcyNC0uOTg3LTQuNjUtNy4xNTMuMjYzIDE0LjczOHptLTE2Ljk5OCA1Ljk5QzE1LjYzIDM0LjE0OCAxMy41MDcgMzYgMTAuNDQgMzZjLTMuMDcgMC01LjkyMi0xLjg1Mi02LjM4LTQuMTM2LS40NDgtMi4yODQgMS42NzQtNC4xMzUgNC43NS00LjEzNSAxLjAwMyAwIDEuOTc1LjE5NiAyLjg1NS41NDMuODIyLS4wNTUtLjE1LTIuMzc3LTEuODYyLTEyLjIyOC0yLjEzMy0xMi4zMDMgMy4wNi0xLjg3IDguNzY0LTIuNzUzIDUuNzA2LS44OTQuMDc2IDQuODItMy42NDggMy44MzQtMy43MjQtLjk4Ny00LjY1LTcuMTUyLjI2MiAxNC43Mzh6IiBpZD0iYSIvPjwvZGVmcz48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjx1c2UgZmlsbD0iI0ZGRiIgeGxpbms6aHJlZj0iI2EiLz48cGF0aCBzdHJva2Utb3BhY2l0eT0iLjEiIHN0cm9rZT0iIzAwMCIgZD0iTTI4LjQ1NiAyMS42NzVjLS4wMS0uMzEyLS4wODctLjgyNS0uMjU2LTEuNzAyLS4wOTYtLjQ5NS0uNjEyLTMuMDIyLS43NTMtMy43My0uMzk1LTEuOTgtLjc2LTMuOTItMS4xNDItNi4xMTMtLjczMi00LjIyMy0uNjkzLTYuMDUuMzQ0LTYuNTI3LjUtLjIzIDEuMDYtLjA4IDEuODQuMzUuNDE0LjIyNyAyLjE4MiAxLjM2NSAyLjA3IDEuMjk2IDEuOTk0IDEuMjQyIDMuNDY0IDEuNzc0IDQuOTMgMS41NDggMS41MjYtLjIzNyAyLjUwNC0uMDYgMi44NzYuNjE4LjM0OC42MzUuMDE1IDEuNDE2LS43MyAyLjE4LTEuNDcyIDEuNTE2LTMuOTc1IDIuNTE0LTUuODQ4IDIuMDIzLS44MjItLjIyLTEuMjM4LS40NjUtMi4zOC0xLjI2N2wtLjA5NS0uMDY2Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMy4yOTQgMS4zMzYgMi4wOCA5LjE4NyAyLjYzNyAxMS42NzRsLjAwMi4wMTJjLjUyOCAyLjYzNy0xLjg3MyA0LjcyNC01LjIzNiA0LjcyNC0zLjI5IDAtNi4zNjMtMS45ODgtNi44NjItNC41MjgtLjUzLTIuNjQgMS44NzMtNC43MzQgNS4yMzMtNC43MzQuNjcyIDAgMS4zNDcuMDg1IDIuMDE0LjI1LjIyNy4wNTcuNDM2LjExOC42MzYuMTg3em0tMTYuOTk2IDUuOTljLS4wMS0uMzE4LS4wOS0uODM4LS4yNjYtMS43MzctLjA5LS40Ni0uNTk1LTIuOTM3LS43NTMtMy43MjctLjM5LTEuOTYtLjc1LTMuODktMS4xMy02LjA3LS43MzItNC4yMjMtLjY5Mi02LjA1LjM0NC02LjUyNi41MDItLjIzIDEuMDYtLjA4MiAxLjg0LjM1LjQxNS4yMjcgMi4xODIgMS4zNjQgMi4wNyAxLjI5NSAxLjk5MyAxLjI0MiAzLjQ2MiAxLjc3NCA0LjkyNiAxLjU0OCAxLjUyNS0uMjQgMi41MDQtLjA2NCAyLjg3Ni42MTQuMzQ4LjYzNS4wMTUgMS40MTUtLjcyOCAyLjE4LTEuNDc0IDEuNTE3LTMuOTc3IDIuNTEzLTUuODQ3IDIuMDE3LS44Mi0uMjItMS4yMzYtLjQ2NC0yLjM3OC0xLjI2N2wtLjA5NS0uMDY1Yy4wNDcuNTkzLjI2NCAxLjc0LjcxNyAzLjgwMi4yOTQgMS4zMzcgMi4wNzggOS4xOSAyLjYzNiAxMS42NzVsLjAwMy4wMTNjLjUxNyAyLjYzOC0xLjg4NCA0LjczMi01LjIzNCA0LjczMi0zLjI4NyAwLTYuMzYtMS45OTMtNi44Ny00LjU0LS41Mi0yLjY0IDEuODg0LTQuNzMgNS4yNC00LjczLjkwNSAwIDEuODAzLjE1IDIuNjUuNDM2eiIvPjwvZz48L3N2Zz4=';

/**
 * Icon svg to be displayed in the category menu, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const menuIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE2LjA5IDEyLjkzN2MuMjI4IDEuMTQxLS44MzMgMi4wNjMtMi4zNzMgMi4wNjMtMS41MzUgMC0yLjk2Mi0uOTIyLTMuMTg2LTIuMDYzLS4yMy0xLjE0Mi44MzMtMi4wNjggMi4zNzItMi4wNjguMzIzIDAgLjY0MS4wNDIuOTQ1LjExN2EzLjUgMy41IDAgMCAxIC40NjguMTUxYy40MzUtLjAxLS4wNTItMS4xNDctLjkxNy02LjExNC0xLjA2Ny02LjE1MiAxLjUzLS45MzUgNC4zODQtMS4zNzcgMi44NTQtLjQ0Mi4wMzggMi40MS0xLjgyNSAxLjkyMi0xLjg2Mi0uNDkzLTIuMzI1LTMuNTc3LjEzMiA3LjM3ek03LjQ2IDguNTYzYy0xLjg2Mi0uNDkzLTIuMzI1LTMuNTc2LjEzIDcuMzdDNy44MTYgMTcuMDczIDYuNzU0IDE4IDUuMjIgMThjLTEuNTM1IDAtMi45NjEtLjkyNi0zLjE5LTIuMDY4LS4yMjQtMS4xNDIuODM3LTIuMDY3IDIuMzc1LTIuMDY3LjUwMSAwIC45ODcuMDk4IDEuNDI3LjI3Mi40MTItLjAyOC0uMDc0LTEuMTg5LS45My02LjExNEMzLjgzNCAxLjg3IDYuNDMgNy4wODcgOS4yODIgNi42NDZjMi44NTQtLjQ0Ny4wMzggMi40MS0xLjgyMyAxLjkxN3oiIGZpbGw9IiM1NzVFNzUiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==';

/**
 * Class for the motion-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3VideoSensingBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        this.detect = new VideoMotion();

        this._lastUpdate = null;

        this._skinId = -1;
        this._skin = null;
        this._drawable = -1;

        this._setupVideo();
        this._setupSampleCanvas();
        this._setupPreview();
        this._loop();
    }

    static get INTERVAL () {
        return 33;
    }

    static get DIMENSIONS () {
        return [480, 360];
    }

    static get ORDER () {
        return 1;
    }

    _setupVideo () {
        this._video = document.createElement('video');
        navigator.getUserMedia({
            audio: false,
            video: {
                width: {min: 480, ideal: 640},
                height: {min: 360, ideal: 480}
            }
        }, stream => {
            this._video.src = window.URL.createObjectURL(stream);
            // Hint to the stream that it should load. A standard way to do this
            // is add the video tag to the DOM. Since this extension wants to
            // hide the video tag and instead render a sample of the stream into
            // the webgl rendered Scratch canvas, another hint like this one is
            // needed.
            this._track = stream.getTracks()[0];
        }, err => {
            // @todo Properly handle errors
            log(err);
        });
    }

    _setupSampleCanvas () {
        // Create low-resolution image to sample video for analysis and preview
        const canvas = this._sampleCanvas = document.createElement('canvas');
        canvas.width = Scratch3VideoSensingBlocks.DIMENSIONS[0];
        canvas.height = Scratch3VideoSensingBlocks.DIMENSIONS[1];
        this._sampleContext = canvas.getContext('2d');
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
            Scratch3VideoSensingBlocks.ORDER
        );
        this.runtime.renderer.updateDrawableProperties(this._drawable, {
            skinId: this._skinId
        });
    }

    _loop () {
        setTimeout(this._loop.bind(this), this.runtime.currentStepTime);

        // Ensure video stream is established
        if (!this._video) return;
        if (!this._track) return;
        if (typeof this._video.videoWidth !== 'number') return;
        if (typeof this._video.videoHeight !== 'number') return;

        // Bail if the camera is *still* not ready
        const nativeWidth = this._video.videoWidth;
        const nativeHeight = this._video.videoHeight;
        if (nativeWidth === 0) return;
        if (nativeHeight === 0) return;

        const ctx = this._sampleContext;

        // Mirror
        ctx.scale(-1, 1);

        // Generate video thumbnail for analysis
        ctx.drawImage(
            this._video,
            0,
            0,
            nativeWidth,
            nativeHeight,
            Scratch3VideoSensingBlocks.DIMENSIONS[0] * -1,
            0,
            Scratch3VideoSensingBlocks.DIMENSIONS[0],
            Scratch3VideoSensingBlocks.DIMENSIONS[1]
        );

        // Restore the canvas transform
        ctx.resetTransform();

        // Render to preview layer
        if (this._skin !== null) {
            const xOffset = Scratch3VideoSensingBlocks.DIMENSIONS[0] / 2 * -1;
            const yOffset = Scratch3VideoSensingBlocks.DIMENSIONS[1] / 2;
            this._skin.drawStamp(this._sampleCanvas, xOffset, yOffset);
            this.runtime.requestRedraw();
        }

        // Add frame to detector
        const time = Date.now();
        if (this._lastUpdate === null) this._lastUpdate = time;
        const offset = time - this._lastUpdate;
        if (offset > Scratch3VideoSensingBlocks.INTERVAL) {
            this._lastUpdate = time;
            const data = ctx.getImageData(
                0, 0, Scratch3VideoSensingBlocks.DIMENSIONS[0], Scratch3VideoSensingBlocks.DIMENSIONS[1]
            );
            this.detect.addFrame(data.data);
        }
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array of objects with text and
     * value properties. The text is a translated string, and the value is one-indexed.
     * @param  {object[]} info - An array of info objects each having a name property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = String(index + 1);
            return obj;
        });
    }

    /**
     * The key to load & store a target's motion-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.videoSensing';
    }

    /**
     * The default music-related state, to be used when a target has no existing music state.
     * @type {MusicState}
     */
    static get DEFAULT_MOTION_STATE () {
        return {
            currentInstrument: 0
        };
    }

    /**
     * @param {Target} target - collect motion state for this target.
     * @returns {MotionState} the mutable motion state associated with that target. This will be created if necessary.
     * @private
     */
    _getMotionState (target) {
        let motionState = target.getCustomState(Scratch3VideoSensingBlocks.STATE_KEY);
        if (!motionState) {
            motionState = Clone.simple(Scratch3VideoSensingBlocks.DEFAULT_MOTION_STATE);
            target.setCustomState(Scratch3VideoSensingBlocks.STATE_KEY, motionState);
        }
        return motionState;
    }

    /**
     * An array of info about each drum.
     * @type {object[]} an array of objects.
     * @param {string} name - the translatable name to display in the drums menu.
     * @param {string} fileName - the name of the audio file containing the drum sound.
     */
    get MOTION_DIRECTION_INFO () {
        return [
            {
                name: 'motion'
            },
            {
                name: 'direction'
            }
        ];
    }

    /**
     * An array of info about each drum.
     * @type {object[]} an array of objects.
     * @param {string} name - the translatable name to display in the drums menu.
     * @param {string} fileName - the name of the audio file containing the drum sound.
     */
    get STAGE_SPRITE_INFO () {
        return [
            {
                name: 'stage'
            },
            {
                name: 'sprite'
            }
        ];
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'videoSensing',
            name: 'Video Sensing',
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'videoOn',
                    blockType: BlockType.REPORTER,
                    text: 'video [MOTION_DIRECTION] on [STAGE_SPRITE]',
                    arguments: {
                        MOTION_DIRECTION: {
                            type: ArgumentType.NUMBER,
                            menu: 'MOTION_DIRECTION',
                            defaultValue: 1
                        },
                        STAGE_SPRITE: {
                            type: ArgumentType.NUMBER,
                            menu: 'STAGE_SPRITE',
                            defaultValue: 1
                        }
                    }
                }
            ],
            menus: {
                MOTION_DIRECTION: this._buildMenu(this.MOTION_DIRECTION_INFO),
                STAGE_SPRITE: this._buildMenu(this.STAGE_SPRITE_INFO)
            }
        };
    }

    videoOn (args, util) {
        this.detect.analyzeFrame();

        let state = this.detect;
        if (Number(args.STAGE_SPRITE) === 2) {
            const drawable = this.runtime.renderer._allDrawables[util.target.drawableID];
            state = this._getMotionState(util.target);
            this.detect.getLocalMotion(drawable, state);
        }

        if (Number(args.MOTION_DIRECTION) === 1) {
            return state.motionAmount;
        }
        return state.motionDirection;
    }

    /**
     * Check if the stack timer needs initialization.
     * @param {object} util - utility object provided by the runtime.
     * @return {boolean} - true if the stack timer needs to be initialized.
     * @private
     */
    _stackTimerNeedsInit (util) {
        return !util.stackFrame.timer;
    }

    /**
     * Start the stack timer and the yield the thread if necessary.
     * @param {object} util - utility object provided by the runtime.
     * @param {number} duration - a duration in seconds to set the timer for.
     * @private
     */
    _startStackTimer (util, duration) {
        util.stackFrame.timer = new Timer();
        util.stackFrame.timer.start();
        util.stackFrame.duration = duration;
        util.yield();
    }

    /**
     * Check the stack timer, and if its time is not up yet, yield the thread.
     * @param {object} util - utility object provided by the runtime.
     * @private
     */
    _checkStackTimer (util) {
        const timeElapsed = util.stackFrame.timer.timeElapsed();
        if (timeElapsed < util.stackFrame.duration * 1000) {
            util.yield();
        }
    }
}

module.exports = Scratch3VideoSensingBlocks;
