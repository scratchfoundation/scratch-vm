const {motionVector} = require('./math');

const WIDTH = 480;
const HEIGHT = 360;
const WINSIZE = 8;
const AMOUNT_SCALE = 100;
const THRESHOLD = 10;

/**
 * Modes of debug output that can be rendered.
 * @type {object}
 */
const OUTPUT = {
    /**
     * Render the original input.
     * @type {number}
     */
    INPUT: -1,

    /**
     * Render the difference of neighboring pixels for each pixel. The
     * horizontal difference, or x value, renders in the red output component.
     * The vertical difference, or y value, renders in the green output
     * component. Pixels with equal neighbors with a kind of lime green or
     * #008080 in a RGB hex value. Colors with more red have a lower value to
     * the right than the value to the left. Colors with less red have a higher
     * value to the right than the value to the left. Similarly colors with
     * more green have lower values below than above and colors with less green
     * have higher values below than above.
     * @type {number}
     */
    XY: 0,

    /**
     * Render the XY output with groups of pixels averaged together. The group
     * shape and size matches the full frame's analysis window size.
     * @type {number}
     */
    XY_CELL: 1,

    /**
     * Render three color components matching the detection algorith's values
     * that multiple the horizontal difference, or x value, and the vertical
     * difference, or y value together. The red component is the x value
     * squared. The green component is the y value squared. The blue component
     * is the x value times the y value. The detection code refers to these
     * values as A2, B1, and A1B2.
     * @type {number}
     */
    AB: 2,

    /**
     * Render the AB output of groups of pixels summarized by their combined
     * square root. The group shape and size matches the full frame's analysis
     * window size.
     * @type {number}
     */
    AB_CELL: 3,

    /**
     * Render a single color component matching the temporal difference or the
     * difference in color for the same pixel coordinate in the current frame
     * and the last frame. The difference is rendered in the blue color
     * component since x and y axis differences tend to use red and green.
     * @type {number}
     */
    T: 4,

    /**
     * Render the T output of groups of pixels averaged. The group shape and
     * size matches the full frame's analysis window.
     * @type {number}
     */
    T_CELL: 5,

    /**
     * Render the XY and T outputs together. The x and y axis values use the
     * red and green color components as they do in the XY output. The t values
     * use the blue color component as the T output does.
     * @type {number}
     */
    XYT: 6,

    /**
     * Render the XYT output of groups of pixels averaged. The group shape and
     * size matches the full frame's analysis window.
     * @type {number}
     */
    XYT_CELL: 7,

    /**
     * Render the horizontal pixel difference times the temporal difference as
     * red and the vertical and temporal difference as green. Multiplcation of
     * these values ends up with sharp differences in the output showing edge
     * details where motion is happening.
     * @type {number}
     */
    C: 8,

    /**
     * Render the C output of groups of pixels averaged. The group shape and
     * size matches the full frame's analysis window.
     * @type {number}
     */
    C_CELL: 9,

    /**
     * Render a per pixel version of UV_CELL. UV_CELL is a close to final step
     * of the motion code that builds a motion amount and direction from those
     * values. UV_CELL renders grouped summarized values, UV does the per pixel
     * version but its can only represent one motion vector code path out of
     * two choices. Determining the motion vector compares some of the built
     * values but building the values with one pixel ensures this first
     * comparison says the values are equal. Even though only one code path is
     * used to build the values, its output is close to approximating the
     * better solution building vectors from groups of pixels to help
     * illustrate when the code determines the motion amount and direction to
     * be.
     * @type {number}
     */
    UV: 10,

    /**
     * Render cells of mulitple pixels at a step in the motion code that has
     * the same cell values and turns them into motion vectors showing the
     * amount of motion in the x axis and y axis separately. Those values are a
     * step away from becoming a motion amount and direction through standard
     * vector to magnitude and angle values.
     * @type {number}
     */
    UV_CELL: 11
};

/**
 * Temporary storage structure for returning values in
 * VideoMotionView._components.
 * @type {object}
 */
const _videoMotionViewComponentsTmp = {
    A2: 0,
    A1B2: 0,
    B1: 0,
    C2: 0,
    C1: 0
};

/**
 * Manage a debug canvas with VideoMotion input frames running parts of what
 * VideoMotion does to visualize what it does.
 * @param {VideoMotion} motion - VideoMotion with inputs to visualize
 * @param {OUTPUT} output - visualization output mode
 * @constructor
 */
class VideoMotionView {
    constructor (motion, output = OUTPUT.XYT) {
        /**
         * VideoMotion instance to visualize.
         * @type {VideoMotion}
         */
        this.motion = motion;

        /**
         * Debug canvas to render to.
         * @type {HTMLCanvasElement}
         */
        const canvas = this.canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        /**
         * 2D context to draw to debug canvas.
         * @type {CanvasRendering2DContext}
         */
        this.context = canvas.getContext('2d');

        /**
         * Visualization output mode.
         * @type {OUTPUT}
         */
        this.output = output;

        /**
         * Pixel buffer to store output values into before they replace the last frames info in the debug canvas.
         * @type {Uint32Array}
         */
        this.buffer = new Uint32Array(WIDTH * HEIGHT);
    }

    /**
     * Modes of debug output that can be rendered.
     * @type {object}
     */
    static get OUTPUT () {
        return OUTPUT;
    }

    /**
     * Iterate each pixel address location and call a function with that address.
     * @param {number} xStart - start location on the x axis of the output pixel buffer
     * @param {number} yStart - start location on the y axis of the output pixel buffer
     * @param {nubmer} xStop - location to stop at on the x axis
     * @param {number} yStop - location to stop at on the y axis
     * @param {function} fn - handle to call with each iterated address
     */
    _eachAddress (xStart, yStart, xStop, yStop, fn) {
        for (let i = yStart; i < yStop; i++) {
            for (let j = xStart; j < xStop; j++) {
                const address = (i * WIDTH) + j;
                fn(address, j, i);
            }
        }
    }

    /**
     * Iterate over cells of pixels and call a function with a function to
     * iterate over pixel addresses.
     * @param {number} xStart - start location on the x axis
     * @param {number} yStart - start lcoation on the y axis
     * @param {number} xStop - location to stop at on the x axis
     * @param {number} yStop - location to stop at on the y axis
     * @param {number} xStep - width of the cells
     * @param {number} yStep - height of the cells
     * @param {function} fn - function to call with a bound handle to _eachAddress
     */
    _eachCell (xStart, yStart, xStop, yStop, xStep, yStep, fn) {
        const xStep2 = (xStep / 2) | 0;
        const yStep2 = (yStep / 2) | 0;
        for (let i = yStart; i < yStop; i += yStep) {
            for (let j = xStart; j < xStop; j += xStep) {
                fn(
                    _fn => this._eachAddress(j - xStep2 - 1, i - yStep2 - 1, j + xStep2, i + yStep2, _fn),
                    j - xStep2 - 1,
                    i - yStep2 - 1,
                    j + xStep2,
                    i + yStep2
                );
            }
        }
    }

    /**
     * Build horizontal, vertical, and temporal difference of a pixel address.
     * @param {number} address - address to build values for
     * @returns {object} a object with a gradX, grady, and gradT value
     */
    _grads (address) {
        const {curr, prev} = this.motion;
        const gradX = (curr[address - 1] & 0xff) - (curr[address + 1] & 0xff);
        const gradY = (curr[address - WIDTH] & 0xff) - (curr[address + WIDTH] & 0xff);
        const gradT = (prev[address] & 0xff) - (curr[address] & 0xff);
        return {gradX, gradY, gradT};
    }

    /**
     * Build component values used in determining a motion vector for a pixel
     * address.
     * @param {function} eachAddress - a bound handle to _eachAddress to build
     *   component values for
     * @returns {object} a object with a A2, A1B2, B1, C2, C1 value
     */
    _components (eachAddress) {
        let A2 = 0;
        let A1B2 = 0;
        let B1 = 0;
        let C2 = 0;
        let C1 = 0;

        eachAddress(address => {
            const {gradX, gradY, gradT} = this._grads(address);
            A2 += gradX * gradX;
            A1B2 += gradX * gradY;
            B1 += gradY * gradY;
            C2 += gradX * gradT;
            C1 += gradY * gradT;
        });

        _videoMotionViewComponentsTmp.A2 = A2;
        _videoMotionViewComponentsTmp.A1B2 = A1B2;
        _videoMotionViewComponentsTmp.B1 = B1;
        _videoMotionViewComponentsTmp.C2 = C2;
        _videoMotionViewComponentsTmp.C1 = C1;
        return _videoMotionViewComponentsTmp;
    }

    /**
     * Visualize the motion code output mode selected for this view to the
     * debug canvas.
     */
    draw () {
        if (!(this.motion.prev && this.motion.curr)) {
            return;
        }

        const {buffer} = this;

        if (this.output === OUTPUT.INPUT) {
            const {curr} = this.motion;
            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                buffer[address] = curr[address];
            });
        }
        if (this.output === OUTPUT.XYT) {
            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                const {gradX, gradY, gradT} = this._grads(address);
                const over1 = gradT / 0xcf;
                buffer[address] =
                    (0xff << 24) +
                    (Math.floor((((gradY * over1) & 0xff) + 0xff) / 2) << 8) +
                    Math.floor((((gradX * over1) & 0xff) + 0xff) / 2);
            });
        }
        if (this.output === OUTPUT.XYT_CELL) {
            const winStep = (WINSIZE * 2) + 1;
            const wmax = WIDTH - WINSIZE - 1;
            const hmax = HEIGHT - WINSIZE - 1;

            this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
                let C1 = 0;
                let C2 = 0;
                let n = 0;

                eachAddress(address => {
                    const {gradX, gradY, gradT} = this._grads(address);
                    C2 += (Math.max(Math.min(gradX / 0x0f, 1), -1)) * (gradT / 0xff);
                    C1 += (Math.max(Math.min(gradY / 0x0f, 1), -1)) * (gradT / 0xff);
                    n += 1;
                });

                C1 /= n;
                C2 /= n;
                C1 = Math.log(C1 + (1 * Math.sign(C1))) / Math.log(2);
                C2 = Math.log(C2 + (1 * Math.sign(C2))) / Math.log(2);

                eachAddress(address => {
                    buffer[address] = (0xff << 24) +
                        (((((C1 * 0x7f) | 0) + 0x80) << 8) & 0xff00) +
                        (((((C2 * 0x7f) | 0) + 0x80) << 0) & 0xff);
                });
            });
        }
        if (this.output === OUTPUT.XY) {
            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                const {gradX, gradY} = this._grads(address);
                buffer[address] = (0xff << 24) + (((gradY + 0xff) / 2) << 8) + ((gradX + 0xff) / 2);
            });
        }
        if (this.output === OUTPUT.XY_CELL) {
            const winStep = (WINSIZE * 2) + 1;
            const wmax = WIDTH - WINSIZE - 1;
            const hmax = HEIGHT - WINSIZE - 1;

            this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
                let C1 = 0;
                let C2 = 0;
                let n = 0;

                eachAddress(address => {
                    const {gradX, gradY} = this._grads(address);
                    C2 += Math.max(Math.min(gradX / 0x1f, 1), -1);
                    C1 += Math.max(Math.min(gradY / 0x1f, 1), -1);
                    n += 1;
                });

                C1 /= n;
                C2 /= n;
                C1 = Math.log(C1 + (1 * Math.sign(C1))) / Math.log(2);
                C2 = Math.log(C2 + (1 * Math.sign(C2))) / Math.log(2);

                eachAddress(address => {
                    buffer[address] = (0xff << 24) +
                        (((((C1 * 0x7f) | 0) + 0x80) << 8) & 0xff00) +
                        (((((C2 * 0x7f) | 0) + 0x80) << 0) & 0xff);
                });
            });
        } else if (this.output === OUTPUT.T) {
            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                const {gradT} = this._grads(address);
                buffer[address] = (0xff << 24) + ((gradT + 0xff) / 2 << 16);
            });
        }
        if (this.output === OUTPUT.T_CELL) {
            const winStep = (WINSIZE * 2) + 1;
            const wmax = WIDTH - WINSIZE - 1;
            const hmax = HEIGHT - WINSIZE - 1;

            this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
                let T = 0;
                let n = 0;

                eachAddress(address => {
                    const {gradT} = this._grads(address);
                    T += gradT / 0xff;
                    n += 1;
                });

                T /= n;

                eachAddress(address => {
                    buffer[address] = (0xff << 24) +
                        (((((T * 0x7f) | 0) + 0x80) << 16) & 0xff0000);
                });
            });
        } else if (this.output === OUTPUT.C) {
            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                const {gradX, gradY, gradT} = this._grads(address);
                buffer[address] =
                    (0xff << 24) +
                    (((Math.sqrt(gradY * gradT) * 0x0f) & 0xff) << 8) +
                    ((Math.sqrt(gradX * gradT) * 0x0f) & 0xff);
            });
        }
        if (this.output === OUTPUT.C_CELL) {
            const winStep = (WINSIZE * 2) + 1;
            const wmax = WIDTH - WINSIZE - 1;
            const hmax = HEIGHT - WINSIZE - 1;

            this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
                let {C2, C1} = this._components(eachAddress);

                C2 = Math.sqrt(C2);
                C1 = Math.sqrt(C1);

                eachAddress(address => {
                    buffer[address] =
                        (0xff << 24) +
                        ((C1 & 0xff) << 8) +
                        ((C2 & 0xff) << 0);
                });
            });
        } else if (this.output === OUTPUT.AB) {
            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                const {gradX, gradY} = this._grads(address);
                buffer[address] =
                    (0xff << 24) +
                    (((gradX * gradY) & 0xff) << 16) +
                    (((gradY * gradY) & 0xff) << 8) +
                    ((gradX * gradX) & 0xff);
            });
        }
        if (this.output === OUTPUT.AB_CELL) {
            const winStep = (WINSIZE * 2) + 1;
            const wmax = WIDTH - WINSIZE - 1;
            const hmax = HEIGHT - WINSIZE - 1;

            this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
                let {A2, A1B2, B1} = this._components(eachAddress);

                A2 = Math.sqrt(A2);
                A1B2 = Math.sqrt(A1B2);
                B1 = Math.sqrt(B1);

                eachAddress(address => {
                    buffer[address] =
                        (0xff << 24) +
                        ((A1B2 & 0xff) << 16) +
                        ((B1 & 0xff) << 8) +
                        (A2 & 0xff);
                });
            });
        } else if (this.output === OUTPUT.UV) {
            const winStep = (WINSIZE * 2) + 1;

            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                const {A2, A1B2, B1, C2, C1} = this._components(fn => fn(address));
                const {u, v} = motionVector(A2, A1B2, B1, C2, C1);

                const inRange = (-winStep < u && u < winStep && -winStep < v && v < winStep);
                const hypot = Math.hypot(u, v);
                const amount = AMOUNT_SCALE * hypot;

                buffer[address] =
                    (0xff << 24) +
                    (inRange && amount > THRESHOLD ?
                        (((((v / winStep) + 1) / 2 * 0xff) << 8) & 0xff00) +
                        (((((u / winStep) + 1) / 2 * 0xff) << 0) & 0xff) :
                        0x8080
                    );
            });
        } else if (this.output === OUTPUT.UV_CELL) {
            const winStep = (WINSIZE * 2) + 1;
            const wmax = WIDTH - WINSIZE - 1;
            const hmax = HEIGHT - WINSIZE - 1;

            this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
                const {A2, A1B2, B1, C2, C1} = this._components(eachAddress);
                const {u, v} = motionVector(A2, A1B2, B1, C2, C1);

                const inRange = (-winStep < u && u < winStep && -winStep < v && v < winStep);
                const hypot = Math.hypot(u, v);
                const amount = AMOUNT_SCALE * hypot;

                eachAddress(address => {
                    buffer[address] =
                        (0xff << 24) +
                        (inRange && amount > THRESHOLD ?
                            (((((v / winStep) + 1) / 2 * 0xff) << 8) & 0xff00) +
                            (((((u / winStep) + 1) / 2 * 0xff) << 0) & 0xff) :
                            0x8080
                        );
                });
            });
        }

        const data = new ImageData(new Uint8ClampedArray(this.buffer.buffer), WIDTH, HEIGHT);
        this.context.putImageData(data, 0, 0);
    }
}

module.exports = VideoMotionView;
