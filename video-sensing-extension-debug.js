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
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/extensions/scratch3_video_sensing/debug.js-exposed");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/debug.js":
/*!********************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/debug.js ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/**
 * A debug "index" module exporting VideoMotion and VideoMotionView to debug
 * VideoMotion directly.
 * @file debug.js
 */

const VideoMotion = __webpack_require__(/*! ./library */ "./src/extensions/scratch3_video_sensing/library.js");
const VideoMotionView = __webpack_require__(/*! ./view */ "./src/extensions/scratch3_video_sensing/view.js");

module.exports = {
    VideoMotion,
    VideoMotionView
};


/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/debug.js-exposed":
/*!****************************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/debug.js-exposed ***!
  \****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {module.exports = global["Scratch3VideoSensingDebug"] = __webpack_require__(/*! -!./debug.js */ "./src/extensions/scratch3_video_sensing/debug.js");
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../../node_modules/webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/library.js":
/*!**********************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/library.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * @file library.js
 *
 * Tony Hwang and John Maloney, January 2011
 * Michael "Z" Goddard, March 2018
 *
 * Video motion sensing primitives.
 */
var _require = __webpack_require__(/*! ./math */ "./src/extensions/scratch3_video_sensing/math.js"),
    motionVector = _require.motionVector,
    scratchAtan2 = _require.scratchAtan2;
/**
 * The width of the intended resolution to analyze for motion.
 * @type {number}
 */


var WIDTH = 480;
/**
 * The height of the intended resolution to analyze for motion.
 * @type {number}
 */

var HEIGHT = 360;
/**
 * A constant value to scale the magnitude of the x and y components called u
 * and v. This creates the motionAmount value.
 *
 * Old note: chosen empirically to give a range of roughly 0-100
 *
 * @type {number}
 */

var AMOUNT_SCALE = 100;
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

var LOCAL_AMOUNT_SCALE = AMOUNT_SCALE * 2e-4;
/**
 * The motion amount must be higher than the THRESHOLD to calculate a new
 * direction value.
 * @type {number}
 */

var THRESHOLD = 10;
/**
 * The size of the radius of the window of summarized values when considering
 * the motion inside the full resolution of the sample.
 * @type {number}
 */

var WINSIZE = 8;
/**
 * A ceiling for the motionAmount stored to a local target's motion state. The
 * motionAmount is not allowed to be larger than LOCAL_MAX_AMOUNT.
 * @type {number}
 */

var LOCAL_MAX_AMOUNT = 100;
/**
 * The motion amount for a target's local motion must be higher than the
 * LOCAL_THRESHOLD to calculate a new direction value.
 * @type {number}
 */

var LOCAL_THRESHOLD = THRESHOLD / 3;
/**
 * Store the necessary image pixel data to compares frames of a video and
 * detect an amount and direction of motion in the full sample or in a
 * specified area.
 * @constructor
 */

var VideoMotion = /*#__PURE__*/function () {
  function VideoMotion() {
    _classCallCheck(this, VideoMotion);

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


  _createClass(VideoMotion, [{
    key: "reset",
    value: function reset() {
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

  }, {
    key: "addFrame",
    value: function addFrame(source) {
      this.frameNumber++; // Swap curr to prev.

      this.prev = this.curr; // Create a clone of the array so any modifications made to the source
      // array do not affect the work done in here.

      this.curr = new Uint32Array(source.buffer.slice(0)); // Swap _prev and _curr. Copy one of the color components of the new
      // array into _curr overwriting what was the old _prev data.

      var _tmp = this._prev;
      this._prev = this._curr;
      this._curr = _tmp;

      for (var i = 0; i < this.curr.length; i++) {
        this._curr[i] = this.curr[i] & 0xff;
      }
    }
    /**
     * Analyze the current frame against the previous frame determining the
     * amount of motion and direction of the motion.
     */

  }, {
    key: "analyzeFrame",
    value: function analyzeFrame() {
      if (!this.curr || !this.prev) {
        this.motionAmount = this.motionDirection = -1; // Don't have two frames to analyze yet

        return;
      } // Return early if new data has not been received.


      if (this.lastAnalyzedFrame === this.frameNumber) {
        return;
      }

      this.lastAnalyzedFrame = this.frameNumber;
      var curr = this._curr,
          prev = this._prev;
      var winStep = WINSIZE * 2 + 1;
      var wmax = WIDTH - WINSIZE - 1;
      var hmax = HEIGHT - WINSIZE - 1; // Accumulate 2d motion vectors from groups of pixels and average it
      // later.

      var uu = 0;
      var vv = 0;
      var n = 0; // Iterate over groups of cells building up the components to determine
      // a motion vector for each cell instead of the whole frame to avoid
      // integer overflows.

      for (var i = WINSIZE + 1; i < hmax; i += winStep) {
        for (var j = WINSIZE + 1; j < wmax; j += winStep) {
          var A2 = 0;
          var A1B2 = 0;
          var B1 = 0;
          var C1 = 0;
          var C2 = 0; // This is a performance critical math region.

          var address = (i - WINSIZE) * WIDTH + j - WINSIZE;
          var nextAddress = address + winStep;
          var maxAddress = (i + WINSIZE) * WIDTH + j + WINSIZE;

          for (; address <= maxAddress; address += WIDTH - winStep, nextAddress += WIDTH) {
            for (; address <= nextAddress; address += 1) {
              // The difference in color between the last frame and
              // the current frame.
              var gradT = prev[address] - curr[address]; // The difference between the pixel to the left and the
              // pixel to the right.

              var gradX = curr[address - 1] - curr[address + 1]; // The difference between the pixel above and the pixel
              // below.

              var gradY = curr[address - WIDTH] - curr[address + WIDTH]; // Add the combined values of this pixel to previously
              // considered pixels.

              A2 += gradX * gradX;
              A1B2 += gradX * gradY;
              B1 += gradY * gradY;
              C2 += gradX * gradT;
              C1 += gradY * gradT;
            }
          } // Use the accumalated values from the for loop to determine a
          // motion direction.


          var _motionVector = motionVector(A2, A1B2, B1, C2, C1),
              u = _motionVector.u,
              v = _motionVector.v; // If u and v are within negative winStep to positive winStep,
          // add them to a sum that will later be averaged.


          if (-winStep < u && u < winStep && -winStep < v && v < winStep) {
            uu += u;
            vv += v;
            n++;
          }
        }
      } // Average the summed vector values of all of the motion groups.


      uu /= n;
      vv /= n; // Scale the magnitude of the averaged UV vector.

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

  }, {
    key: "getLocalMotion",
    value: function getLocalMotion(drawable, state) {
      if (!this.curr || !this.prev) {
        state.motionAmount = state.motionDirection = -1; // Don't have two frames to analyze yet

        return;
      } // Skip if the current frame has already been considered for this state.


      if (state.motionFrameNumber !== this.frameNumber) {
        var prev = this._prev,
            curr = this._curr; // The public APIs for Renderer#isTouching manage keeping the matrix and
        // silhouette up-to-date, which is needed for drawable#isTouching to work (used below)

        drawable.updateCPURenderAttributes(); // Restrict the region the amount and direction are built from to
        // the area of the current frame overlapped by the given drawable's
        // bounding box.

        var boundingRect = drawable.getFastBounds(); // Transform the bounding box from scratch space to a space from 0,
        // 0 to WIDTH, HEIGHT.

        var xmin = Math.max(Math.floor(boundingRect.left + WIDTH / 2), 1);
        var xmax = Math.min(Math.floor(boundingRect.right + WIDTH / 2), WIDTH - 1);
        var ymin = Math.max(Math.floor(HEIGHT / 2 - boundingRect.top), 1);
        var ymax = Math.min(Math.floor(HEIGHT / 2 - boundingRect.bottom), HEIGHT - 1);
        var A2 = 0;
        var A1B2 = 0;
        var B1 = 0;
        var C1 = 0;
        var C2 = 0;
        var scaleFactor = 0;
        var position = [0, 0, 0]; // This is a performance critical math region.

        for (var i = ymin; i < ymax; i++) {
          for (var j = xmin; j < xmax; j++) {
            // i and j are in a coordinate planning ranging from 0 to
            // HEIGHT and 0 to WIDTH. Transform that into Scratch's
            // range of HEIGHT / 2 to -HEIGHT / 2 and -WIDTH / 2 to
            // WIDTH / 2;
            position[0] = j - WIDTH / 2;
            position[1] = HEIGHT / 2 - i; // Consider only pixels in the drawable that can touch the
            // edge or other drawables. Empty space in the current skin
            // is skipped.

            if (drawable.isTouching(position)) {
              var address = i * WIDTH + j; // The difference in color between the last frame and
              // the current frame.

              var gradT = prev[address] - curr[address]; // The difference between the pixel to the left and the
              // pixel to the right.

              var gradX = curr[address - 1] - curr[address + 1]; // The difference between the pixel above and the pixel
              // below.

              var gradY = curr[address - WIDTH] - curr[address + WIDTH]; // Add the combined values of this pixel to previously
              // considered pixels.

              A2 += gradX * gradX;
              A1B2 += gradX * gradY;
              B1 += gradY * gradY;
              C2 += gradX * gradT;
              C1 += gradY * gradT;
              scaleFactor++;
            }
          }
        } // Use the accumalated values from the for loop to determine a
        // motion direction.


        var _motionVector2 = motionVector(A2, A1B2, B1, C2, C1),
            u = _motionVector2.u,
            v = _motionVector2.v;

        var activePixelNum = 0;

        if (scaleFactor) {
          // Store the area of the sprite in pixels
          activePixelNum = scaleFactor;
          scaleFactor /= 2 * WINSIZE * 2 * WINSIZE;
          u = u / scaleFactor;
          v = v / scaleFactor;
        } // Scale the magnitude of the averaged UV vector and the number of
        // overlapping drawable pixels.


        state.motionAmount = Math.round(LOCAL_AMOUNT_SCALE * activePixelNum * Math.hypot(u, v));

        if (state.motionAmount > LOCAL_MAX_AMOUNT) {
          // Clip all magnitudes greater than 100.
          state.motionAmount = LOCAL_MAX_AMOUNT;
        }

        if (state.motionAmount > LOCAL_THRESHOLD) {
          // Scratch direction.
          state.motionDirection = scratchAtan2(v, u);
        } // Skip future calls on this state until a new frame is added.


        state.motionFrameNumber = this.frameNumber;
      }
    }
  }]);

  return VideoMotion;
}();

module.exports = VideoMotion;

/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/math.js":
/*!*******************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/math.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * A constant value helping to transform a value in radians to degrees.
 * @type {number}
 */
var TO_DEGREE = 180 / Math.PI;
/**
 * A object reused to save on memory allocation returning u and v vector from
 * motionVector.
 * @type {UV}
 */

var _motionVectorOut = {
  u: 0,
  v: 0
};
/**
 * Determine a motion vector combinations of the color component difference on
 * the x axis, y axis, and temporal axis.
 * @param {number} A2 - a sum of x axis squared
 * @param {number} A1B2 - a sum of x axis times y axis
 * @param {number} B1 - a sum of y axis squared
 * @param {number} C2 - a sum of x axis times temporal axis
 * @param {number} C1 - a sum of y axis times temporal axis
 * @param {UV} out - optional object to store return UV info in
 * @returns {UV} a uv vector representing the motion for the given input
 */

var motionVector = function motionVector(A2, A1B2, B1, C2, C1) {
  var out = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _motionVectorOut;
  // Compare sums of X * Y and sums of X squared and Y squared.
  var delta = A1B2 * A1B2 - A2 * B1;

  if (delta) {
    // System is not singular - solving by Kramer method.
    var deltaX = -(C1 * A1B2 - C2 * B1);
    var deltaY = -(A1B2 * C2 - A2 * C1);
    var Idelta = 8 / delta;
    out.u = deltaX * Idelta;
    out.v = deltaY * Idelta;
  } else {
    // Singular system - find optical flow in gradient direction.
    var Norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);

    if (Norm) {
      var IGradNorm = 8 / Norm;
      var temp = -(C1 + C2) * IGradNorm;
      out.u = (A1B2 + A2) * temp;
      out.v = (B1 + A1B2) * temp;
    } else {
      out.u = 0;
      out.v = 0;
    }
  }

  return out;
};
/**
 * Translate an angle in degrees with the range -180 to 180 rotated to
 * Scratch's reference angle.
 * @param {number} degrees - angle in range -180 to 180
 * @returns {number} angle from Scratch's reference angle
 */


var scratchDegrees = function scratchDegrees(degrees) {
  return (degrees + 270) % 360 - 180;
};
/**
 * Get the angle of the y and x component of a 2d vector in degrees in
 * Scratch's coordinate plane.
 * @param {number} y - the y component of a 2d vector
 * @param {number} x - the x component of a 2d vector
 * @returns {number} angle in degrees in Scratch's coordinate plane
 */


var scratchAtan2 = function scratchAtan2(y, x) {
  return scratchDegrees(Math.atan2(y, x) * TO_DEGREE);
};

module.exports = {
  motionVector: motionVector,
  scratchDegrees: scratchDegrees,
  scratchAtan2: scratchAtan2
};

/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/view.js":
/*!*******************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/view.js ***!
  \*******************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = __webpack_require__(/*! ./math */ "./src/extensions/scratch3_video_sensing/math.js"),
    motionVector = _require.motionVector;

var WIDTH = 480;
var HEIGHT = 360;
var WINSIZE = 8;
var AMOUNT_SCALE = 100;
var THRESHOLD = 10;
/**
 * Modes of debug output that can be rendered.
 * @type {object}
 */

var OUTPUT = {
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

var _videoMotionViewComponentsTmp = {
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

var VideoMotionView = /*#__PURE__*/function () {
  function VideoMotionView(motion) {
    var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : OUTPUT.XYT;

    _classCallCheck(this, VideoMotionView);

    /**
     * VideoMotion instance to visualize.
     * @type {VideoMotion}
     */
    this.motion = motion;
    /**
     * Debug canvas to render to.
     * @type {HTMLCanvasElement}
     */

    var canvas = this.canvas = document.createElement('canvas');
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


  _createClass(VideoMotionView, [{
    key: "_eachAddress",
    value:
    /**
     * Iterate each pixel address location and call a function with that address.
     * @param {number} xStart - start location on the x axis of the output pixel buffer
     * @param {number} yStart - start location on the y axis of the output pixel buffer
     * @param {nubmer} xStop - location to stop at on the x axis
     * @param {number} yStop - location to stop at on the y axis
     * @param {function} fn - handle to call with each iterated address
     */
    function _eachAddress(xStart, yStart, xStop, yStop, fn) {
      for (var i = yStart; i < yStop; i++) {
        for (var j = xStart; j < xStop; j++) {
          var address = i * WIDTH + j;
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

  }, {
    key: "_eachCell",
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
    /**
     * Build horizontal, vertical, and temporal difference of a pixel address.
     * @param {number} address - address to build values for
     * @returns {object} a object with a gradX, grady, and gradT value
     */

  }, {
    key: "_grads",
    value: function _grads(address) {
      var _this$motion = this.motion,
          curr = _this$motion.curr,
          prev = _this$motion.prev;
      var gradX = (curr[address - 1] & 0xff) - (curr[address + 1] & 0xff);
      var gradY = (curr[address - WIDTH] & 0xff) - (curr[address + WIDTH] & 0xff);
      var gradT = (prev[address] & 0xff) - (curr[address] & 0xff);
      return {
        gradX: gradX,
        gradY: gradY,
        gradT: gradT
      };
    }
    /**
     * Build component values used in determining a motion vector for a pixel
     * address.
     * @param {function} eachAddress - a bound handle to _eachAddress to build
     *   component values for
     * @returns {object} a object with a A2, A1B2, B1, C2, C1 value
     */

  }, {
    key: "_components",
    value: function _components(eachAddress) {
      var _this2 = this;

      var A2 = 0;
      var A1B2 = 0;
      var B1 = 0;
      var C2 = 0;
      var C1 = 0;
      eachAddress(function (address) {
        var _this2$_grads = _this2._grads(address),
            gradX = _this2$_grads.gradX,
            gradY = _this2$_grads.gradY,
            gradT = _this2$_grads.gradT;

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

  }, {
    key: "draw",
    value: function draw() {
      var _this3 = this;

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
          var _this3$_grads = _this3._grads(address),
              gradX = _this3$_grads.gradX,
              gradY = _this3$_grads.gradY,
              gradT = _this3$_grads.gradT;

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
            var _this3$_grads2 = _this3._grads(address),
                gradX = _this3$_grads2.gradX,
                gradY = _this3$_grads2.gradY,
                gradT = _this3$_grads2.gradT;

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
          var _this3$_grads3 = _this3._grads(address),
              gradX = _this3$_grads3.gradX,
              gradY = _this3$_grads3.gradY;

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
            var _this3$_grads4 = _this3._grads(address),
                gradX = _this3$_grads4.gradX,
                gradY = _this3$_grads4.gradY;

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
          var _this3$_grads5 = _this3._grads(address),
              gradT = _this3$_grads5.gradT;

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
            var _this3$_grads6 = _this3._grads(address),
                gradT = _this3$_grads6.gradT;

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
          var _this3$_grads7 = _this3._grads(address),
              gradX = _this3$_grads7.gradX,
              gradY = _this3$_grads7.gradY,
              gradT = _this3$_grads7.gradT;

          buffer[address] = (0xff << 24) + ((Math.sqrt(gradY * gradT) * 0x0f & 0xff) << 8) + (Math.sqrt(gradX * gradT) * 0x0f & 0xff);
        });
      }

      if (this.output === OUTPUT.C_CELL) {
        var _winStep3 = WINSIZE * 2 + 1;

        var _wmax3 = WIDTH - WINSIZE - 1;

        var _hmax3 = HEIGHT - WINSIZE - 1;

        this._eachCell(WINSIZE + 1, WINSIZE + 1, _wmax3, _hmax3, _winStep3, _winStep3, function (eachAddress) {
          var _this3$_components = _this3._components(eachAddress),
              C2 = _this3$_components.C2,
              C1 = _this3$_components.C1;

          C2 = Math.sqrt(C2);
          C1 = Math.sqrt(C1);
          eachAddress(function (address) {
            buffer[address] = (0xff << 24) + ((C1 & 0xff) << 8) + ((C2 & 0xff) << 0);
          });
        });
      } else if (this.output === OUTPUT.AB) {
        this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
          var _this3$_grads8 = _this3._grads(address),
              gradX = _this3$_grads8.gradX,
              gradY = _this3$_grads8.gradY;

          buffer[address] = (0xff << 24) + ((gradX * gradY & 0xff) << 16) + ((gradY * gradY & 0xff) << 8) + (gradX * gradX & 0xff);
        });
      }

      if (this.output === OUTPUT.AB_CELL) {
        var _winStep4 = WINSIZE * 2 + 1;

        var _wmax4 = WIDTH - WINSIZE - 1;

        var _hmax4 = HEIGHT - WINSIZE - 1;

        this._eachCell(WINSIZE + 1, WINSIZE + 1, _wmax4, _hmax4, _winStep4, _winStep4, function (eachAddress) {
          var _this3$_components2 = _this3._components(eachAddress),
              A2 = _this3$_components2.A2,
              A1B2 = _this3$_components2.A1B2,
              B1 = _this3$_components2.B1;

          A2 = Math.sqrt(A2);
          A1B2 = Math.sqrt(A1B2);
          B1 = Math.sqrt(B1);
          eachAddress(function (address) {
            buffer[address] = (0xff << 24) + ((A1B2 & 0xff) << 16) + ((B1 & 0xff) << 8) + (A2 & 0xff);
          });
        });
      } else if (this.output === OUTPUT.UV) {
        var _winStep5 = WINSIZE * 2 + 1;

        this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, function (address) {
          var _this3$_components3 = _this3._components(function (fn) {
            return fn(address);
          }),
              A2 = _this3$_components3.A2,
              A1B2 = _this3$_components3.A1B2,
              B1 = _this3$_components3.B1,
              C2 = _this3$_components3.C2,
              C1 = _this3$_components3.C1;

          var _motionVector = motionVector(A2, A1B2, B1, C2, C1),
              u = _motionVector.u,
              v = _motionVector.v;

          var inRange = -_winStep5 < u && u < _winStep5 && -_winStep5 < v && v < _winStep5;
          var hypot = Math.hypot(u, v);
          var amount = AMOUNT_SCALE * hypot;
          buffer[address] = (0xff << 24) + (inRange && amount > THRESHOLD ? ((v / _winStep5 + 1) / 2 * 0xff << 8 & 0xff00) + ((u / _winStep5 + 1) / 2 * 0xff << 0 & 0xff) : 0x8080);
        });
      } else if (this.output === OUTPUT.UV_CELL) {
        var _winStep6 = WINSIZE * 2 + 1;

        var _wmax5 = WIDTH - WINSIZE - 1;

        var _hmax5 = HEIGHT - WINSIZE - 1;

        this._eachCell(WINSIZE + 1, WINSIZE + 1, _wmax5, _hmax5, _winStep6, _winStep6, function (eachAddress) {
          var _this3$_components4 = _this3._components(eachAddress),
              A2 = _this3$_components4.A2,
              A1B2 = _this3$_components4.A1B2,
              B1 = _this3$_components4.B1,
              C2 = _this3$_components4.C2,
              C1 = _this3$_components4.C1;

          var _motionVector2 = motionVector(A2, A1B2, B1, C2, C1),
              u = _motionVector2.u,
              v = _motionVector2.v;

          var inRange = -_winStep6 < u && u < _winStep6 && -_winStep6 < v && v < _winStep6;
          var hypot = Math.hypot(u, v);
          var amount = AMOUNT_SCALE * hypot;
          eachAddress(function (address) {
            buffer[address] = (0xff << 24) + (inRange && amount > THRESHOLD ? ((v / _winStep6 + 1) / 2 * 0xff << 8 & 0xff00) + ((u / _winStep6 + 1) / 2 * 0xff << 0 & 0xff) : 0x8080);
          });
        });
      }

      var data = new ImageData(new Uint8ClampedArray(this.buffer.buffer), WIDTH, HEIGHT);
      this.context.putImageData(data, 0, 0);
    }
  }], [{
    key: "OUTPUT",
    get: function get() {
      return OUTPUT;
    }
  }]);

  return VideoMotionView;
}();

module.exports = VideoMotionView;

/***/ })

/******/ });
//# sourceMappingURL=video-sensing-extension-debug.js.map