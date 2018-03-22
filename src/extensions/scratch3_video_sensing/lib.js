/**
 * lib.js
 *
 * Tony Hwang and John Maloney, January 2011
 * Michael "Z" Goddard, March 2018
 *
 * Video motion sensing primitives.
 */

const TO_DEGREE = 180 / Math.PI;
const WIDTH = 480;
const HEIGHT = 360;
// chosen empirically to give a range of roughly 0-100
const AMOUNT_SCALE = 100;
// note 2e-4 * activePixelNum is an experimentally tuned threshold for my
// logitech Pro 9000 webcam - TTH
const LOCAL_AMOUNT_SCALE = AMOUNT_SCALE * 2e-4;
const THRESHOLD = 10;
const WINSIZE = 8;
const LOCAL_MAX_AMOUNT = 100;
const LOCAL_THRESHOLD = THRESHOLD / 3;

const STATE_KEY = 'Scratch.videoSensing';

class VideoMotion {
    constructor () {
        this.frameNumber = 0;
        this.motionAmount = 0;
        this.motionDirection = 0;
        this.analysisDone = false;

        this.curr = null;
        this.prev = null;

        this._arrays = new ArrayBuffer(WIDTH * HEIGHT * 2 * 1);
        this._curr = new Uint8ClampedArray(this._arrays, WIDTH * HEIGHT * 0 * 1, WIDTH * HEIGHT);
        this._prev = new Uint8ClampedArray(this._arrays, WIDTH * HEIGHT * 1 * 1, WIDTH * HEIGHT);
    }

    reset () {
        this.prev = this.curr = null;
        this.motionAmount = this.motionDirection = 0;
        this.analysisDone = true;

        const targets = this.runtime.targets;
        for (let i = 0; i < targets.length; i++) {
            targets[i].getCustomState(STATE_KEY).motionAmount = 0;
            targets[i].getCustomState(STATE_KEY).motionDirection = 0;
        }
    }

    addFrame (source) {
        this.frameNumber++;

        this.prev = this.curr;
        this.curr = new Uint32Array(source.buffer.slice());

        const _tmp = this._prev;
        this._prev = this._curr;
        this._curr = _tmp;
        for (let i = 0; i < this.curr.length; i++) {
            this._curr[i] = this.curr[i] & 0xff;
        }

        this.analysisDone = false;
    }

    analyzeFrame () {
        if (!this.curr || !this.prev) {
            this.motionAmount = this.motionDirection = -1;
            // don't have two frames to analyze yet
            return;
        }

        const {
            _curr: curr,
            _prev: prev
        } = this;

        const winStep = (WINSIZE * 2) + 1;
        const wmax = WIDTH - WINSIZE - 1;
        const hmax = HEIGHT - WINSIZE - 1;

        let uu = 0;
        let vv = 0;
        let n = 0;

        for (let i = WINSIZE + 1; i < hmax; i += winStep) {
            for (let j = WINSIZE + 1; j < wmax; j += winStep) {
                let A2 = 0;
                let A1B2 = 0;
                let B1 = 0;
                let C1 = 0;
                let C2 = 0;

                let address = ((i - WINSIZE) * WIDTH) + j - WINSIZE;
                let nextAddress = address + winStep;
                const maxAddress = ((i + WINSIZE) * WIDTH) + j + WINSIZE;
                for (; address <= maxAddress; address += WIDTH - winStep, nextAddress += WIDTH) {
                    for (; address <= nextAddress; address += 1) {
                        const gradT = ((prev[address]) - (curr[address]));
                        const gradX = ((curr[address - 1]) - (curr[address + 1]));
                        const gradY = ((curr[address - WIDTH]) - (curr[address + WIDTH]));

                        A2 += gradX * gradX;
                        A1B2 += gradX * gradY;
                        B1 += gradY * gradY;
                        C2 += gradX * gradT;
                        C1 += gradY * gradT;
                    }
                }

                const delta = ((A1B2 * A1B2) - (A2 * B1));
                let u = 0;
                let v = 0;
                if (delta) {
                    // system is not singular - solving by Kramer method
                    const deltaX = -((C1 * A1B2) - (C2 * B1));
                    const deltaY = -((A1B2 * C2) - (A2 * C1));
                    const Idelta = 8 / delta;
                    u = deltaX * Idelta;
                    v = deltaY * Idelta;
                } else {
                    // singular system - find optical flow in gradient direction
                    const Norm = ((A1B2 + A2) * (A1B2 + A2)) + ((B1 + A1B2) * (B1 + A1B2));
                    if (Norm) {
                        const IGradNorm = 8 / Norm;
                        const temp = -(C1 + C2) * IGradNorm;
                        u = (A1B2 + A2) * temp;
                        v = (B1 + A1B2) * temp;
                    }
                }

                if (-winStep < u && u < winStep && -winStep < v && v < winStep) {
                    uu += u;
                    vv += v;
                    n++;
                }
            }
        }

        uu /= n;
        vv /= n;
        this.motionAmount = Math.round(AMOUNT_SCALE * Math.hypot(uu, vv));
        if (this.motionAmount > THRESHOLD) {
            // Scratch direction
            this.motionDirection = (((Math.atan2(vv, uu) * TO_DEGREE) + 270) % 360) - 180;
        }
        this.analysisDone = true;
    }

    getLocalMotion (drawable, state) {
        if (!this.curr || !this.prev) {
            state.motionAmount = state.motionDirection = -1;
            // don't have two frames to analyze yet
            return;
        }
        if (state.motionFrameNumber !== this.frameNumber) {
            const {
                _prev: prev,
                _curr: curr
            } = this;

            const boundingRect = drawable.getFastBounds();
            const xmin = Math.floor(boundingRect.left + (WIDTH / 2));
            const xmax = Math.floor(boundingRect.right + (WIDTH / 2));
            const ymin = Math.floor((HEIGHT / 2) - boundingRect.top);
            const ymax = Math.floor((HEIGHT / 2) - boundingRect.bottom);

            let A2 = 0;
            let A1B2 = 0;
            let B1 = 0;
            let C1 = 0;
            let C2 = 0;
            let scaleFactor = 0;

            const position = [0, 0, 0];

            for (let i = ymin; i < ymax; i++) {
                for (let j = xmin; j < xmax; j++) {
                    position[0] = j - (WIDTH / 2);
                    position[1] = (HEIGHT / 2) - i;
                    if (
                        j > 0 && (j < WIDTH - 1) &&
                        i > 0 && (i < HEIGHT - 1) &&
                        drawable.isTouching(position)
                    ) {
                        const address = (i * WIDTH) + j;
                        const gradT = ((prev[address]) - (curr[address]));
                        const gradX = ((curr[address - 1]) - (curr[address + 1]));
                        const gradY = ((curr[address - WIDTH]) - (curr[address + WIDTH]));

                        A2 += gradX * gradX;
                        A1B2 += gradX * gradY;
                        B1 += gradY * gradY;
                        C2 += gradX * gradT;
                        C1 += gradY * gradT;
                        scaleFactor++;
                    }
                }
            }

            const delta = ((A1B2 * A1B2) - (A2 * B1));
            let u = 0;
            let v = 0;
            if (delta) {
                // system is not singular - solving by Kramer method
                const deltaX = -((C1 * A1B2) - (C2 * B1));
                const deltaY = -((A1B2 * C2) - (A2 * C1));
                const Idelta = 8 / delta;
                u = deltaX * Idelta;
                v = deltaY * Idelta;
            } else {
                // singular system - find optical flow in gradient direction
                const Norm = ((A1B2 + A2) * (A1B2 + A2)) + ((B1 + A1B2) * (B1 + A1B2));
                if (Norm) {
                    const IGradNorm = 8 / Norm;
                    const temp = -(C1 + C2) * IGradNorm;
                    u = (A1B2 + A2) * temp;
                    v = (B1 + A1B2) * temp;
                }
            }

            let activePixelNum = 0;
            if (scaleFactor) {
                // store the area of the sprite in pixels
                activePixelNum = scaleFactor;
                scaleFactor /= (2 * WINSIZE * 2 * WINSIZE);

                u = u / scaleFactor;
                v = v / scaleFactor;
            }

            state.motionAmount = Math.round(LOCAL_AMOUNT_SCALE * activePixelNum * Math.hypot(u, v));
            if (state.motionAmount > LOCAL_MAX_AMOUNT) {
                // clip all magnitudes greater than 100
                state.motionAmount = LOCAL_MAX_AMOUNT;
            }
            if (state.motionAmount > LOCAL_THRESHOLD) {
                // Scratch direction
                state.motionDirection = (((Math.atan2(v, u) * TO_DEGREE) + 270) % 360) - 180;
            }
            state.motionFrameNumber = this.frameNumber;
        }
    }
}

module.exports = VideoMotion;
