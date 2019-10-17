/**
 * @file library.js
 *
 * Tony Hwang and John Maloney, January 2011
 * Michael "Z" Goddard, March 2018
 *
 * Video motion sensing primitives.
 */

const {motionVector, scratchAtan2} = require('./math');

/**
 * The width of the intended resolution to analyze for motion.
 * @type {number}
 */
const WIDTH = 480;

/**
 * The height of the intended resolution to analyze for motion.
 * @type {number}
 */
const HEIGHT = 360;

/**
 * A constant value to scale the magnitude of the x and y components called u
 * and v. This creates the motionAmount value.
 *
 * Old note: chosen empirically to give a range of roughly 0-100
 *
 * @type {number}
 */
const AMOUNT_SCALE = 100;

/**
 * A constant value to scale the magnitude of the x and y components called u
 * and v in the local motion derivative. This creates the motionAmount value on
 * a target's motion state.
 *
 * Old note: note 2e-4 * activePixelNum is an experimentally tuned threshold
 * for my logitech Pro 9000 webcam - TTH
 *
 * @type {number}
 */
const LOCAL_AMOUNT_SCALE = AMOUNT_SCALE * 2e-4;

/**
 * The motion amount must be higher than the THRESHOLD to calculate a new
 * direction value.
 * @type {number}
 */
const THRESHOLD = 10;

/**
 * The size of the radius of the window of summarized values when considering
 * the motion inside the full resolution of the sample.
 * @type {number}
 */
const WINSIZE = 8;

/**
 * A ceiling for the motionAmount stored to a local target's motion state. The
 * motionAmount is not allowed to be larger than LOCAL_MAX_AMOUNT.
 * @type {number}
 */
const LOCAL_MAX_AMOUNT = 100;

/**
 * The motion amount for a target's local motion must be higher than the
 * LOCAL_THRESHOLD to calculate a new direction value.
 * @type {number}
 */
const LOCAL_THRESHOLD = THRESHOLD / 3;

/**
 * Store the necessary image pixel data to compares frames of a video and
 * detect an amount and direction of motion in the full sample or in a
 * specified area.
 * @constructor
 */
class VideoMotion {
    constructor () {
        /**
         * The number of frames that have been added from a source.
         * @type {number}
         */
        this.frameNumber = 0;

        /**
         * The frameNumber last analyzed.
         * @type {number}
         */
        this.lastAnalyzedFrame = 0;

        /**
         * The amount of motion detected in the current frame.
         * @type {number}
         */
        this.motionAmount = 0;

        /**
         * The direction the motion detected in the frame is general moving in.
         * @type {number}
         */
        this.motionDirection = 0;

        /**
         * A copy of the current frame's pixel values. A index of the array is
         * represented in RGBA. The lowest byte is red. The next is green. The
         * next is blue. And the last is the alpha value of that pixel.
         * @type {Uint32Array}
         */
        this.curr = null;

        /**
         * A copy of the last frame's pixel values.
         * @type {Uint32Array}
         */
        this.prev = null;

        /**
         * A buffer for holding one component of a pixel's full value twice.
         * One for the current value. And one for the last value.
         * @type {number}
         */
        this._arrays = new ArrayBuffer(WIDTH * HEIGHT * 2 * 1);

        /**
         * A clamped uint8 view of _arrays. One component of each index of the
         * curr member is copied into this array.
         * @type {number}
         */
        this._curr = new Uint8ClampedArray(this._arrays, WIDTH * HEIGHT * 0 * 1, WIDTH * HEIGHT);

        /**
         * A clamped uint8 view of _arrays. One component of each index of the
         * prev member is copied into this array.
         * @type {number}
         */
        this._prev = new Uint8ClampedArray(this._arrays, WIDTH * HEIGHT * 1 * 1, WIDTH * HEIGHT);
    }

    /**
     * Reset internal state so future frame analysis does not consider values
     * from before this method was called.
     */
    reset () {
        this.frameNumber = 0;
        this.lastAnalyzedFrame = 0;
        this.motionAmount = this.motionDirection = 0;
        this.prev = this.curr = null;
    }

    /**
     * Add a frame to be next analyzed. The passed array represent a pixel with
     * each index in the RGBA format.
     * @param {Uint32Array} source - a source frame of pixels to copy
     */
    addFrame (source) {
        this.frameNumber++;

        // Swap curr to prev.
        this.prev = this.curr;
        // Create a clone of the array so any modifications made to the source
        // array do not affect the work done in here.
        this.curr = new Uint32Array(source.buffer.slice(0));

        // Swap _prev and _curr. Copy one of the color components of the new
        // array into _curr overwriting what was the old _prev data.
        const _tmp = this._prev;
        this._prev = this._curr;
        this._curr = _tmp;
        for (let i = 0; i < this.curr.length; i++) {
            this._curr[i] = this.curr[i] & 0xff;
        }
    }

    /**
     * Analyze the current frame against the previous frame determining the
     * amount of motion and direction of the motion.
     */
    analyzeFrame () {
        if (!this.curr || !this.prev) {
            this.motionAmount = this.motionDirection = -1;
            // Don't have two frames to analyze yet
            return;
        }

        // Return early if new data has not been received.
        if (this.lastAnalyzedFrame === this.frameNumber) {
            return;
        }
        this.lastAnalyzedFrame = this.frameNumber;

        const {
            _curr: curr,
            _prev: prev
        } = this;

        const winStep = (WINSIZE * 2) + 1;
        const wmax = WIDTH - WINSIZE - 1;
        const hmax = HEIGHT - WINSIZE - 1;

        // Accumulate 2d motion vectors from groups of pixels and average it
        // later.
        let uu = 0;
        let vv = 0;
        let n = 0;

        // Iterate over groups of cells building up the components to determine
        // a motion vector for each cell instead of the whole frame to avoid
        // integer overflows.
        for (let i = WINSIZE + 1; i < hmax; i += winStep) {
            for (let j = WINSIZE + 1; j < wmax; j += winStep) {
                let A2 = 0;
                let A1B2 = 0;
                let B1 = 0;
                let C1 = 0;
                let C2 = 0;

                // This is a performance critical math region.
                let address = ((i - WINSIZE) * WIDTH) + j - WINSIZE;
                let nextAddress = address + winStep;
                const maxAddress = ((i + WINSIZE) * WIDTH) + j + WINSIZE;
                for (; address <= maxAddress; address += WIDTH - winStep, nextAddress += WIDTH) {
                    for (; address <= nextAddress; address += 1) {
                        // The difference in color between the last frame and
                        // the current frame.
                        const gradT = ((prev[address]) - (curr[address]));
                        // The difference between the pixel to the left and the
                        // pixel to the right.
                        const gradX = ((curr[address - 1]) - (curr[address + 1]));
                        // The difference between the pixel above and the pixel
                        // below.
                        const gradY = ((curr[address - WIDTH]) - (curr[address + WIDTH]));

                        // Add the combined values of this pixel to previously
                        // considered pixels.
                        A2 += gradX * gradX;
                        A1B2 += gradX * gradY;
                        B1 += gradY * gradY;
                        C2 += gradX * gradT;
                        C1 += gradY * gradT;
                    }
                }

                // Use the accumalated values from the for loop to determine a
                // motion direction.
                const {u, v} = motionVector(A2, A1B2, B1, C2, C1);

                // If u and v are within negative winStep to positive winStep,
                // add them to a sum that will later be averaged.
                if (-winStep < u && u < winStep && -winStep < v && v < winStep) {
                    uu += u;
                    vv += v;
                    n++;
                }
            }
        }

        // Average the summed vector values of all of the motion groups.
        uu /= n;
        vv /= n;

        // Scale the magnitude of the averaged UV vector.
        this.motionAmount = Math.round(AMOUNT_SCALE * Math.hypot(uu, vv));
        if (this.motionAmount > THRESHOLD) {
            // Scratch direction
            this.motionDirection = scratchAtan2(vv, uu);
        }
    }

    /**
     * Build motion amount and direction values based on stored current and
     * previous frame that overlaps a given drawable.
     * @param {Drawable} drawable - touchable and bounded drawable to build motion for
     * @param {MotionState} state - state to store built values to
     */
    getLocalMotion (drawable, state) {
        if (!this.curr || !this.prev) {
            state.motionAmount = state.motionDirection = -1;
            // Don't have two frames to analyze yet
            return;
        }

        // Skip if the current frame has already been considered for this state.
        if (state.motionFrameNumber !== this.frameNumber) {
            const {
                _prev: prev,
                _curr: curr
            } = this;

            // The public APIs for Renderer#isTouching manage keeping the matrix and
            // silhouette up-to-date, which is needed for drawable#isTouching to work (used below)
            drawable.updateMatrix();
            if (drawable.skin) drawable.skin.updateSilhouette();

            // Restrict the region the amount and direction are built from to
            // the area of the current frame overlapped by the given drawable's
            // bounding box.
            const boundingRect = drawable.getFastBounds();
            // Transform the bounding box from scratch space to a space from 0,
            // 0 to WIDTH, HEIGHT.
            const xmin = Math.max(Math.floor(boundingRect.left + (WIDTH / 2)), 1);
            const xmax = Math.min(Math.floor(boundingRect.right + (WIDTH / 2)), WIDTH - 1);
            const ymin = Math.max(Math.floor((HEIGHT / 2) - boundingRect.top), 1);
            const ymax = Math.min(Math.floor((HEIGHT / 2) - boundingRect.bottom), HEIGHT - 1);

            let A2 = 0;
            let A1B2 = 0;
            let B1 = 0;
            let C1 = 0;
            let C2 = 0;
            let scaleFactor = 0;

            const position = [0, 0, 0];

            // This is a performance critical math region.
            for (let i = ymin; i < ymax; i++) {
                for (let j = xmin; j < xmax; j++) {
                    // i and j are in a coordinate planning ranging from 0 to
                    // HEIGHT and 0 to WIDTH. Transform that into Scratch's
                    // range of HEIGHT / 2 to -HEIGHT / 2 and -WIDTH / 2 to
                    // WIDTH / 2;
                    position[0] = j - (WIDTH / 2);
                    position[1] = (HEIGHT / 2) - i;
                    // Consider only pixels in the drawable that can touch the
                    // edge or other drawables. Empty space in the current skin
                    // is skipped.
                    if (drawable.isTouching(position)) {
                        const address = (i * WIDTH) + j;
                        // The difference in color between the last frame and
                        // the current frame.
                        const gradT = ((prev[address]) - (curr[address]));
                        // The difference between the pixel to the left and the
                        // pixel to the right.
                        const gradX = ((curr[address - 1]) - (curr[address + 1]));
                        // The difference between the pixel above and the pixel
                        // below.
                        const gradY = ((curr[address - WIDTH]) - (curr[address + WIDTH]));

                        // Add the combined values of this pixel to previously
                        // considered pixels.
                        A2 += gradX * gradX;
                        A1B2 += gradX * gradY;
                        B1 += gradY * gradY;
                        C2 += gradX * gradT;
                        C1 += gradY * gradT;
                        scaleFactor++;
                    }
                }
            }

            // Use the accumalated values from the for loop to determine a
            // motion direction.
            let {u, v} = motionVector(A2, A1B2, B1, C2, C1);

            let activePixelNum = 0;
            if (scaleFactor) {
                // Store the area of the sprite in pixels
                activePixelNum = scaleFactor;

                scaleFactor /= (2 * WINSIZE * 2 * WINSIZE);
                u = u / scaleFactor;
                v = v / scaleFactor;
            }

            // Scale the magnitude of the averaged UV vector and the number of
            // overlapping drawable pixels.
            state.motionAmount = Math.round(LOCAL_AMOUNT_SCALE * activePixelNum * Math.hypot(u, v));
            if (state.motionAmount > LOCAL_MAX_AMOUNT) {
                // Clip all magnitudes greater than 100.
                state.motionAmount = LOCAL_MAX_AMOUNT;
            }
            if (state.motionAmount > LOCAL_THRESHOLD) {
                // Scratch direction.
                state.motionDirection = scratchAtan2(v, u);
            }

            // Skip future calls on this state until a new frame is added.
            state.motionFrameNumber = this.frameNumber;
        }
    }
}

module.exports = VideoMotion;
