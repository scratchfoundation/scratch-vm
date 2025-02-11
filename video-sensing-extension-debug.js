(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["VirtualMachine"] = factory();
	else
		root["VirtualMachine"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/extensions/scratch3_video_sensing/debug-exposed.js":
/*!****************************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/debug-exposed.js ***!
  \****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ___EXPOSE_LOADER_IMPORT___ = __webpack_require__(/*! -!./debug.js */ "./src/extensions/scratch3_video_sensing/debug.js");
var ___EXPOSE_LOADER_GET_GLOBAL_THIS___ = __webpack_require__(/*! ../../../node_modules/expose-loader/dist/runtime/getGlobalThis.js */ "./node_modules/expose-loader/dist/runtime/getGlobalThis.js");
var ___EXPOSE_LOADER_GLOBAL_THIS___ = ___EXPOSE_LOADER_GET_GLOBAL_THIS___;
if (typeof ___EXPOSE_LOADER_GLOBAL_THIS___["Scratch3VideoSensingDebug"] === 'undefined') ___EXPOSE_LOADER_GLOBAL_THIS___["Scratch3VideoSensingDebug"] = ___EXPOSE_LOADER_IMPORT___;else throw new Error('[exposes-loader] The "Scratch3VideoSensingDebug" value exists in the global scope, it may not be safe to overwrite it, use the "override" option');
module.exports = ___EXPOSE_LOADER_IMPORT___;

/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/library.js":
/*!**********************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/library.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * @file library.js
 *
 * Tony Hwang and John Maloney, January 2011
 * Michael "Z" Goddard, March 2018
 *
 * Video motion sensing primitives.
 */

const {
  motionVector,
  scratchAtan2
} = __webpack_require__(/*! ./math */ "./src/extensions/scratch3_video_sensing/math.js");

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
  constructor() {
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
  reset() {
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
  addFrame(source) {
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
  analyzeFrame() {
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
    const winStep = WINSIZE * 2 + 1;
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
        let address = (i - WINSIZE) * WIDTH + j - WINSIZE;
        let nextAddress = address + winStep;
        const maxAddress = (i + WINSIZE) * WIDTH + j + WINSIZE;
        for (; address <= maxAddress; address += WIDTH - winStep, nextAddress += WIDTH) {
          for (; address <= nextAddress; address += 1) {
            // The difference in color between the last frame and
            // the current frame.
            const gradT = prev[address] - curr[address];
            // The difference between the pixel to the left and the
            // pixel to the right.
            const gradX = curr[address - 1] - curr[address + 1];
            // The difference between the pixel above and the pixel
            // below.
            const gradY = curr[address - WIDTH] - curr[address + WIDTH];

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
        const {
          u,
          v
        } = motionVector(A2, A1B2, B1, C2, C1);

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
  getLocalMotion(drawable, state) {
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
      drawable.updateCPURenderAttributes();

      // Restrict the region the amount and direction are built from to
      // the area of the current frame overlapped by the given drawable's
      // bounding box.
      const boundingRect = drawable.getFastBounds();
      // Transform the bounding box from scratch space to a space from 0,
      // 0 to WIDTH, HEIGHT.
      const xmin = Math.max(Math.floor(boundingRect.left + WIDTH / 2), 1);
      const xmax = Math.min(Math.floor(boundingRect.right + WIDTH / 2), WIDTH - 1);
      const ymin = Math.max(Math.floor(HEIGHT / 2 - boundingRect.top), 1);
      const ymax = Math.min(Math.floor(HEIGHT / 2 - boundingRect.bottom), HEIGHT - 1);
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
          position[0] = j - WIDTH / 2;
          position[1] = HEIGHT / 2 - i;
          // Consider only pixels in the drawable that can touch the
          // edge or other drawables. Empty space in the current skin
          // is skipped.
          if (drawable.isTouching(position)) {
            const address = i * WIDTH + j;
            // The difference in color between the last frame and
            // the current frame.
            const gradT = prev[address] - curr[address];
            // The difference between the pixel to the left and the
            // pixel to the right.
            const gradX = curr[address - 1] - curr[address + 1];
            // The difference between the pixel above and the pixel
            // below.
            const gradY = curr[address - WIDTH] - curr[address + WIDTH];

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
      let {
        u,
        v
      } = motionVector(A2, A1B2, B1, C2, C1);
      let activePixelNum = 0;
      if (scaleFactor) {
        // Store the area of the sprite in pixels
        activePixelNum = scaleFactor;
        scaleFactor /= 2 * WINSIZE * 2 * WINSIZE;
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

/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/math.js":
/*!*******************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/math.js ***!
  \*******************************************************/
/***/ ((module) => {

/**
 * A constant value helping to transform a value in radians to degrees.
 * @type {number}
 */
const TO_DEGREE = 180 / Math.PI;

/**
 * A object reused to save on memory allocation returning u and v vector from
 * motionVector.
 * @type {UV}
 */
const _motionVectorOut = {
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
const motionVector = function motionVector(A2, A1B2, B1, C2, C1) {
  let out = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _motionVectorOut;
  // Compare sums of X * Y and sums of X squared and Y squared.
  const delta = A1B2 * A1B2 - A2 * B1;
  if (delta) {
    // System is not singular - solving by Kramer method.
    const deltaX = -(C1 * A1B2 - C2 * B1);
    const deltaY = -(A1B2 * C2 - A2 * C1);
    const Idelta = 8 / delta;
    out.u = deltaX * Idelta;
    out.v = deltaY * Idelta;
  } else {
    // Singular system - find optical flow in gradient direction.
    const Norm = (A1B2 + A2) * (A1B2 + A2) + (B1 + A1B2) * (B1 + A1B2);
    if (Norm) {
      const IGradNorm = 8 / Norm;
      const temp = -(C1 + C2) * IGradNorm;
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
const scratchDegrees = function scratchDegrees(degrees) {
  return (degrees + 270) % 360 - 180;
};

/**
 * Get the angle of the y and x component of a 2d vector in degrees in
 * Scratch's coordinate plane.
 * @param {number} y - the y component of a 2d vector
 * @param {number} x - the x component of a 2d vector
 * @returns {number} angle in degrees in Scratch's coordinate plane
 */
const scratchAtan2 = function scratchAtan2(y, x) {
  return scratchDegrees(Math.atan2(y, x) * TO_DEGREE);
};
module.exports = {
  motionVector,
  scratchDegrees,
  scratchAtan2
};

/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/view.js":
/*!*******************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/view.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  motionVector
} = __webpack_require__(/*! ./math */ "./src/extensions/scratch3_video_sensing/math.js");
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
  constructor(motion) {
    let output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : OUTPUT.XYT;
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
  static get OUTPUT() {
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
  _eachAddress(xStart, yStart, xStop, yStop, fn) {
    for (let i = yStart; i < yStop; i++) {
      for (let j = xStart; j < xStop; j++) {
        const address = i * WIDTH + j;
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
  _eachCell(xStart, yStart, xStop, yStop, xStep, yStep, fn) {
    const xStep2 = xStep / 2 | 0;
    const yStep2 = yStep / 2 | 0;
    for (let i = yStart; i < yStop; i += yStep) {
      for (let j = xStart; j < xStop; j += xStep) {
        fn(_fn => this._eachAddress(j - xStep2 - 1, i - yStep2 - 1, j + xStep2, i + yStep2, _fn), j - xStep2 - 1, i - yStep2 - 1, j + xStep2, i + yStep2);
      }
    }
  }

  /**
   * Build horizontal, vertical, and temporal difference of a pixel address.
   * @param {number} address - address to build values for
   * @returns {object} a object with a gradX, grady, and gradT value
   */
  _grads(address) {
    const {
      curr,
      prev
    } = this.motion;
    const gradX = (curr[address - 1] & 0xff) - (curr[address + 1] & 0xff);
    const gradY = (curr[address - WIDTH] & 0xff) - (curr[address + WIDTH] & 0xff);
    const gradT = (prev[address] & 0xff) - (curr[address] & 0xff);
    return {
      gradX,
      gradY,
      gradT
    };
  }

  /**
   * Build component values used in determining a motion vector for a pixel
   * address.
   * @param {function} eachAddress - a bound handle to _eachAddress to build
   *   component values for
   * @returns {object} a object with a A2, A1B2, B1, C2, C1 value
   */
  _components(eachAddress) {
    let A2 = 0;
    let A1B2 = 0;
    let B1 = 0;
    let C2 = 0;
    let C1 = 0;
    eachAddress(address => {
      const {
        gradX,
        gradY,
        gradT
      } = this._grads(address);
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
  draw() {
    if (!(this.motion.prev && this.motion.curr)) {
      return;
    }
    const {
      buffer
    } = this;
    if (this.output === OUTPUT.INPUT) {
      const {
        curr
      } = this.motion;
      this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
        buffer[address] = curr[address];
      });
    }
    if (this.output === OUTPUT.XYT) {
      this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
        const {
          gradX,
          gradY,
          gradT
        } = this._grads(address);
        const over1 = gradT / 0xcf;
        buffer[address] = (0xff << 24) + (Math.floor(((gradY * over1 & 0xff) + 0xff) / 2) << 8) + Math.floor(((gradX * over1 & 0xff) + 0xff) / 2);
      });
    }
    if (this.output === OUTPUT.XYT_CELL) {
      const winStep = WINSIZE * 2 + 1;
      const wmax = WIDTH - WINSIZE - 1;
      const hmax = HEIGHT - WINSIZE - 1;
      this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
        let C1 = 0;
        let C2 = 0;
        let n = 0;
        eachAddress(address => {
          const {
            gradX,
            gradY,
            gradT
          } = this._grads(address);
          C2 += Math.max(Math.min(gradX / 0x0f, 1), -1) * (gradT / 0xff);
          C1 += Math.max(Math.min(gradY / 0x0f, 1), -1) * (gradT / 0xff);
          n += 1;
        });
        C1 /= n;
        C2 /= n;
        C1 = Math.log(C1 + 1 * Math.sign(C1)) / Math.log(2);
        C2 = Math.log(C2 + 1 * Math.sign(C2)) / Math.log(2);
        eachAddress(address => {
          buffer[address] = (0xff << 24) + ((C1 * 0x7f | 0) + 0x80 << 8 & 0xff00) + ((C2 * 0x7f | 0) + 0x80 << 0 & 0xff);
        });
      });
    }
    if (this.output === OUTPUT.XY) {
      this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
        const {
          gradX,
          gradY
        } = this._grads(address);
        buffer[address] = (0xff << 24) + ((gradY + 0xff) / 2 << 8) + (gradX + 0xff) / 2;
      });
    }
    if (this.output === OUTPUT.XY_CELL) {
      const winStep = WINSIZE * 2 + 1;
      const wmax = WIDTH - WINSIZE - 1;
      const hmax = HEIGHT - WINSIZE - 1;
      this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
        let C1 = 0;
        let C2 = 0;
        let n = 0;
        eachAddress(address => {
          const {
            gradX,
            gradY
          } = this._grads(address);
          C2 += Math.max(Math.min(gradX / 0x1f, 1), -1);
          C1 += Math.max(Math.min(gradY / 0x1f, 1), -1);
          n += 1;
        });
        C1 /= n;
        C2 /= n;
        C1 = Math.log(C1 + 1 * Math.sign(C1)) / Math.log(2);
        C2 = Math.log(C2 + 1 * Math.sign(C2)) / Math.log(2);
        eachAddress(address => {
          buffer[address] = (0xff << 24) + ((C1 * 0x7f | 0) + 0x80 << 8 & 0xff00) + ((C2 * 0x7f | 0) + 0x80 << 0 & 0xff);
        });
      });
    } else if (this.output === OUTPUT.T) {
      this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
        const {
          gradT
        } = this._grads(address);
        buffer[address] = (0xff << 24) + ((gradT + 0xff) / 2 << 16);
      });
    }
    if (this.output === OUTPUT.T_CELL) {
      const winStep = WINSIZE * 2 + 1;
      const wmax = WIDTH - WINSIZE - 1;
      const hmax = HEIGHT - WINSIZE - 1;
      this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
        let T = 0;
        let n = 0;
        eachAddress(address => {
          const {
            gradT
          } = this._grads(address);
          T += gradT / 0xff;
          n += 1;
        });
        T /= n;
        eachAddress(address => {
          buffer[address] = (0xff << 24) + ((T * 0x7f | 0) + 0x80 << 16 & 0xff0000);
        });
      });
    } else if (this.output === OUTPUT.C) {
      this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
        const {
          gradX,
          gradY,
          gradT
        } = this._grads(address);
        buffer[address] = (0xff << 24) + ((Math.sqrt(gradY * gradT) * 0x0f & 0xff) << 8) + (Math.sqrt(gradX * gradT) * 0x0f & 0xff);
      });
    }
    if (this.output === OUTPUT.C_CELL) {
      const winStep = WINSIZE * 2 + 1;
      const wmax = WIDTH - WINSIZE - 1;
      const hmax = HEIGHT - WINSIZE - 1;
      this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
        let {
          C2,
          C1
        } = this._components(eachAddress);
        C2 = Math.sqrt(C2);
        C1 = Math.sqrt(C1);
        eachAddress(address => {
          buffer[address] = (0xff << 24) + ((C1 & 0xff) << 8) + ((C2 & 0xff) << 0);
        });
      });
    } else if (this.output === OUTPUT.AB) {
      this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
        const {
          gradX,
          gradY
        } = this._grads(address);
        buffer[address] = (0xff << 24) + ((gradX * gradY & 0xff) << 16) + ((gradY * gradY & 0xff) << 8) + (gradX * gradX & 0xff);
      });
    }
    if (this.output === OUTPUT.AB_CELL) {
      const winStep = WINSIZE * 2 + 1;
      const wmax = WIDTH - WINSIZE - 1;
      const hmax = HEIGHT - WINSIZE - 1;
      this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
        let {
          A2,
          A1B2,
          B1
        } = this._components(eachAddress);
        A2 = Math.sqrt(A2);
        A1B2 = Math.sqrt(A1B2);
        B1 = Math.sqrt(B1);
        eachAddress(address => {
          buffer[address] = (0xff << 24) + ((A1B2 & 0xff) << 16) + ((B1 & 0xff) << 8) + (A2 & 0xff);
        });
      });
    } else if (this.output === OUTPUT.UV) {
      const winStep = WINSIZE * 2 + 1;
      this._eachAddress(1, 1, WIDTH - 1, HEIGHT - 1, address => {
        const {
          A2,
          A1B2,
          B1,
          C2,
          C1
        } = this._components(fn => fn(address));
        const {
          u,
          v
        } = motionVector(A2, A1B2, B1, C2, C1);
        const inRange = -winStep < u && u < winStep && -winStep < v && v < winStep;
        const hypot = Math.hypot(u, v);
        const amount = AMOUNT_SCALE * hypot;
        buffer[address] = (0xff << 24) + (inRange && amount > THRESHOLD ? ((v / winStep + 1) / 2 * 0xff << 8 & 0xff00) + ((u / winStep + 1) / 2 * 0xff << 0 & 0xff) : 0x8080);
      });
    } else if (this.output === OUTPUT.UV_CELL) {
      const winStep = WINSIZE * 2 + 1;
      const wmax = WIDTH - WINSIZE - 1;
      const hmax = HEIGHT - WINSIZE - 1;
      this._eachCell(WINSIZE + 1, WINSIZE + 1, wmax, hmax, winStep, winStep, eachAddress => {
        const {
          A2,
          A1B2,
          B1,
          C2,
          C1
        } = this._components(eachAddress);
        const {
          u,
          v
        } = motionVector(A2, A1B2, B1, C2, C1);
        const inRange = -winStep < u && u < winStep && -winStep < v && v < winStep;
        const hypot = Math.hypot(u, v);
        const amount = AMOUNT_SCALE * hypot;
        eachAddress(address => {
          buffer[address] = (0xff << 24) + (inRange && amount > THRESHOLD ? ((v / winStep + 1) / 2 * 0xff << 8 & 0xff00) + ((u / winStep + 1) / 2 * 0xff << 0 & 0xff) : 0x8080);
        });
      });
    }
    const data = new ImageData(new Uint8ClampedArray(this.buffer.buffer), WIDTH, HEIGHT);
    this.context.putImageData(data, 0, 0);
  }
}
module.exports = VideoMotionView;

/***/ }),

/***/ "./node_modules/expose-loader/dist/runtime/getGlobalThis.js":
/*!******************************************************************!*\
  !*** ./node_modules/expose-loader/dist/runtime/getGlobalThis.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


// eslint-disable-next-line func-names
module.exports = function () {
  if (typeof globalThis === "object") {
    return globalThis;
  }

  var g;

  try {
    // This works if eval is allowed (see CSP)
    // eslint-disable-next-line no-new-func
    g = this || new Function("return this")();
  } catch (e) {
    // This works if the window reference is available
    if (typeof window === "object") {
      return window;
    } // This works if the self reference is available


    if (typeof self === "object") {
      return self;
    } // This works if the global reference is available


    if (typeof __webpack_require__.g !== "undefined") {
      return __webpack_require__.g;
    }
  }

  return g;
}();

/***/ }),

/***/ "./src/extensions/scratch3_video_sensing/debug.js":
/*!********************************************************!*\
  !*** ./src/extensions/scratch3_video_sensing/debug.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

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


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extensions/scratch3_video_sensing/debug-exposed.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=video-sensing-extension-debug.js.map