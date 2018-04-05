var VirtualMachine =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 363);
/******/ })
/************************************************************************/
/******/ ({

/***/ 2:
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ 363:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

module.exports = global["Scratch3MotionDetect"] = __webpack_require__(364);
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),

/***/ 364:
/***/ (function(module, exports, __webpack_require__) {

const VideoMotion = __webpack_require__(49);
const VideoMotionView = __webpack_require__(365);

module.exports = {
    VideoMotion,
    VideoMotionView
};


/***/ }),

/***/ 365:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WIDTH = 480;
var HEIGHT = 360;
var WINSIZE = 8;
var AMOUNT_SCALE = 100;
var THRESHOLD = 10;

var OUTPUT = {
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

var VideoMotionView = function () {
    function VideoMotionView(motion) {
        var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : OUTPUT.XYT;

        _classCallCheck(this, VideoMotionView);

        this.motion = motion;

        var canvas = this.canvas = document.createElement('canvas');
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        this.context = canvas.getContext('2d');

        this.output = output;
        this.buffer = new Uint32Array(WIDTH * HEIGHT);
    }

    _createClass(VideoMotionView, [{
        key: '_eachAddress',
        value: function _eachAddress(xStart, yStart, xStop, yStop, fn) {
            for (var i = yStart; i < yStop; i++) {
                for (var j = xStart; j < xStop; j++) {
                    var address = i * WIDTH + j;
                    fn(address, j, i);
                }
            }
        }
    }, {
        key: '_eachCell',
        value: function _eachCell(xStart, yStart, xStop, yStop, xStep, yStep, fn) {
            var _this = this;

            var xStep2 = xStep / 2 | 0;
            var yStep2 = yStep / 2 | 0;

            var _loop = function _loop(i) {
                var _loop2 = function _loop2(j) {
                    fn(function (_fn) {
                        return _this._eachAddress(j - xStep2 - 1, i - yStep2 - 1, j + xStep2, i + yStep2, _fn);
                    }, j - xStep2 - 1, i - yStep2 - 1, j + xStep2, i + yStep2);
                };

                for (var j = xStart; j < xStop; j += xStep) {
                    _loop2(j);
                }
            };

            for (var i = yStart; i < yStop; i += yStep) {
                _loop(i);
            }
        }
    }, {
        key: '_grads',
        value: function _grads(address) {
            var _motion = this.motion,
                curr = _motion.curr,
                prev = _motion.prev;

            var gradX = (curr[address - 1] & 0xff) - (curr[address + 1] & 0xff);
            var gradY = (curr[address - WIDTH] & 0xff) - (curr[address + WIDTH] & 0xff);
            var gradT = (prev[address] & 0xff) - (curr[address] & 0xff);
            return { gradX: gradX, gradY: gradY, gradT: gradT };
        }
    }, {
        key: 'draw',
        value: function draw() {
            var _this2 = this;

            if (!(this.motion.prev && this.motion.curr)) {
                return;
            }

            var buffer = this.buffer;


            if (this.output === OUTPUT.INPUT) {
                var curr = this.motion.curr;

                this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
                    buffer[address] = curr[address];
                });
            }
            if (this.output === OUTPUT.XYT) {
                this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
                    var _grads2 = _this2._grads(address),
                        gradX = _grads2.gradX,
                        gradY = _grads2.gradY,
                        gradT = _grads2.gradT;

                    var over1 = gradT / 0xcf;
                    buffer[address] = (0xff << 24) + (Math.floor(((gradY * over1 & 0xff) + 0xff) / 2) << 8) + Math.floor(((gradX * over1 & 0xff) + 0xff) / 2);
                });
            }
            if (this.output === OUTPUT.XYT_CELL) {
                var winStep = WINSIZE * 2 + 1;
                var wmax = WIDTH - WINSIZE - 1;
                var hmax = HEIGHT - WINSIZE - 1;

                this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, function (eachAddress) {
                    var C1 = 0;
                    var C2 = 0;
                    var n = 0;

                    eachAddress(function (address) {
                        var _grads3 = _this2._grads(address),
                            gradX = _grads3.gradX,
                            gradY = _grads3.gradY,
                            gradT = _grads3.gradT;

                        C2 += Math.max(Math.min(gradX / 0x0f, 1), -1) * (gradT / 0xff);
                        C1 += Math.max(Math.min(gradY / 0x0f, 1), -1) * (gradT / 0xff);
                        n += 1;
                    });

                    C1 /= n;
                    C2 /= n;
                    C1 = Math.log(C1 + 1 * Math.sign(C1)) / Math.log(2);
                    C2 = Math.log(C2 + 1 * Math.sign(C2)) / Math.log(2);

                    eachAddress(function (address) {
                        buffer[address] = (0xff << 24) + ((C1 * 0x7f | 0) + 0x80 << 8 & 0xff00) + ((C2 * 0x7f | 0) + 0x80 << 0 & 0xff);
                    });
                });
            }
            if (this.output === OUTPUT.XY) {
                this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
                    var _grads4 = _this2._grads(address),
                        gradX = _grads4.gradX,
                        gradY = _grads4.gradY;

                    buffer[address] = (0xff << 24) + ((gradY + 0xff) / 2 << 8) + (gradX + 0xff) / 2;
                });
            }
            if (this.output === OUTPUT.XY_CELL) {
                var _winStep = WINSIZE * 2 + 1;
                var _wmax = WIDTH - WINSIZE - 1;
                var _hmax = HEIGHT - WINSIZE - 1;

                this._eachCell(WINSIZE + 1, WINSIZE + 1, _wmax, _hmax, _winStep, _winStep, function (eachAddress) {
                    var C1 = 0;
                    var C2 = 0;
                    var n = 0;

                    eachAddress(function (address) {
                        var _grads5 = _this2._grads(address),
                            gradX = _grads5.gradX,
                            gradY = _grads5.gradY;

                        C2 += Math.max(Math.min(gradX / 0x1f, 1), -1);
                        C1 += Math.max(Math.min(gradY / 0x1f, 1), -1);
                        n += 1;
                    });

                    C1 /= n;
                    C2 /= n;
                    C1 = Math.log(C1 + 1 * Math.sign(C1)) / Math.log(2);
                    C2 = Math.log(C2 + 1 * Math.sign(C2)) / Math.log(2);

                    eachAddress(function (address) {
                        buffer[address] = (0xff << 24) + ((C1 * 0x7f | 0) + 0x80 << 8 & 0xff00) + ((C2 * 0x7f | 0) + 0x80 << 0 & 0xff);
                    });
                });
            } else if (this.output === OUTPUT.T) {
                this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
                    var _grads6 = _this2._grads(address),
                        gradT = _grads6.gradT;

                    buffer[address] = (0xff << 24) + ((gradT + 0xff) / 2 << 16);
                });
            }
            if (this.output === OUTPUT.T_CELL) {
                var _winStep2 = WINSIZE * 2 + 1;
                var _wmax2 = WIDTH - WINSIZE - 1;
                var _hmax2 = HEIGHT - WINSIZE - 1;

                this._eachCell(WINSIZE + 1, WINSIZE + 1, _wmax2, _hmax2, _winStep2, _winStep2, function (eachAddress) {
                    var T = 0;
                    var n = 0;

                    eachAddress(function (address) {
                        var _grads7 = _this2._grads(address),
                            gradT = _grads7.gradT;

                        T += gradT / 0xff;
                        n += 1;
                    });

                    T /= n;

                    eachAddress(function (address) {
                        buffer[address] = (0xff << 24) + ((T * 0x7f | 0) + 0x80 << 16 & 0xff0000);
                    });
                });
            } else if (this.output === OUTPUT.C) {
                this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
                    var _grads8 = _this2._grads(address),
                        gradX = _grads8.gradX,
                        gradY = _grads8.gradY,
                        gradT = _grads8.gradT;

                    buffer[address] = (0xff << 24) + (gradY * gradT << 8) + gradX * gradT;
                });
            } else if (this.output === OUTPUT.AB) {
                this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
                    var _grads9 = _this2._grads(address),
                        gradX = _grads9.gradX,
                        gradY = _grads9.gradY;

                    buffer[address] = (0xff << 24) + (gradX * gradY << 16) + (gradY * gradY << 8) + gradX * gradX;
                });
            } else if (this.output === OUTPUT.UV) {
                var _winStep3 = WINSIZE * 2 + 1;
                var _wmax3 = WIDTH - WINSIZE - 1;
                var _hmax3 = HEIGHT - WINSIZE - 1;

                this._eachCell(WINSIZE + 1, WINSIZE + 1, _wmax3, _hmax3, _winStep3, _winStep3, function (eachAddress) {
                    var A2 = 0;
                    var A1B2 = 0;
                    var B1 = 0;
                    var C2 = 0;
                    var C1 = 0;

                    eachAddress(function (address) {
                        var _grads10 = _this2._grads(address),
                            gradX = _grads10.gradX,
                            gradY = _grads10.gradY,
                            gradT = _grads10.gradT;

                        A2 += gradX * gradX;
                        A1B2 += gradX * gradY;
                        B1 += gradY * gradY;
                        C2 += gradX * gradT;
                        C1 += gradY * gradT;
                    });

                    var delta = A1B2 * A1B2 - A2 * B1;
                    var u = 0;
                    var v = 0;
                    if (delta) {
                        /* system is not singular - solving by Kramer method */
                        var deltaX = -(C1 * A1B2 - C2 * B1);
                        var deltaY = -(A1B2 * C2 - A2 * C1);
                        var Idelta = 8 / delta;
                        u = deltaX * Idelta;
                        v = deltaY * Idelta;
                    } else {
                        /* singular system - find optical flow in gradient direction */
                        var Norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
                        if (Norm) {
                            var IGradNorm = 8 / Norm;
                            var temp = -(C1 + C2) * IGradNorm;
                            u = (A1B2 + A2) * temp;
                            v = (B1 + A1B2) * temp;
                        }
                    }

                    var inRange = -_winStep3 < u && u < _winStep3 && -_winStep3 < v && v < _winStep3;
                    var hypot = Math.hypot(u, v);
                    var amount = AMOUNT_SCALE * hypot;
                    eachAddress(function (address) {
                        buffer[address] = (0xff << 24) + (inRange && amount > THRESHOLD ? ((v / _winStep3 + 1) / 2 * 0xff << 8 & 0xff00) + ((u / _winStep3 + 1) / 2 * 0xff << 0 & 0xff) : 0x8080);
                    });
                });
            }

            var data = new ImageData(new Uint8ClampedArray(this.buffer.buffer), WIDTH, HEIGHT);
            this.context.putImageData(data, 0, 0);
        }
    }], [{
        key: 'OUTPUT',
        get: function get() {
            return OUTPUT;
        }
    }]);

    return VideoMotionView;
}();

module.exports = VideoMotionView;

/***/ }),

/***/ 49:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * lib.js
 *
 * Tony Hwang and John Maloney, January 2011
 * Michael "Z" Goddard, March 2018
 *
 * Video motion sensing primitives.
 */

var TO_DEGREE = 180 / Math.PI;
var WIDTH = 480;
var HEIGHT = 360;
// chosen empirically to give a range of roughly 0-100
var AMOUNT_SCALE = 100;
// note 2e-4 * activePixelNum is an experimentally tuned threshold for my
// logitech Pro 9000 webcam - TTH
var LOCAL_AMOUNT_SCALE = AMOUNT_SCALE * 2e-4;
var THRESHOLD = 10;
var WINSIZE = 8;
var LOCAL_MAX_AMOUNT = 100;
var LOCAL_THRESHOLD = THRESHOLD / 3;

var STATE_KEY = 'Scratch.videoSensing';

var VideoMotion = function () {
    function VideoMotion() {
        _classCallCheck(this, VideoMotion);

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

    _createClass(VideoMotion, [{
        key: 'reset',
        value: function reset() {
            this.prev = this.curr = null;
            this.motionAmount = this.motionDirection = 0;
            this.analysisDone = true;

            var targets = this.runtime.targets;
            for (var i = 0; i < targets.length; i++) {
                targets[i].getCustomState(STATE_KEY).motionAmount = 0;
                targets[i].getCustomState(STATE_KEY).motionDirection = 0;
            }
        }
    }, {
        key: 'addFrame',
        value: function addFrame(source) {
            this.frameNumber++;

            this.prev = this.curr;
            this.curr = new Uint32Array(source.buffer.slice());

            var _tmp = this._prev;
            this._prev = this._curr;
            this._curr = _tmp;
            for (var i = 0; i < this.curr.length; i++) {
                this._curr[i] = this.curr[i] & 0xff;
            }

            this.analysisDone = false;
        }
    }, {
        key: 'analyzeFrame',
        value: function analyzeFrame() {
            if (!this.curr || !this.prev) {
                this.motionAmount = this.motionDirection = -1;
                // don't have two frames to analyze yet
                return;
            }

            var curr = this._curr,
                prev = this._prev;


            var winStep = WINSIZE * 2 + 1;
            var wmax = WIDTH - WINSIZE - 1;
            var hmax = HEIGHT - WINSIZE - 1;

            var uu = 0;
            var vv = 0;
            var n = 0;

            for (var i = WINSIZE + 1; i < hmax; i += winStep) {
                for (var j = WINSIZE + 1; j < wmax; j += winStep) {
                    var A2 = 0;
                    var A1B2 = 0;
                    var B1 = 0;
                    var C1 = 0;
                    var C2 = 0;

                    var address = (i - WINSIZE) * WIDTH + j - WINSIZE;
                    var nextAddress = address + winStep;
                    var maxAddress = (i + WINSIZE) * WIDTH + j + WINSIZE;
                    for (; address <= maxAddress; address += WIDTH - winStep, nextAddress += WIDTH) {
                        for (; address <= nextAddress; address += 1) {
                            var gradT = prev[address] - curr[address];
                            var gradX = curr[address - 1] - curr[address + 1];
                            var gradY = curr[address - WIDTH] - curr[address + WIDTH];

                            A2 += gradX * gradX;
                            A1B2 += gradX * gradY;
                            B1 += gradY * gradY;
                            C2 += gradX * gradT;
                            C1 += gradY * gradT;
                        }
                    }

                    var delta = A1B2 * A1B2 - A2 * B1;
                    var u = 0;
                    var v = 0;
                    if (delta) {
                        // system is not singular - solving by Kramer method
                        var deltaX = -(C1 * A1B2 - C2 * B1);
                        var deltaY = -(A1B2 * C2 - A2 * C1);
                        var Idelta = 8 / delta;
                        u = deltaX * Idelta;
                        v = deltaY * Idelta;
                    } else {
                        // singular system - find optical flow in gradient direction
                        var Norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
                        if (Norm) {
                            var IGradNorm = 8 / Norm;
                            var temp = -(C1 + C2) * IGradNorm;
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
                this.motionDirection = (Math.atan2(vv, uu) * TO_DEGREE + 270) % 360 - 180;
            }
            this.analysisDone = true;
        }
    }, {
        key: 'getLocalMotion',
        value: function getLocalMotion(drawable, state) {
            if (!this.curr || !this.prev) {
                state.motionAmount = state.motionDirection = -1;
                // don't have two frames to analyze yet
                return;
            }
            if (state.motionFrameNumber !== this.frameNumber) {
                var prev = this._prev,
                    curr = this._curr;


                var boundingRect = drawable.getFastBounds();
                var xmin = Math.floor(boundingRect.left + WIDTH / 2);
                var xmax = Math.floor(boundingRect.right + WIDTH / 2);
                var ymin = Math.floor(HEIGHT / 2 - boundingRect.top);
                var ymax = Math.floor(HEIGHT / 2 - boundingRect.bottom);

                var A2 = 0;
                var A1B2 = 0;
                var B1 = 0;
                var C1 = 0;
                var C2 = 0;
                var scaleFactor = 0;

                var position = [0, 0, 0];

                for (var i = ymin; i < ymax; i++) {
                    for (var j = xmin; j < xmax; j++) {
                        position[0] = j - WIDTH / 2;
                        position[1] = HEIGHT / 2 - i;
                        if (j > 0 && j < WIDTH - 1 && i > 0 && i < HEIGHT - 1 && drawable.isTouching(position)) {
                            var address = i * WIDTH + j;
                            var gradT = prev[address] - curr[address];
                            var gradX = curr[address - 1] - curr[address + 1];
                            var gradY = curr[address - WIDTH] - curr[address + WIDTH];

                            A2 += gradX * gradX;
                            A1B2 += gradX * gradY;
                            B1 += gradY * gradY;
                            C2 += gradX * gradT;
                            C1 += gradY * gradT;
                            scaleFactor++;
                        }
                    }
                }

                var delta = A1B2 * A1B2 - A2 * B1;
                var u = 0;
                var v = 0;
                if (delta) {
                    // system is not singular - solving by Kramer method
                    var deltaX = -(C1 * A1B2 - C2 * B1);
                    var deltaY = -(A1B2 * C2 - A2 * C1);
                    var Idelta = 8 / delta;
                    u = deltaX * Idelta;
                    v = deltaY * Idelta;
                } else {
                    // singular system - find optical flow in gradient direction
                    var Norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
                    if (Norm) {
                        var IGradNorm = 8 / Norm;
                        var temp = -(C1 + C2) * IGradNorm;
                        u = (A1B2 + A2) * temp;
                        v = (B1 + A1B2) * temp;
                    }
                }

                var activePixelNum = 0;
                if (scaleFactor) {
                    // store the area of the sprite in pixels
                    activePixelNum = scaleFactor;
                    scaleFactor /= 2 * WINSIZE * 2 * WINSIZE;

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
                    state.motionDirection = (Math.atan2(v, u) * TO_DEGREE + 270) % 360 - 180;
                }
                state.motionFrameNumber = this.frameNumber;
            }
        }
    }]);

    return VideoMotion;
}();

module.exports = VideoMotion;

/***/ })

/******/ });
//# sourceMappingURL=motion-extension.js.map