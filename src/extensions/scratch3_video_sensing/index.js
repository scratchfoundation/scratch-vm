const Runtime = require('../../engine/runtime');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Clone = require('../../util/clone');
const Video = require('../../io/video');

const VideoMotion = require('./library');

/**
 * States the video sensing activity can be set to.
 * @readonly
 * @enum {string}
 */
const VideoState = {
    /** Video turned off. */
    OFF: 'off',

    /** Video turned on with default y axis mirroring. */
    ON: 'on',

    /** Video turned on without default y axis mirroring. */
    ON_FLIPPED: 'on-flipped'
};

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

        /**
         * The motion detection algoritm used to power the motion amount and
         * direction values.
         * @type {VideoMotion}
         */
        this.detect = new VideoMotion();

        /**
         * The last millisecond epoch timestamp that the video stream was
         * analyzed.
         * @type {number}
         */
        this._lastUpdate = null;

        if (this.runtime.ioDevices) {
            // Clear target motion state values when the project starts.
            this.runtime.on(Runtime.PROJECT_RUN_START, this.reset.bind(this));

            // Boot up the video, canvas to down/up sample the video stream, the
            // preview skin and drawable, and kick off looping the analysis
            // logic.
            this._loop();
        }
    }

    /**
     * After analyzing a frame the amount of milliseconds until another frame
     * is analyzed.
     * @type {number}
     */
    static get INTERVAL () {
        return 33;
    }

    /**
     * Dimensions the video stream is analyzed at after its rendered to the
     * sample canvas.
     * @type {Array.<number>}
     */
    static get DIMENSIONS () {
        return [480, 360];
    }

    /**
     * The key to load & store a target's motion-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.videoSensing';
    }

    /**
     * The default motion-related state, to be used when a target has no existing motion state.
     * @type {MotionState}
     */
    static get DEFAULT_MOTION_STATE () {
        return {
            motionFrameNumber: 0,
            motionAmount: 0,
            motionDirection: 0
        };
    }

    /**
     * Reset the extension's data motion detection data. This will clear out
     * for example old frames, so the first analyzed frame will not be compared
     * against a frame from before reset was called.
     */
    reset () {
        this.detect.reset();

        const targets = this.runtime.targets;
        for (let i = 0; i < targets.length; i++) {
            const state = targets[i].getCustomState(Scratch3VideoSensingBlocks.STATE_KEY);
            if (state) {
                state.motionAmount = 0;
                state.motionDirection = 0;
            }
        }
    }

    /**
     * Occasionally step a loop to sample the video, stamp it to the preview
     * skin, and add a TypedArray copy of the canvas's pixel data.
     * @private
     */
    _loop () {
        setTimeout(this._loop.bind(this), Math.max(this.runtime.currentStepTime, Scratch3VideoSensingBlocks.INTERVAL));

        // Add frame to detector
        const time = Date.now();
        if (this._lastUpdate === null) {
            this._lastUpdate = time;
        }
        const offset = time - this._lastUpdate;
        if (offset > Scratch3VideoSensingBlocks.INTERVAL) {
            const frame = this.runtime.ioDevices.video.getFrame({
                format: Video.FORMAT_IMAGE_DATA,
                dimensions: Scratch3VideoSensingBlocks.DIMENSIONS
            });
            if (frame) {
                this._lastUpdate = time;
                this.detect.addFrame(frame.data);
            }
        }
    }

    /**
     * Create data for a menu in scratch-blocks format, consisting of an array
     * of objects with text and value properties. The text is a translated
     * string, and the value is one-indexed.
     * @param {object[]} info - An array of info objects each having a name
     *   property.
     * @return {array} - An array of objects with text and value properties.
     * @private
     */
    _buildMenu (info) {
        return info.map((entry, index) => {
            const obj = {};
            obj.text = entry.name;
            obj.value = entry.value || String(index + 1);
            return obj;
        });
    }

    /**
     * @param {Target} target - collect motion state for this target.
     * @returns {MotionState} the mutable motion state associated with that
     *   target. This will be created if necessary.
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
     * An array of choices of whether a reporter should return the frame's
     * motion amount or direction.
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

    static get MOTION () {
        return 1;
    }

    static get DIRECTION () {
        return 2;
    }

    /**
     * An array of info about each drum.
     * @type {object[]} an array of objects.
     * @param {string} name - the translatable name to display in the drums
     *   menu.
     * @param {string} fileName - the name of the audio file containing the
     *   drum sound.
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

    static get STAGE () {
        return 1;
    }

    static get SPRITE () {
        return 2;
    }

    /**
     * States the video sensing activity can be set to.
     * @readonly
     * @enum {string}
     */
    static get VideoState () {
        return VideoState;
    }

    /**
     * An array of info on video state options for the "turn video [STATE]" block.
     * @type {object[]} an array of objects
     * @param {string} name - the translatable name to display in the video state menu
     * @param {string} value - the serializable value stored in the block
     */
    get VIDEO_STATE_INFO () {
        return [
            {
                name: 'off',
                value: VideoState.OFF
            },
            {
                name: 'on',
                value: VideoState.ON
            },
            {
                name: 'on flipped',
                value: VideoState.ON_FLIPPED
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
            blocks: [
                {
                    opcode: 'videoOn',
                    blockType: BlockType.REPORTER,
                    text: 'video [MOTION_DIRECTION] on [STAGE_SPRITE]',
                    arguments: {
                        MOTION_DIRECTION: {
                            type: ArgumentType.NUMBER,
                            menu: 'MOTION_DIRECTION',
                            defaultValue: Scratch3VideoSensingBlocks.MOTION
                        },
                        STAGE_SPRITE: {
                            type: ArgumentType.NUMBER,
                            menu: 'STAGE_SPRITE',
                            defaultValue: Scratch3VideoSensingBlocks.STAGE
                        }
                    }
                },
                {
                    // @todo this hat needs to be set itself to restart existing
                    // threads like Scratch 2's behaviour.
                    opcode: 'whenMotionGreaterThan',
                    text: 'when video motion > [REFERENCE]',
                    blockType: BlockType.HAT,
                    arguments: {
                        REFERENCE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                },
                {
                    opcode: 'videoToggle',
                    text: 'turn video [VIDEO_STATE]',
                    arguments: {
                        VIDEO_STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'VIDEO_STATE',
                            defaultValue: VideoState.ON
                        }
                    }
                },
                {
                    opcode: 'setVideoTransparency',
                    text: 'set video transparency to [TRANSPARENCY]',
                    arguments: {
                        TRANSPARENCY: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 0
                        }
                    }
                }
            ],
            menus: {
                MOTION_DIRECTION: this._buildMenu(this.MOTION_DIRECTION_INFO),
                STAGE_SPRITE: this._buildMenu(this.STAGE_SPRITE_INFO),
                VIDEO_STATE: this._buildMenu(this.VIDEO_STATE_INFO)
            }
        };
    }

    /**
     * Analyze a part of the frame that a target overlaps.
     * @param {Target} target - a target to determine where to analyze
     * @returns {MotionState} the motion state for the given target
     */
    _analyzeLocalMotion (target) {
        const drawable = this.runtime.renderer._allDrawables[target.drawableID];
        const state = this._getMotionState(target);
        this.detect.getLocalMotion(drawable, state);
        return state;
    }

    /**
     * A scratch reporter block handle that analyzes the last two frames and
     * depending on the arguments, returns the motion or direction for the
     * whole stage or just the target sprite.
     * @param {object} args - the block arguments
     * @param {BlockUtility} util - the block utility
     * @returns {number} the motion amount or direction of the stage or sprite
     */
    videoOn (args, util) {
        this.detect.analyzeFrame();

        let state = this.detect;
        if (Number(args.STAGE_SPRITE) === Scratch3VideoSensingBlocks.SPRITE) {
            state = this._analyzeLocalMotion(util.target);
        }

        if (Number(args.MOTION_DIRECTION) === Scratch3VideoSensingBlocks.MOTION) {
            return state.motionAmount;
        }
        return state.motionDirection;
    }

    /**
     * A scratch hat block edge handle that analyzes the last two frames where
     * the target sprite overlaps and if it has more motion than the given
     * reference value.
     * @param {object} args - the block arguments
     * @param {BlockUtility} util - the block utility
     * @returns {boolean} true if the sprite overlaps more motion than the
     *   reference
     */
    whenMotionGreaterThan (args, util) {
        this.detect.analyzeFrame();
        const state = this._analyzeLocalMotion(util.target);
        return state.motionAmount > Number(args.REFERENCE);
    }

    /**
     * A scratch command block handle that configures the video state from
     * passed arguments.
     * @param {object} args - the block arguments
     * @param {VideoState} args.VIDEO_STATE - the video state to set the device to
     */
    videoToggle (args) {
        const state = args.VIDEO_STATE;
        if (state === VideoState.OFF) {
            this.runtime.ioDevices.video.disableVideo();
        } else {
            this.runtime.ioDevices.video.enableVideo();
            // Mirror if state is ON. Do not mirror if state is ON_FLIPPED.
            this.runtime.ioDevices.video.mirror = state === VideoState.ON;
        }
    }

    /**
     * A scratch command block handle that configures the video preview's
     * transparency from passed arguments.
     * @param {object} args - the block arguments
     * @param {number} args.TRANSPARENCY - the transparency to set the video
     *   preview to
     */
    setVideoTransparency (args) {
        this.runtime.ioDevices.video.setPreviewGhost(Number(args.TRANSPARENCY));
    }
}

module.exports = Scratch3VideoSensingBlocks;
