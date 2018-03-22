const WIDTH = 480;
const HEIGHT = 360;
const WINSIZE = 8;
const AMOUNT_SCALE = 100;
const THRESHOLD = 10;

const OUTPUT = {
    INPUT: -1,
    XYT: 0,
    XYT_CELL: 1,
    XY: 2,
    XY_CELL: 3,
    T: 4,
    T_CELL: 5,
    C: 6,
    AB: 7,
    UV: 8
};

class VideoMotionView {
    constructor (motion, output = OUTPUT.XYT) {
        this.motion = motion;

        const canvas = this.canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        this.context = canvas.getContext('2d');

        this.output = output;
        this.buffer = new Uint32Array(WIDTH * HEIGHT);
    }

    static get OUTPUT () {
        return OUTPUT;
    }

    _eachAddress (xStart, yStart, xStop, yStop, fn) {
        for (let i = yStart; i < yStop; i++) {
            for (let j = xStart; j < xStop; j++) {
                const address = (i * WIDTH) + j;
                fn(address, j, i);
            }
        }
    }

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

    _grads (address) {
        const {curr, prev} = this.motion;
        const gradX = (curr[address - 1] & 0xff) - (curr[address + 1] & 0xff);
        const gradY = (curr[address - WIDTH] & 0xff) - (curr[address + WIDTH] & 0xff);
        const gradT = (prev[address] & 0xff) - (curr[address] & 0xff);
        return {gradX, gradY, gradT};
    }

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
                    ((gradY * gradT) << 8) +
                    (gradX * gradT);
            });
        } else if (this.output === OUTPUT.AB) {
            this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
                const {gradX, gradY} = this._grads(address);
                buffer[address] =
                    (0xff << 24) +
                    ((gradX * gradY) << 16) +
                    ((gradY * gradY) << 8) +
                    (gradX * gradX);
            });
        } else if (this.output === OUTPUT.UV) {
            const winStep = (WINSIZE * 2) + 1;
            const wmax = WIDTH - WINSIZE - 1;
            const hmax = HEIGHT - WINSIZE - 1;

            this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
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

                const delta = ((A1B2 * A1B2) - (A2 * B1));
                let u = 0;
                let v = 0;
                if (delta) {
                    /* system is not singular - solving by Kramer method */
                    const deltaX = -((C1 * A1B2) - (C2 * B1));
                    const deltaY = -((A1B2 * C2) - (A2 * C1));
                    const Idelta = 8 / delta;
                    u = deltaX * Idelta;
                    v = deltaY * Idelta;
                } else {
                    /* singular system - find optical flow in gradient direction */
                    const Norm = ((A1B2 + A2) * (A1B2 + A2)) + ((B1 + A1B2) * (B1 + A1B2));
                    if (Norm) {
                        const IGradNorm = 8 / Norm;
                        const temp = -(C1 + C2) * IGradNorm;
                        u = (A1B2 + A2) * temp;
                        v = (B1 + A1B2) * temp;
                    }
                }

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
