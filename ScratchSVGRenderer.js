(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["ScratchSVGRenderer"] = factory();
	else
		root["ScratchSVGRenderer"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/bitmap-adapter.js":
/*!*******************************!*\
  !*** ./src/bitmap-adapter.js ***!
  \*******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const base64js = __webpack_require__(/*! base64-js */ "./node_modules/base64-js/index.js");

/**
 * Adapts Scratch 2.0 bitmaps for use in scratch 3.0
 */
class BitmapAdapter {
  /**
   * @param {?function} makeImage HTML image constructor. Tests can provide this.
   * @param {?function} makeCanvas HTML canvas constructor. Tests can provide this.
   */
  constructor(makeImage, makeCanvas) {
    this._makeImage = makeImage ? makeImage : () => new Image();
    this._makeCanvas = makeCanvas ? makeCanvas : () => document.createElement('canvas');
  }

  /**
   * Return a canvas with the resized version of the given image, done using nearest-neighbor interpolation
   * @param {CanvasImageSource} image The image to resize
   * @param {int} newWidth The desired post-resize width of the image
   * @param {int} newHeight The desired post-resize height of the image
   * @returns {HTMLCanvasElement} A canvas with the resized image drawn on it.
   */
  resize(image, newWidth, newHeight) {
    // We want to always resize using nearest-neighbor interpolation. However, canvas implementations are free to
    // use linear interpolation (or other "smooth" interpolation methods) when downscaling:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1360415
    // It seems we can get around this by resizing in two steps: first width, then height. This will always result
    // in nearest-neighbor interpolation, even when downscaling.
    const stretchWidthCanvas = this._makeCanvas();
    stretchWidthCanvas.width = newWidth;
    stretchWidthCanvas.height = image.height;
    let context = stretchWidthCanvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, stretchWidthCanvas.width, stretchWidthCanvas.height);
    const stretchHeightCanvas = this._makeCanvas();
    stretchHeightCanvas.width = newWidth;
    stretchHeightCanvas.height = newHeight;
    context = stretchHeightCanvas.getContext('2d');
    context.imageSmoothingEnabled = false;
    context.drawImage(stretchWidthCanvas, 0, 0, stretchHeightCanvas.width, stretchHeightCanvas.height);
    return stretchHeightCanvas;
  }

  /**
   * Scratch 2.0 had resolution 1 and 2 bitmaps. All bitmaps in Scratch 3.0 are equivalent
   * to resolution 2 bitmaps. Therefore, converting a resolution 1 bitmap means doubling
   * it in width and height.
   * @param {!string} dataURI Base 64 encoded image data of the bitmap
   * @param {!function} callback Node-style callback that returns updated dataURI if conversion succeeded
   */
  convertResolution1Bitmap(dataURI, callback) {
    const image = this._makeImage();
    image.src = dataURI;
    image.onload = () => {
      callback(null, this.resize(image, image.width * 2, image.height * 2).toDataURL());
    };
    image.onerror = () => {
      callback('Image load failed');
    };
  }

  /**
   * Given width/height of an uploaded item, return width/height the image will be resized
   * to in Scratch 3.0
   * @param {!number} oldWidth original width
   * @param {!number} oldHeight original height
   * @return {object} Array of new width, new height
   */
  getResizedWidthHeight(oldWidth, oldHeight) {
    const STAGE_WIDTH = 480;
    const STAGE_HEIGHT = 360;
    const STAGE_RATIO = STAGE_WIDTH / STAGE_HEIGHT;

    // If both dimensions are smaller than or equal to corresponding stage dimension,
    // double both dimensions
    if (oldWidth <= STAGE_WIDTH && oldHeight <= STAGE_HEIGHT) {
      return {
        width: oldWidth * 2,
        height: oldHeight * 2
      };
    }

    // If neither dimension is larger than 2x corresponding stage dimension,
    // this is an in-between image, return it as is
    if (oldWidth <= STAGE_WIDTH * 2 && oldHeight <= STAGE_HEIGHT * 2) {
      return {
        width: oldWidth,
        height: oldHeight
      };
    }
    const imageRatio = oldWidth / oldHeight;
    // Otherwise, figure out how to resize
    if (imageRatio >= STAGE_RATIO) {
      // Wide Image
      return {
        width: STAGE_WIDTH * 2,
        height: STAGE_WIDTH * 2 / imageRatio
      };
    }
    // In this case we have either:
    // - A wide image, but not with as big a ratio between width and height,
    // making it so that fitting the width to double stage size would leave
    // the height too big to fit in double the stage height
    // - A square image that's still larger than the double at least
    // one of the stage dimensions, so pick the smaller of the two dimensions (to fit)
    // - A tall image
    // In any of these cases, resize the image to fit the height to double the stage height
    return {
      width: STAGE_HEIGHT * 2 * imageRatio,
      height: STAGE_HEIGHT * 2
    };
  }

  /**
   * Given bitmap data, resize as necessary.
   * @param {ArrayBuffer | string} fileData Base 64 encoded image data of the bitmap
   * @param {string} fileType The MIME type of this file
   * @returns {Promise} Resolves to resized image data Uint8Array
   */
  importBitmap(fileData, fileType) {
    let dataURI = fileData;
    if (fileData instanceof ArrayBuffer) {
      dataURI = this.convertBinaryToDataURI(fileData, fileType);
    }
    return new Promise((resolve, reject) => {
      const image = this._makeImage();
      image.src = dataURI;
      image.onload = () => {
        const newSize = this.getResizedWidthHeight(image.width, image.height);
        if (newSize.width === image.width && newSize.height === image.height) {
          // No change
          resolve(this.convertDataURIToBinary(dataURI));
        } else {
          const resizedDataURI = this.resize(image, newSize.width, newSize.height).toDataURL();
          resolve(this.convertDataURIToBinary(resizedDataURI));
        }
      };
      image.onerror = () => {
        // TODO: reject with an Error (breaking API change!)
        // eslint-disable-next-line prefer-promise-reject-errors
        reject('Image load failed');
      };
    });
  }

  // TODO consolidate with scratch-vm/src/util/base64-util.js
  // From https://gist.github.com/borismus/1032746
  convertDataURIToBinary(dataURI) {
    const BASE64_MARKER = ';base64,';
    const base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    const base64 = dataURI.substring(base64Index);
    const raw = window.atob(base64);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }
  convertBinaryToDataURI(arrayBuffer, contentType) {
    return "data:".concat(contentType, ";base64,").concat(base64js.fromByteArray(new Uint8Array(arrayBuffer)));
  }
}
module.exports = BitmapAdapter;

/***/ }),

/***/ "./src/fixup-svg-string.js":
/*!*********************************!*\
  !*** ./src/fixup-svg-string.js ***!
  \*********************************/
/***/ ((module) => {

/**
 * Fixup svg string prior to parsing.
 * @param {!string} svgString String of the svg to fix.
 * @returns {!string} fixed svg that should be parseable.
 */
module.exports = function (svgString) {
  // Add root svg namespace if it does not exist.
  const svgAttrs = svgString.match(/<svg [^>]*>/);
  if (svgAttrs && svgAttrs[0].indexOf('xmlns=') === -1) {
    svgString = svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  }

  // There are some SVGs from Illustrator that use undeclared entities.
  // Just replace those entities with fake namespace references to prevent
  // DOMParser from crashing
  if (svgAttrs && svgAttrs[0].indexOf('&ns_') !== -1 && svgString.indexOf('<!DOCTYPE') === -1) {
    svgString = svgString.replace(svgAttrs[0], svgAttrs[0].replace(/&ns_[^;]+;/g, 'http://ns.adobe.com/Extensibility/1.0/'));
  }

  // Some SVGs exported from Photoshop have been found to have an invalid mime type
  // Chrome and Safari won't render these SVGs, so we correct it here
  if (svgString.includes('data:img/png')) {
    svgString = svgString.replace(
    // capture entire image tag with xlink:href=and the quote - dont capture data: bit
    /(<image[^>]+?xlink:href=["'])data:img\/png/g,
    // use the captured <image ..... xlink:href=" then append the right data uri mime type
    ($0, $1) => "".concat($1, "data:image/png"));
  }

  // Some SVGs from Inkscape attempt to bind a prefix to a reserved namespace name.
  // This will cause SVG parsing to fail, so replace these with a dummy namespace name.
  // This namespace name is only valid for "xml", and if we bind "xmlns:xml" to the dummy namespace,
  // parsing will fail yet again, so exclude "xmlns:xml" declarations.
  const xmlnsRegex = /(<[^>]+?xmlns:(?!xml=)[^ ]+=)"http:\/\/www.w3.org\/XML\/1998\/namespace"/g;
  if (svgString.match(xmlnsRegex) !== null) {
    svgString = svgString.replace(
    // capture the entire attribute
    xmlnsRegex,
    // use the captured attribute name; replace only the URL
    ($0, $1) => "".concat($1, "\"http://dummy.namespace\""));
  }

  // Strip `svg:` prefix (sometimes added by Inkscape) from all tags. They interfere with DOMPurify (prefixed tag
  // names are not recognized) and the paint editor.
  // This matches opening and closing tags--the capture group captures the slash if it exists, and it is reinserted
  // in the replacement text.
  svgString = svgString.replace(/<(\/?)\s*svg:/g, '<$1');

  // The <metadata> element is not needed for rendering and sometimes contains
  // unparseable garbage from Illustrator :( Empty out the contents.
  // Note: [\s\S] matches everything including newlines, which .* does not
  svgString = svgString.replace(/<metadata>[\s\S]*<\/metadata>/, '<metadata></metadata>');

  // Empty script tags and javascript executing
  svgString = svgString.replace(/<script[\s\S]*>[\s\S]*<\/script>/, '<script></script>');
  return svgString;
};

/***/ }),

/***/ "./src/font-converter.js":
/*!*******************************!*\
  !*** ./src/font-converter.js ***!
  \*******************************/
/***/ ((module) => {

/**
 * @fileOverview Convert 2.0 fonts to 3.0 fonts.
 */

/**
 * Given an SVG, replace Scratch 2.0 fonts with new 3.0 fonts. Add defaults where there are none.
 * @param {SVGElement} svgTag The SVG dom object
 * @return {void}
 */
const convertFonts = function convertFonts(svgTag) {
  // Collect all text elements into a list.
  const textElements = [];
  const collectText = domElement => {
    if (domElement.localName === 'text') {
      textElements.push(domElement);
    }
    for (let i = 0; i < domElement.childNodes.length; i++) {
      collectText(domElement.childNodes[i]);
    }
  };
  collectText(svgTag);
  // If there's an old font-family, switch to the new one.
  for (const textElement of textElements) {
    // If there's no font-family provided, provide one.
    if (!textElement.getAttribute('font-family') || textElement.getAttribute('font-family') === 'Helvetica') {
      textElement.setAttribute('font-family', 'Sans Serif');
    } else if (textElement.getAttribute('font-family') === 'Mystery') {
      textElement.setAttribute('font-family', 'Curly');
    } else if (textElement.getAttribute('font-family') === 'Gloria') {
      textElement.setAttribute('font-family', 'Handwriting');
    } else if (textElement.getAttribute('font-family') === 'Donegal') {
      textElement.setAttribute('font-family', 'Serif');
    }
  }
};
module.exports = convertFonts;

/***/ }),

/***/ "./src/font-inliner.js":
/*!*****************************!*\
  !*** ./src/font-inliner.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * @fileOverview Import bitmap data into Scratch 3.0, resizing image as necessary.
 */
const getFonts = __webpack_require__(/*! scratch-render-fonts */ "./node_modules/scratch-render-fonts/src/index.js");

/**
 * Given SVG data, inline the fonts. This allows them to be rendered correctly when set
 * as the source of an HTMLImageElement. Here is a note from tmickel:
 *   // Inject fonts that are needed.
 *   // It would be nice if there were another way to get the SVG-in-canvas
 *   // to render the correct font family, but I couldn't find any other way.
 *   // Other things I tried:
 *   // Just injecting the font-family into the document: no effect.
 *   // External stylesheet linked to by SVG: no effect.
 *   // Using a <link> or <style>@import</style> to link to font-family
 *   // injected into the document: no effect.
 * @param {string} svgString The string representation of the svg to modify
 * @return {string} The svg with any needed fonts inlined
 */
const inlineSvgFonts = function inlineSvgFonts(svgString) {
  const FONTS = getFonts();
  // Make it clear that this function only operates on strings.
  // If we don't explicitly throw this here, the function silently fails.
  if (typeof svgString !== 'string') {
    throw new Error('SVG to be inlined is not a string');
  }

  // Collect fonts that need injection.
  const fontsNeeded = new Set();
  const fontRegex = /font-family="([^"]*)"/g;
  let matches = fontRegex.exec(svgString);
  while (matches) {
    fontsNeeded.add(matches[1]);
    matches = fontRegex.exec(svgString);
  }
  if (fontsNeeded.size > 0) {
    let str = '<defs><style>';
    for (const font of fontsNeeded) {
      if (Object.prototype.hasOwnProperty.call(FONTS, font)) {
        str += "".concat(FONTS[font]);
      }
    }
    str += '</style></defs>';
    svgString = svgString.replace(/<svg[^>]*>/, "$&".concat(str));
    return svgString;
  }
  return svgString;
};
module.exports = inlineSvgFonts;

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const SVGRenderer = __webpack_require__(/*! ./svg-renderer */ "./src/svg-renderer.js");
const BitmapAdapter = __webpack_require__(/*! ./bitmap-adapter */ "./src/bitmap-adapter.js");
const inlineSvgFonts = __webpack_require__(/*! ./font-inliner */ "./src/font-inliner.js");
const loadSvgString = __webpack_require__(/*! ./load-svg-string */ "./src/load-svg-string.js");
const sanitizeSvg = __webpack_require__(/*! ./sanitize-svg */ "./src/sanitize-svg.js");
const serializeSvgToString = __webpack_require__(/*! ./serialize-svg-to-string */ "./src/serialize-svg-to-string.js");
const SvgElement = __webpack_require__(/*! ./svg-element */ "./src/svg-element.js");
const convertFonts = __webpack_require__(/*! ./font-converter */ "./src/font-converter.js");
// /**
//  * Export for NPM & Node.js
//  * @type {RenderWebGL}
//  */
module.exports = {
  BitmapAdapter: BitmapAdapter,
  convertFonts: convertFonts,
  inlineSvgFonts: inlineSvgFonts,
  loadSvgString: loadSvgString,
  sanitizeSvg: sanitizeSvg,
  serializeSvgToString: serializeSvgToString,
  SvgElement: SvgElement,
  SVGRenderer: SVGRenderer
};

/***/ }),

/***/ "./src/load-svg-string.js":
/*!********************************!*\
  !*** ./src/load-svg-string.js ***!
  \********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const DOMPurify = __webpack_require__(/*! isomorphic-dompurify */ "./node_modules/isomorphic-dompurify/browser.js");
const SvgElement = __webpack_require__(/*! ./svg-element */ "./src/svg-element.js");
const convertFonts = __webpack_require__(/*! ./font-converter */ "./src/font-converter.js");
const fixupSvgString = __webpack_require__(/*! ./fixup-svg-string */ "./src/fixup-svg-string.js");
const transformStrokeWidths = __webpack_require__(/*! ./transform-applier */ "./src/transform-applier.js");

/**
 * @param {SVGElement} svgTag the tag to search within
 * @param {string} [tagName] svg tag to search for (or collect all elements if not given)
 * @return {Array} a list of elements with the given tagname
 */
const collectElements = (svgTag, tagName) => {
  const elts = [];
  const collectElementsInner = domElement => {
    if ((domElement.localName === tagName || typeof tagName === 'undefined') && domElement.getAttribute) {
      elts.push(domElement);
    }
    for (let i = 0; i < domElement.childNodes.length; i++) {
      collectElementsInner(domElement.childNodes[i]);
    }
  };
  collectElementsInner(svgTag);
  return elts;
};

/**
 * Fix SVGs to comply with SVG spec. Scratch 2 defaults to x2 = 0 when x2 is missing, but
 * SVG defaults to x2 = 1 when missing.
 * @param {SVGSVGElement} svgTag the SVG tag to apply the transformation to
 */
const transformGradients = svgTag => {
  const linearGradientElements = collectElements(svgTag, 'linearGradient');

  // For each gradient element, supply x2 if necessary.
  for (const gradientElement of linearGradientElements) {
    if (!gradientElement.getAttribute('x2')) {
      gradientElement.setAttribute('x2', '0');
    }
  }
};

/**
 * Fix SVGs to match appearance in Scratch 2, which used nearest neighbor scaling for bitmaps
 * within SVGs.
 * @param {SVGSVGElement} svgTag the SVG tag to apply the transformation to
 */
const transformImages = svgTag => {
  const imageElements = collectElements(svgTag, 'image');

  // For each image element, set image rendering to pixelated
  const pixelatedImages = 'image-rendering: optimizespeed; image-rendering: pixelated;';
  for (const elt of imageElements) {
    if (elt.getAttribute('style')) {
      elt.setAttribute('style', "".concat(pixelatedImages, " ").concat(elt.getAttribute('style')));
    } else {
      elt.setAttribute('style', pixelatedImages);
    }
  }
};

/**
 * Transforms an SVG's text elements for Scratch 2.0 quirks.
 * These quirks include:
 * 1. `x` and `y` properties are removed/ignored.
 * 2. Alignment is set to `text-before-edge`.
 * 3. Line-breaks are converted to explicit <tspan> elements.
 * 4. Any required fonts are injected.
 * @param {SVGSVGElement} svgTag the SVG tag to apply the transformation to
 */
const transformText = svgTag => {
  // Collect all text elements into a list.
  const textElements = [];
  const collectText = domElement => {
    if (domElement.localName === 'text') {
      textElements.push(domElement);
    }
    for (let i = 0; i < domElement.childNodes.length; i++) {
      collectText(domElement.childNodes[i]);
    }
  };
  collectText(svgTag);
  convertFonts(svgTag);
  // For each text element, apply quirks.
  for (const textElement of textElements) {
    // Remove x and y attributes - they are not used in Scratch.
    textElement.removeAttribute('x');
    textElement.removeAttribute('y');
    // Set text-before-edge alignment:
    // Scratch renders all text like this.
    textElement.setAttribute('alignment-baseline', 'text-before-edge');
    textElement.setAttribute('xml:space', 'preserve');
    // If there's no font size provided, provide one.
    if (!textElement.getAttribute('font-size')) {
      textElement.setAttribute('font-size', '18');
    }
    let text = textElement.textContent;

    // Fix line breaks in text, which are not natively supported by SVG.
    // Only fix if text does not have child tspans.
    // @todo this will not work for font sizes with units such as em, percent
    // However, text made in scratch 2 should only ever export size 22 font.
    const fontSize = parseFloat(textElement.getAttribute('font-size'));
    const tx = 2;
    let ty = 0;
    let spacing = 1.2;
    // Try to match the position and spacing of Scratch 2.0's fonts.
    // Different fonts seem to use different line spacing.
    // Scratch 2 always uses alignment-baseline=text-before-edge
    // However, most SVG readers don't support this attribute
    // or don't support it alongside use of tspan, so the translations
    // here are to make up for that.
    if (textElement.getAttribute('font-family') === 'Handwriting') {
      spacing = 2;
      ty = -11 * fontSize / 22;
    } else if (textElement.getAttribute('font-family') === 'Scratch') {
      spacing = 0.89;
      ty = -3 * fontSize / 22;
    } else if (textElement.getAttribute('font-family') === 'Curly') {
      spacing = 1.38;
      ty = -6 * fontSize / 22;
    } else if (textElement.getAttribute('font-family') === 'Marker') {
      spacing = 1.45;
      ty = -6 * fontSize / 22;
    } else if (textElement.getAttribute('font-family') === 'Sans Serif') {
      spacing = 1.13;
      ty = -3 * fontSize / 22;
    } else if (textElement.getAttribute('font-family') === 'Serif') {
      spacing = 1.25;
      ty = -4 * fontSize / 22;
    }
    if (textElement.transform.baseVal.numberOfItems === 0) {
      const transform = svgTag.createSVGTransform();
      textElement.transform.baseVal.appendItem(transform);
    }

    // Right multiply matrix by a translation of (tx, ty)
    const mtx = textElement.transform.baseVal.getItem(0).matrix;
    mtx.e += mtx.a * tx + mtx.c * ty;
    mtx.f += mtx.b * tx + mtx.d * ty;
    if (text && textElement.childElementCount === 0) {
      textElement.textContent = '';
      const lines = text.split('\n');
      text = '';
      for (const line of lines) {
        const tspanNode = SvgElement.create('tspan');
        tspanNode.setAttribute('x', '0');
        tspanNode.setAttribute('style', 'white-space: pre');
        tspanNode.setAttribute('dy', "".concat(spacing, "em"));
        tspanNode.textContent = line ? line : ' ';
        textElement.appendChild(tspanNode);
      }
    }
  }
};

/**
 * Find the largest stroke width in the svg. If a shape has no
 * `stroke` property, it has a stroke-width of 0. If it has a `stroke`,
 * it is by default a stroke-width of 1.
 * This is used to enlarge the computed bounding box, which doesn't take
 * stroke width into account.
 * @param {SVGSVGElement} rootNode The root SVG node to traverse.
 * @return {number} The largest stroke width in the SVG.
 */
const findLargestStrokeWidth = rootNode => {
  let largestStrokeWidth = 0;
  const collectStrokeWidths = domElement => {
    if (domElement.getAttribute) {
      if (domElement.getAttribute('stroke')) {
        largestStrokeWidth = Math.max(largestStrokeWidth, 1);
      }
      if (domElement.getAttribute('stroke-width')) {
        largestStrokeWidth = Math.max(largestStrokeWidth, Number(domElement.getAttribute('stroke-width')) || 0);
      }
    }
    for (let i = 0; i < domElement.childNodes.length; i++) {
      collectStrokeWidths(domElement.childNodes[i]);
    }
  };
  collectStrokeWidths(rootNode);
  return largestStrokeWidth;
};

/**
 * Transform the measurements of the SVG.
 * In Scratch 2.0, SVGs are drawn without respect to the width,
 * height, and viewBox attribute on the tag. The exporter
 * does output these properties - but they appear to be incorrect often.
 * To address the incorrect measurements, we append the DOM to the
 * document, and then use SVG's native `getBBox` to find the real
 * drawn dimensions. This ensures things drawn in negative dimensions,
 * outside the given viewBox, etc., are all eventually drawn to the canvas.
 * I tried to do this several other ways: stripping the width/height/viewBox
 * attributes and then drawing (Firefox won't draw anything),
 * or inflating them and then measuring a canvas. But this seems to be
 * a natural and performant way.
 * @param {SVGSVGElement} svgTag the SVG tag to apply the transformation to
 */
const transformMeasurements = svgTag => {
  // Append the SVG dom to the document.
  // This allows us to use `getBBox` on the page,
  // which returns the full bounding-box of all drawn SVG
  // elements, similar to how Scratch 2.0 did measurement.
  const svgSpot = document.createElement('span');
  // Since we're adding user-provided SVG to document.body,
  // sanitizing is required. This should not affect bounding box calculation.
  // outerHTML is attribute of Element (and not HTMLElement), so use it instead of
  // calling serializer or toString()
  // NOTE: svgTag remains untouched!
  const rawValue = svgTag.outerHTML;
  const sanitizedValue = DOMPurify.sanitize(rawValue, {
    // Use SVG profile (no HTML elements)
    USE_PROFILES: {
      svg: true
    },
    // Remove some tags that Scratch does not use.
    FORBID_TAGS: ['a', 'audio', 'canvas', 'video'],
    // Allow data URI in image tags (e.g. SVGs converted from bitmap)
    ADD_DATA_URI_TAGS: ['image']
  });
  let bbox;
  try {
    // Insert sanitized value.
    svgSpot.innerHTML = sanitizedValue;
    document.body.appendChild(svgSpot);
    // Take the bounding box. We have to get elements via svgSpot
    // because we added it via innerHTML.
    bbox = svgSpot.children[0].getBBox();
  } finally {
    // Always destroy the element, even if, for example, getBBox throws.
    document.body.removeChild(svgSpot);
  }

  // Enlarge the bbox from the largest found stroke width
  // This may have false-positives, but at least the bbox will always
  // contain the full graphic including strokes.
  // If the width or height is zero however, don't enlarge since
  // they won't have a stroke width that needs to be enlarged.
  let halfStrokeWidth;
  if (bbox.width === 0 || bbox.height === 0) {
    halfStrokeWidth = 0;
  } else {
    halfStrokeWidth = findLargestStrokeWidth(svgTag) / 2;
  }
  const width = bbox.width + halfStrokeWidth * 2;
  const height = bbox.height + halfStrokeWidth * 2;
  const x = bbox.x - halfStrokeWidth;
  const y = bbox.y - halfStrokeWidth;

  // Set the correct measurements on the SVG tag
  svgTag.setAttribute('width', width);
  svgTag.setAttribute('height', height);
  svgTag.setAttribute('viewBox', "".concat(x, " ").concat(y, " ").concat(width, " ").concat(height));
};

/**
 * Find all instances of a URL-referenced `stroke` in the svg. In 2.0, all gradient strokes
 * have a round `stroke-linejoin` and `stroke-linecap`... for some reason.
 * @param {SVGSVGElement} svgTag the SVG tag to apply the transformation to
 */
const setGradientStrokeRoundedness = svgTag => {
  const elements = collectElements(svgTag);
  for (const elt of elements) {
    if (!elt.style) continue;
    const stroke = elt.style.stroke || elt.getAttribute('stroke');
    if (stroke && stroke.match(/^url\(#.*\)$/)) {
      elt.style['stroke-linejoin'] = 'round';
      elt.style['stroke-linecap'] = 'round';
    }
  }
};

/**
 * In-place, convert passed SVG to something consistent that will be rendered the way we want them to be.
 * @param {SVGSvgElement} svgTag root SVG node to operate upon
 * @param {boolean} [fromVersion2] True if we should perform conversion from version 2 to version 3 svg.
 */
const normalizeSvg = (svgTag, fromVersion2) => {
  if (fromVersion2) {
    // Fix gradients. Scratch 2 exports no x2 when x2 = 0, but
    // SVG default is that x2 is 1. This must be done before
    // transformStrokeWidths since transformStrokeWidths affects
    // gradients.
    transformGradients(svgTag);
  }
  transformStrokeWidths(svgTag, window);
  transformImages(svgTag);
  if (fromVersion2) {
    // Transform all text elements.
    transformText(svgTag);
    // Transform measurements.
    transformMeasurements(svgTag);
    // Fix stroke roundedness.
    setGradientStrokeRoundedness(svgTag);
  } else if (!svgTag.getAttribute('viewBox')) {
    // Renderer expects a view box.
    transformMeasurements(svgTag);
  } else if (!svgTag.getAttribute('width') || !svgTag.getAttribute('height')) {
    svgTag.setAttribute('width', svgTag.viewBox.baseVal.width);
    svgTag.setAttribute('height', svgTag.viewBox.baseVal.height);
  }
};

/**
 * Load an SVG string and normalize it. All the steps before drawing/measuring.
 * Currently, this will normalize stroke widths (see transform-applier.js) and render all embedded images pixelated.
 * The returned SVG will be guaranteed to always have a `width`, `height` and `viewBox`.
 * In addition, if the `fromVersion2` parameter is `true`, several "quirks-mode" transformations will be applied which
 * mimic Scratch 2.0's SVG rendering.
 * @param {!string} svgString String of SVG data to draw in quirks-mode.
 * @param {boolean} [fromVersion2] True if we should perform conversion from version 2 to version 3 svg.
 * @return {SVGSVGElement} The normalized SVG element.
 */
const loadSvgString = (svgString, fromVersion2) => {
  // Parse string into SVG XML.
  const parser = new DOMParser();
  svgString = fixupSvgString(svgString);
  const svgDom = parser.parseFromString(svgString, 'text/xml');
  if (svgDom.childNodes.length < 1 || svgDom.documentElement.localName !== 'svg') {
    throw new Error('Document does not appear to be SVG.');
  }
  const svgTag = svgDom.documentElement;
  normalizeSvg(svgTag, fromVersion2);
  return svgTag;
};
module.exports = loadSvgString;

/***/ }),

/***/ "./src/sanitize-svg.js":
/*!*****************************!*\
  !*** ./src/sanitize-svg.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * @fileOverview Sanitize the content of an SVG aggressively, to make it as safe
 * as possible
 */
const fixupSvgString = __webpack_require__(/*! ./fixup-svg-string */ "./src/fixup-svg-string.js");
const {
  generate,
  parse,
  walk
} = __webpack_require__(/*! css-tree */ "./node_modules/css-tree/lib/index.js");
const DOMPurify = __webpack_require__(/*! isomorphic-dompurify */ "./node_modules/isomorphic-dompurify/browser.js");
const sanitizeSvg = {};
DOMPurify.addHook('beforeSanitizeAttributes', currentNode => {
  if (currentNode && currentNode.href && currentNode.href.baseVal) {
    const href = currentNode.href.baseVal.replace(/\s/g, '');
    // "data:" and "#" are valid hrefs
    if (href.slice(0, 5) !== 'data:' && href.slice(0, 1) !== '#') {
      if (currentNode.attributes.getNamedItem('xlink:href')) {
        currentNode.attributes.removeNamedItem('xlink:href');
        delete currentNode['xlink:href'];
      }
      if (currentNode.attributes.getNamedItem('href')) {
        currentNode.attributes.removeNamedItem('href');
        delete currentNode.href;
      }
    }
  }
  return currentNode;
});
DOMPurify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'style') {
    const ast = parse(node.textContent);
    let isModified = false;
    // Remove any @import rules as it could leak HTTP requests
    walk(ast, (astNode, item, list) => {
      if (astNode.type === 'Atrule' && astNode.name === 'import') {
        list.remove(item);
        isModified = true;
      }
    });
    if (isModified) {
      node.textContent = generate(ast);
    }
  }
});

// Use JS implemented TextDecoder and TextEncoder if it is not provided by the
// browser.
let _TextDecoder;
let _TextEncoder;
if (typeof TextDecoder === 'undefined' || typeof TextEncoder === 'undefined') {
  // Wait to require the text encoding polyfill until we know it's needed.
  // eslint-disable-next-line global-require
  const encoding = __webpack_require__(/*! fastestsmallesttextencoderdecoder */ "./node_modules/fastestsmallesttextencoderdecoder/EncoderDecoderTogether.min.js");
  _TextDecoder = encoding.TextDecoder;
  _TextEncoder = encoding.TextEncoder;
} else {
  _TextDecoder = TextDecoder;
  _TextEncoder = TextEncoder;
}

/**
 * Load an SVG Uint8Array of bytes and "sanitize" it
 * @param {!Uint8Array} rawData unsanitized SVG daata
 * @return {Uint8Array} sanitized SVG data
 */
sanitizeSvg.sanitizeByteStream = function (rawData) {
  const decoder = new _TextDecoder();
  const encoder = new _TextEncoder();
  const sanitizedText = sanitizeSvg.sanitizeSvgText(decoder.decode(rawData));
  return encoder.encode(sanitizedText);
};

/**
 * Load an SVG string and "sanitize" it. This is more aggressive than the handling in
 * fixup-svg-string.js, and thus more risky; there are known examples of SVGs that
 * it will clobber. We use DOMPurify's svg profile, which restricts many types of tag.
 * @param {!string} rawSvgText unsanitized SVG string
 * @return {string} sanitized SVG text
 */
sanitizeSvg.sanitizeSvgText = function (rawSvgText) {
  let sanitizedText = DOMPurify.sanitize(rawSvgText, {
    USE_PROFILES: {
      svg: true
    }
  });

  // Remove partial XML comment that is sometimes left in the HTML
  const badTag = sanitizedText.indexOf(']&gt;');
  if (badTag >= 0) {
    sanitizedText = sanitizedText.substring(5, sanitizedText.length);
  }

  // also use our custom fixup rules
  sanitizedText = fixupSvgString(sanitizedText);
  return sanitizedText;
};
module.exports = sanitizeSvg;

/***/ }),

/***/ "./src/serialize-svg-to-string.js":
/*!****************************************!*\
  !*** ./src/serialize-svg-to-string.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const inlineSvgFonts = __webpack_require__(/*! ./font-inliner */ "./src/font-inliner.js");

/**
 * Serialize a given SVG DOM to a string.
 * @param {SVGSVGElement} svgTag The SVG element to serialize.
 * @param {?boolean} shouldInjectFonts True if fonts should be included in the SVG as
 *     base64 data.
 * @returns {string} String representing current SVG data.
 */
const serializeSvgToString = (svgTag, shouldInjectFonts) => {
  const serializer = new XMLSerializer();
  let string = serializer.serializeToString(svgTag);
  if (shouldInjectFonts) {
    string = inlineSvgFonts(string);
  }
  return string;
};
module.exports = serializeSvgToString;

/***/ }),

/***/ "./src/svg-element.js":
/*!****************************!*\
  !*** ./src/svg-element.js ***!
  \****************************/
/***/ ((module) => {

/* Adapted from
 * Paper.js - The Swiss Army Knife of Vector Graphics Scripting.
 * http://paperjs.org/
 *
 * Copyright (c) 2011 - 2016, Juerg Lehni & Jonathan Puckey
 * http://scratchdisk.com/ & http://jonathanpuckey.com/
 *
 * Distributed under the MIT license. See LICENSE file for details.
 *
 * All rights reserved.
 */

/**
 * @name SvgElement
 * @namespace
 * @private
 */
class SvgElement {
  // SVG related namespaces
  static get svg() {
    return 'http://www.w3.org/2000/svg';
  }
  static get xmlns() {
    return 'http://www.w3.org/2000/xmlns';
  }
  static get xlink() {
    return 'http://www.w3.org/1999/xlink';
  }

  // Mapping of attribute names to required namespaces:
  static attributeNamespace() {
    return {
      'href': SvgElement.xlink,
      'xlink': SvgElement.xmlns,
      // Only the xmlns attribute needs the trailing slash. See #984
      'xmlns': "".concat(SvgElement.xmlns, "/"),
      // IE needs the xmlns namespace when setting 'xmlns:xlink'. See #984
      'xmlns:xlink': "".concat(SvgElement.xmlns, "/")
    };
  }
  static create(tag, attributes, formatter) {
    return SvgElement.set(document.createElementNS(SvgElement.svg, tag), attributes, formatter);
  }
  static get(node, name) {
    const namespace = SvgElement.attributeNamespace[name];
    const value = namespace ? node.getAttributeNS(namespace, name) : node.getAttribute(name);
    return value === 'null' ? null : value;
  }
  static set(node, attributes, formatter) {
    for (const name in attributes) {
      let value = attributes[name];
      const namespace = SvgElement.attributeNamespace[name];
      if (typeof value === 'number' && formatter) {
        value = formatter.number(value);
      }
      if (namespace) {
        node.setAttributeNS(namespace, name, value);
      } else {
        node.setAttribute(name, value);
      }
    }
    return node;
  }
}
module.exports = SvgElement;

/***/ }),

/***/ "./src/svg-renderer.js":
/*!*****************************!*\
  !*** ./src/svg-renderer.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const loadSvgString = __webpack_require__(/*! ./load-svg-string */ "./src/load-svg-string.js");
const serializeSvgToString = __webpack_require__(/*! ./serialize-svg-to-string */ "./src/serialize-svg-to-string.js");

/**
 * Main quirks-mode SVG rendering code.
 * @deprecated Call into individual methods exported from this library instead.
 */
class SvgRenderer {
  /**
   * Create a quirks-mode SVG renderer for a particular canvas.
   * @param {HTMLCanvasElement} [canvas] An optional canvas element to draw to. If this is not provided, the renderer
   * will create a new canvas.
   * @constructor
   */
  constructor(canvas) {
    /**
     * The canvas that this SVG renderer will render to.
     * @type {HTMLCanvasElement}
     * @private
     */
    this._canvas = canvas || document.createElement('canvas');
    this._context = this._canvas.getContext('2d');

    /**
     * A measured SVG "viewbox"
     * @typedef {object} SvgRenderer#SvgMeasurements
     * @property {number} x - The left edge of the SVG viewbox.
     * @property {number} y - The top edge of the SVG viewbox.
     * @property {number} width - The width of the SVG viewbox.
     * @property {number} height - The height of the SVG viewbox.
     */

    /**
     * The measurement box of the currently loaded SVG.
     * @type {SvgRenderer#SvgMeasurements}
     * @private
     */
    this._measurements = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };

    /**
     * The `<img>` element with the contents of the currently loaded SVG.
     * @type {?HTMLImageElement}
     * @private
     */
    this._cachedImage = null;

    /**
     * True if this renderer's current SVG is loaded and can be rendered to the canvas.
     * @type {boolean}
     */
    this.loaded = false;
  }

  /**
   * @returns {!HTMLCanvasElement} this renderer's target canvas.
   */
  get canvas() {
    return this._canvas;
  }

  /**
   * @return {Array<number>} the natural size, in Scratch units, of this SVG.
   */
  get size() {
    return [this._measurements.width, this._measurements.height];
  }

  /**
   * @return {Array<number>} the offset (upper left corner) of the SVG's view box.
   */
  get viewOffset() {
    return [this._measurements.x, this._measurements.y];
  }

  /**
   * Load an SVG string and normalize it. All the steps before drawing/measuring.
   * @param {!string} svgString String of SVG data to draw in quirks-mode.
   * @param {?boolean} fromVersion2 True if we should perform conversion from
   *     version 2 to version 3 svg.
   */
  loadString(svgString, fromVersion2) {
    // New svg string invalidates the cached image
    this._cachedImage = null;
    const svgTag = loadSvgString(svgString, fromVersion2);
    this._svgTag = svgTag;
    this._measurements = {
      width: svgTag.viewBox.baseVal.width,
      height: svgTag.viewBox.baseVal.height,
      x: svgTag.viewBox.baseVal.x,
      y: svgTag.viewBox.baseVal.y
    };
  }

  /**
   * Load an SVG string, normalize it, and prepare it for (synchronous) rendering.
   * @param {!string} svgString String of SVG data to draw in quirks-mode.
   * @param {?boolean} fromVersion2 True if we should perform conversion from version 2 to version 3 svg.
   * @param {Function} [onFinish] - An optional callback to call when the SVG is loaded and can be rendered.
   */
  loadSVG(svgString, fromVersion2, onFinish) {
    this.loadString(svgString, fromVersion2);
    this._createSVGImage(onFinish);
  }

  /**
   * Creates an <img> element for the currently loaded SVG string, then calls the callback once it's loaded.
   * @param {Function} [onFinish] - An optional callback to call when the <img> has loaded.
   */
  _createSVGImage(onFinish) {
    if (this._cachedImage === null) this._cachedImage = new Image();
    const img = this._cachedImage;
    img.onload = () => {
      this.loaded = true;
      if (onFinish) onFinish();
    };
    const svgText = this.toString(true /* shouldInjectFonts */);
    img.src = "data:image/svg+xml;utf8,".concat(encodeURIComponent(svgText));
    this.loaded = false;
  }

  /**
   * Serialize the active SVG DOM to a string.
   * @param {?boolean} shouldInjectFonts True if fonts should be included in the SVG as
   *     base64 data.
   * @returns {string} String representing current SVG data.
   * @deprecated Use the standalone `serializeSvgToString` export instead.
   */
  toString(shouldInjectFonts) {
    return serializeSvgToString(this._svgTag, shouldInjectFonts);
  }

  /**
   * Synchronously draw the loaded SVG to this renderer's `canvas`.
   * @param {number} [scale] - Optionally, also scale the image by this factor.
   */
  draw(scale) {
    if (!this.loaded) throw new Error('SVG image has not finished loading');
    this._drawFromImage(scale);
  }

  /**
   * Draw to the canvas from a loaded image element.
   * @param {number} [scale] - Optionally, also scale the image by this factor.
   **/
  _drawFromImage(scale) {
    if (this._cachedImage === null) return;
    const ratio = Number.isFinite(scale) ? scale : 1;
    const bbox = this._measurements;
    this._canvas.width = bbox.width * ratio;
    this._canvas.height = bbox.height * ratio;
    // Even if the canvas at the current scale has a nonzero size, the image's dimensions are floored pre-scaling.
    // e.g. if an image has a width of 0.4 and is being rendered at 3x scale, the canvas will have a width of 1, but
    // the image's width will be rounded down to 0 on some browsers (Firefox) prior to being drawn at that scale.
    if (this._canvas.width <= 0 || this._canvas.height <= 0 || this._cachedImage.naturalWidth <= 0 || this._cachedImage.naturalHeight <= 0) return;
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this._context.drawImage(this._cachedImage, 0, 0);
  }
}
module.exports = SvgRenderer;

/***/ }),

/***/ "./src/transform-applier.js":
/*!**********************************!*\
  !*** ./src/transform-applier.js ***!
  \**********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const Matrix = __webpack_require__(/*! transformation-matrix */ "./node_modules/transformation-matrix/build-es/index.js");
const SvgElement = __webpack_require__(/*! ./svg-element */ "./src/svg-element.js");
const log = __webpack_require__(/*! ./util/log */ "./src/util/log.js");

/**
 * @fileOverview Apply transforms to match stroke width appearance in 2.0 and 3.0
 */

// Adapted from paper.js's Path.applyTransform
const _parseTransform = function _parseTransform(domElement) {
  let matrix = Matrix.identity();
  const string = domElement.attributes && domElement.attributes.transform && domElement.attributes.transform.value;
  if (!string) return matrix;
  // https://www.w3.org/TR/SVG/types.html#DataTypeTransformList
  // Parse SVG transform string. First we split at /)\s*/, to separate
  // commands
  const transforms = string.split(/\)\s*/g);
  for (const transform of transforms) {
    if (!transform) break;
    // Command come before the '(', values after
    const parts = transform.split(/\(\s*/);
    const command = parts[0].trim();
    const v = parts[1].split(/[\s,]+/g);
    // Convert values to floats
    for (let j = 0; j < v.length; j++) {
      v[j] = parseFloat(v[j]);
    }
    switch (command) {
      case 'matrix':
        matrix = Matrix.compose(matrix, {
          a: v[0],
          b: v[1],
          c: v[2],
          d: v[3],
          e: v[4],
          f: v[5]
        });
        break;
      case 'rotate':
        matrix = Matrix.compose(matrix, Matrix.rotateDEG(v[0], v[1] || 0, v[2] || 0));
        break;
      case 'translate':
        matrix = Matrix.compose(matrix, Matrix.translate(v[0], v[1] || 0));
        break;
      case 'scale':
        matrix = Matrix.compose(matrix, Matrix.scale(v[0], v[1] || v[0]));
        break;
      case 'skewX':
        matrix = Matrix.compose(matrix, Matrix.skewDEG(v[0], 0));
        break;
      case 'skewY':
        matrix = Matrix.compose(matrix, Matrix.skewDEG(0, v[0]));
        break;
      default:
        log.error("Couldn't parse: ".concat(command));
    }
  }
  return matrix;
};

// Adapted from paper.js's Matrix.decompose
// Given a matrix, return the x and y scale factors of the matrix
const _getScaleFactor = function _getScaleFactor(matrix) {
  const a = matrix.a;
  const b = matrix.b;
  const c = matrix.c;
  const d = matrix.d;
  const det = a * d - b * c;
  if (a !== 0 || b !== 0) {
    const r = Math.sqrt(a * a + b * b);
    return {
      x: r,
      y: det / r
    };
  }
  if (c !== 0 || d !== 0) {
    const s = Math.sqrt(c * c + d * d);
    return {
      x: det / s,
      y: s
    };
  }
  // a = b = c = d = 0
  return {
    x: 0,
    y: 0
  };
};

// Returns null if matrix is not invertible. Otherwise returns given ellipse
// transformed by transform, an object {radiusX, radiusY, rotation}.
const _calculateTransformedEllipse = function _calculateTransformedEllipse(radiusX, radiusY, theta, transform) {
  theta = -theta * Math.PI / 180;
  const a = transform.a;
  const b = -transform.c;
  const c = -transform.b;
  const d = transform.d;
  // Since other parameters determine the translation of the ellipse in SVG, we do not need to worry
  // about what e and f are.
  const det = a * d - b * c;
  // Non-invertible matrix
  if (det === 0) return null;

  // rotA, rotB, and rotC represent Ax^2 + Bxy + Cy^2 = 1 coefficients for a rotated ellipse formula
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);
  const sin2T = Math.sin(2 * theta);
  const rotA = cosT * cosT / radiusX / radiusX + sinT * sinT / radiusY / radiusY;
  const rotB = sin2T / radiusX / radiusX - sin2T / radiusY / radiusY;
  const rotC = sinT * sinT / radiusX / radiusX + cosT * cosT / radiusY / radiusY;

  // Calculate the ellipse formula of the transformed ellipse
  // A, B, and C represent Ax^2 + Bxy + Cy^2 = 1 / det / det coefficients in a transformed ellipse formula
  // scaled by inverse det squared (to preserve accuracy)
  const A = rotA * d * d - rotB * d * c + rotC * c * c;
  const B = -2 * rotA * b * d + rotB * a * d + rotB * b * c - 2 * rotC * a * c;
  const C = rotA * b * b - rotB * a * b + rotC * a * a;

  // Derive new radii and theta from the transformed ellipse formula
  const newRadiusXOverDet = Math.sqrt(2) * Math.sqrt((A + C - Math.sqrt(A * A + B * B - 2 * A * C + C * C)) / (-B * B + 4 * A * C));
  const newRadiusYOverDet = 1 / Math.sqrt(A + C - 1 / newRadiusXOverDet / newRadiusXOverDet);
  let temp = (A - 1 / newRadiusXOverDet / newRadiusXOverDet) / (1 / newRadiusYOverDet / newRadiusYOverDet - 1 / newRadiusXOverDet / newRadiusXOverDet);
  if (temp < 0 && Math.abs(temp) < 1e-8) temp = 0; // Fix floating point issue
  temp = Math.sqrt(temp);
  if (Math.abs(1 - temp) < 1e-8) temp = 1; // Fix floating point issue
  // Solve for which of the two possible thetas is correct
  let newTheta = Math.asin(temp);
  temp = B / (1 / newRadiusXOverDet / newRadiusXOverDet - 1 / newRadiusYOverDet / newRadiusYOverDet);
  const newTheta2 = -newTheta;
  if (Math.abs(Math.sin(2 * newTheta2) - temp) < Math.abs(Math.sin(2 * newTheta) - temp)) {
    newTheta = newTheta2;
  }
  return {
    radiusX: newRadiusXOverDet * det,
    radiusY: newRadiusYOverDet * det,
    rotation: -newTheta * 180 / Math.PI
  };
};

// Adapted from paper.js's PathItem.setPathData
const _transformPath = function _transformPath(pathString, transform) {
  if (!transform || Matrix.toString(transform) === Matrix.toString(Matrix.identity())) return pathString;
  // First split the path data into parts of command-coordinates pairs
  // Commands are any of these characters: mzlhvcsqta
  const parts = pathString && pathString.match(/[mlhvcsqtaz][^mlhvcsqtaz]*/ig);
  let coords;
  let relative = false;
  let previous;
  let control;
  let current = {
    x: 0,
    y: 0
  };
  let start = {
    x: 0,
    y: 0
  };
  let result = '';
  const getCoord = function getCoord(index, coord) {
    let val = +coords[index];
    if (relative) {
      val += current[coord];
    }
    return val;
  };
  const getPoint = function getPoint(index) {
    return {
      x: getCoord(index, 'x'),
      y: getCoord(index + 1, 'y')
    };
  };
  const roundTo4Places = function roundTo4Places(num) {
    return Number(num.toFixed(4));
  };

  // Returns the transformed point as a string
  const getString = function getString(point) {
    const transformed = Matrix.applyToPoint(transform, point);
    return "".concat(roundTo4Places(transformed.x), " ").concat(roundTo4Places(transformed.y), " ");
  };
  for (let i = 0, l = parts && parts.length; i < l; i++) {
    const part = parts[i];
    const command = part[0];
    const lower = command.toLowerCase();
    // Match all coordinate values
    coords = part.match(/[+-]?(?:\d*\.\d+|\d+\.?)(?:[eE][+-]?\d+)?/g);
    const length = coords && coords.length;
    relative = command === lower;
    // Fix issues with z in the middle of SVG path data, not followed by
    // a m command, see paper.js#413:
    if (previous === 'z' && !/[mz]/.test(lower)) {
      result += "M ".concat(current.x, " ").concat(current.y, " ");
    }
    switch (lower) {
      case 'm': // Move to
      case 'l':
        // Line to
        {
          let move = lower === 'm';
          for (let j = 0; j < length; j += 2) {
            result += move ? 'M ' : 'L ';
            current = getPoint(j);
            result += getString(current);
            if (move) {
              start = current;
              move = false;
            }
          }
          control = current;
          break;
        }
      case 'h': // Horizontal line
      case 'v':
        // Vertical line
        {
          const coord = lower === 'h' ? 'x' : 'y';
          current = {
            x: current.x,
            y: current.y
          }; // Clone as we're going to modify it.
          for (let j = 0; j < length; j++) {
            current[coord] = getCoord(j, coord);
            result += "L ".concat(getString(current));
          }
          control = current;
          break;
        }
      case 'c':
        // Cubic Bezier curve
        for (let j = 0; j < length; j += 6) {
          const handle1 = getPoint(j);
          control = getPoint(j + 2);
          current = getPoint(j + 4);
          result += "C ".concat(getString(handle1)).concat(getString(control)).concat(getString(current));
        }
        break;
      case 's':
        // Smooth cubic Bezier curve
        for (let j = 0; j < length; j += 4) {
          const handle1 = /[cs]/.test(previous) ? {
            x: current.x * 2 - control.x,
            y: current.y * 2 - control.y
          } : current;
          control = getPoint(j);
          current = getPoint(j + 2);
          result += "C ".concat(getString(handle1)).concat(getString(control)).concat(getString(current));
          previous = lower;
        }
        break;
      case 'q':
        // Quadratic Bezier curve
        for (let j = 0; j < length; j += 4) {
          control = getPoint(j);
          current = getPoint(j + 2);
          result += "Q ".concat(getString(control)).concat(getString(current));
        }
        break;
      case 't':
        // Smooth quadratic Bezier curve
        for (let j = 0; j < length; j += 2) {
          control = /[qt]/.test(previous) ? {
            x: current.x * 2 - control.x,
            y: current.y * 2 - control.y
          } : current;
          current = getPoint(j);
          result += "Q ".concat(getString(control)).concat(getString(current));
          previous = lower;
        }
        break;
      case 'a':
        // Elliptical arc curve
        for (let j = 0; j < length; j += 7) {
          current = getPoint(j + 5);
          const rx = +coords[j];
          const ry = +coords[j + 1];
          const rotation = +coords[j + 2];
          const largeArcFlag = +coords[j + 3];
          let clockwiseFlag = +coords[j + 4];
          const newEllipse = _calculateTransformedEllipse(rx, ry, rotation, transform);
          const matrixScale = _getScaleFactor(transform);
          if (newEllipse) {
            if (matrixScale.x > 0 && matrixScale.y < 0 || matrixScale.x < 0 && matrixScale.y > 0) {
              clockwiseFlag = clockwiseFlag ^ 1;
            }
            result += "A ".concat(roundTo4Places(Math.abs(newEllipse.radiusX)), " ") + "".concat(roundTo4Places(Math.abs(newEllipse.radiusY)), " ") + "".concat(roundTo4Places(newEllipse.rotation), " ").concat(largeArcFlag, " ") + "".concat(clockwiseFlag, " ").concat(getString(current));
          } else {
            result += "L ".concat(getString(current));
          }
        }
        break;
      case 'z':
        // Close path
        result += "Z ";
        // Correctly handle relative m commands, see paper.js#1101:
        current = start;
        break;
    }
    previous = lower;
  }
  return result;
};
const GRAPHICS_ELEMENTS = ['circle', 'ellipse', 'image', 'line', 'path', 'polygon', 'polyline', 'rect', 'text', 'use'];
const CONTAINER_ELEMENTS = ['a', 'defs', 'g', 'marker', 'glyph', 'missing-glyph', 'pattern', 'svg', 'switch', 'symbol'];
const _isContainerElement = function _isContainerElement(element) {
  return element.tagName && CONTAINER_ELEMENTS.includes(element.tagName.toLowerCase());
};
const _isGraphicsElement = function _isGraphicsElement(element) {
  return element.tagName && GRAPHICS_ELEMENTS.includes(element.tagName.toLowerCase());
};
const _isPathWithTransformAndStroke = function _isPathWithTransformAndStroke(element, strokeWidth) {
  if (!element.attributes) return false;
  strokeWidth = element.attributes['stroke-width'] ? Number(element.attributes['stroke-width'].value) : Number(strokeWidth);
  return strokeWidth && element.tagName && element.tagName.toLowerCase() === 'path' && element.attributes.d && element.attributes.d.value;
};
const _quadraticMean = function _quadraticMean(a, b) {
  return Math.sqrt((a * a + b * b) / 2);
};
const _createGradient = function _createGradient(gradientId, svgTag, bbox, matrix) {
  // Adapted from Paper.js's SvgImport.getValue
  const getValue = function getValue(node, name, isString, allowNull, allowPercent, defaultValue) {
    // Interpret value as number. Never return NaN, but 0 instead.
    // If the value is a sequence of numbers, parseFloat will
    // return the first occurring number, which is enough for now.
    let value = SvgElement.get(node, name);
    let res;
    if (value === null) {
      if (defaultValue) {
        res = defaultValue;
        if (/%\s*$/.test(res)) {
          value = defaultValue;
          res = parseFloat(value);
        }
      } else if (allowNull) {
        res = null;
      } else if (isString) {
        res = '';
      } else {
        res = 0;
      }
    } else if (isString) {
      res = value;
    } else {
      res = parseFloat(value);
    }
    // Support for dimensions in percentage of the root size. If root-size
    // is not set (e.g. during <defs>), just scale the percentage value to
    // 0..1, as required by gradients with gradientUnits="objectBoundingBox"
    if (/%\s*$/.test(value)) {
      const size = allowPercent ? 1 : bbox[/x|^width/.test(name) ? 'width' : 'height'];
      return res / 100 * size;
    }
    return res;
  };
  const getPoint = function getPoint(node, x, y, allowNull, allowPercent, defaultX, defaultY) {
    x = getValue(node, x || 'x', false, allowNull, allowPercent, defaultX);
    y = getValue(node, y || 'y', false, allowNull, allowPercent, defaultY);
    return allowNull && (x === null || y === null) ? null : {
      x,
      y
    };
  };
  let defs = svgTag.getElementsByTagName('defs');
  if (defs.length === 0) {
    defs = SvgElement.create('defs');
    svgTag.appendChild(defs);
  } else {
    defs = defs[0];
  }

  // Clone the old gradient. We'll make a new one, since the gradient might be reused elsewhere
  // with different transform matrix
  const oldGradient = svgTag.getElementById(gradientId);
  if (!oldGradient) return;
  const radial = oldGradient.tagName.toLowerCase() === 'radialgradient';
  const newGradient = svgTag.getElementById(gradientId).cloneNode(true /* deep */);

  // Give the new gradient a new ID
  let matrixString = Matrix.toString(matrix);
  matrixString = matrixString.substring(8, matrixString.length - 1);
  const newGradientId = "".concat(gradientId, "-").concat(matrixString);
  newGradient.setAttribute('id', newGradientId);

  // This gradient already exists and was transformed before. Just reuse the already-transformed one.
  if (svgTag.getElementById(newGradientId)) {
    // This is the same code as in the end of the function, but I don't feel like wrapping the next 80 lines
    // in an `if (!svgTag.getElementById(newGradientId))` block
    return "url(#".concat(newGradientId, ")");
  }
  const scaleToBounds = getValue(newGradient, 'gradientUnits', true) !== 'userSpaceOnUse';
  let origin;
  let destination;
  let radius;
  let focal;
  if (radial) {
    origin = getPoint(newGradient, 'cx', 'cy', false, scaleToBounds, '50%', '50%');
    radius = getValue(newGradient, 'r', false, false, scaleToBounds, '50%');
    focal = getPoint(newGradient, 'fx', 'fy', true, scaleToBounds);
  } else {
    origin = getPoint(newGradient, 'x1', 'y1', false, scaleToBounds);
    destination = getPoint(newGradient, 'x2', 'y2', false, scaleToBounds, '1');
    if (origin.x === destination.x && origin.y === destination.y) {
      // If it's degenerate, use the color of the last stop, as described by
      // https://www.w3.org/TR/SVG/pservers.html#LinearGradientNotes
      const stops = newGradient.getElementsByTagName('stop');
      if (!stops.length || !stops[stops.length - 1].attributes || !stops[stops.length - 1].attributes['stop-color']) {
        return null;
      }
      return stops[stops.length - 1].attributes['stop-color'].value;
    }
  }

  // Transform points
  // Emulate SVG's gradientUnits="objectBoundingBox"
  if (scaleToBounds) {
    const boundsMatrix = Matrix.compose(Matrix.translate(bbox.x, bbox.y), Matrix.scale(bbox.width, bbox.height));
    origin = Matrix.applyToPoint(boundsMatrix, origin);
    if (destination) destination = Matrix.applyToPoint(boundsMatrix, destination);
    if (radius) {
      radius = _quadraticMean(bbox.width, bbox.height) * radius;
    }
    if (focal) focal = Matrix.applyToPoint(boundsMatrix, focal);
  }
  if (radial) {
    origin = Matrix.applyToPoint(matrix, origin);
    const matrixScale = _getScaleFactor(matrix);
    radius = _quadraticMean(matrixScale.x, matrixScale.y) * radius;
    if (focal) focal = Matrix.applyToPoint(matrix, focal);
  } else {
    const dot = (a, b) => a.x * b.x + a.y * b.y;
    const multiply = (coefficient, v) => ({
      x: coefficient * v.x,
      y: coefficient * v.y
    });
    const add = (a, b) => ({
      x: a.x + b.x,
      y: a.y + b.y
    });
    const subtract = (a, b) => ({
      x: a.x - b.x,
      y: a.y - b.y
    });

    // The line through origin and gradientPerpendicular is the line at which the gradient starts
    let gradientPerpendicular = Math.abs(origin.x - destination.x) < 1e-8 ? add(origin, {
      x: 1,
      y: (origin.x - destination.x) / (destination.y - origin.y)
    }) : add(origin, {
      x: (destination.y - origin.y) / (origin.x - destination.x),
      y: 1
    });

    // Transform points
    gradientPerpendicular = Matrix.applyToPoint(matrix, gradientPerpendicular);
    origin = Matrix.applyToPoint(matrix, origin);
    destination = Matrix.applyToPoint(matrix, destination);

    // Calculate the direction that the gradient has changed to
    const originToPerpendicular = subtract(gradientPerpendicular, origin);
    const originToDestination = subtract(destination, origin);
    const gradientDirection = Math.abs(originToPerpendicular.x) < 1e-8 ? {
      x: 1,
      y: -originToPerpendicular.x / originToPerpendicular.y
    } : {
      x: -originToPerpendicular.y / originToPerpendicular.x,
      y: 1
    };

    // Set the destination so that the gradient moves in the correct direction, by projecting the destination vector
    // onto the gradient direction vector
    const projectionCoeff = dot(originToDestination, gradientDirection) / dot(gradientDirection, gradientDirection);
    const projection = multiply(projectionCoeff, gradientDirection);
    destination = {
      x: origin.x + projection.x,
      y: origin.y + projection.y
    };
  }

  // Put values back into svg
  if (radial) {
    newGradient.setAttribute('cx', Number(origin.x.toFixed(4)));
    newGradient.setAttribute('cy', Number(origin.y.toFixed(4)));
    newGradient.setAttribute('r', Number(radius.toFixed(4)));
    if (focal) {
      newGradient.setAttribute('fx', Number(focal.x.toFixed(4)));
      newGradient.setAttribute('fy', Number(focal.y.toFixed(4)));
    }
  } else {
    newGradient.setAttribute('x1', Number(origin.x.toFixed(4)));
    newGradient.setAttribute('y1', Number(origin.y.toFixed(4)));
    newGradient.setAttribute('x2', Number(destination.x.toFixed(4)));
    newGradient.setAttribute('y2', Number(destination.y.toFixed(4)));
  }
  newGradient.setAttribute('gradientUnits', 'userSpaceOnUse');
  defs.appendChild(newGradient);
  return "url(#".concat(newGradientId, ")");
};

// Adapted from paper.js's SvgImport.getDefinition
const _parseUrl = (value, windowRef) => {
  // When url() comes from a style property, '#'' seems to be missing on
  // WebKit. We also get variations of quotes or no quotes, single or
  // double, so handle it all with one regular expression:
  const match = value && value.match(/\((?:["'#]*)([^"')]+)/);
  const name = match && match[1];
  const res = name && windowRef ?
  // This is required by Firefox, which can produce absolute
  // urls for local gradients, see paperjs#1001:
  name.replace("".concat(windowRef.location.href.split('#')[0], "#"), '') : name;
  return res;
};

/**
 * Scratch 2.0 displays stroke widths in a "normalized" way, that is,
 * if a shape with a stroke width has a transform applied, it will be
 * rendered with a stroke that is the same width all the way around,
 * instead of stretched looking.
 *
 * The vector paint editor also prefers to normalize the stroke width,
 * rather than keep track of transforms at the group level, as this
 * simplifies editing (e.g. stroke width 3 always means the same thickness)
 *
 * This function performs that normalization process, pushing transforms
 * on groups down to the leaf level and averaging out the stroke width
 * around the shapes. Note that this doens't just change stroke widths, it
 * changes path data and attributes throughout the SVG.
 *
 * @param {SVGElement} svgTag The SVG dom object
 * @param {Window} windowRef The window to use. Need to pass in for
 *     tests to work, as they get angry at even the mention of window.
 * @param {object} bboxForTesting The bounds to use. Need to pass in for
 *     tests only, because getBBox doesn't work in Node. This should
 *     be the bounds of the svgTag without including stroke width or transforms.
 * @return {void}
 */
const transformStrokeWidths = function transformStrokeWidths(svgTag, windowRef, bboxForTesting) {
  const inherited = Matrix.identity();
  const applyTransforms = (element, matrix, strokeWidth, fill, stroke) => {
    if (_isContainerElement(element)) {
      // Push fills and stroke width down to leaves
      if (element.attributes['stroke-width']) {
        strokeWidth = element.attributes['stroke-width'].value;
      }
      if (element.attributes) {
        if (element.attributes.fill) fill = element.attributes.fill.value;
        if (element.attributes.stroke) stroke = element.attributes.stroke.value;
      }

      // If any child nodes don't take attributes, leave the attributes
      // at the parent level.
      for (let i = 0; i < element.childNodes.length; i++) {
        applyTransforms(element.childNodes[i], Matrix.compose(matrix, _parseTransform(element)), strokeWidth, fill, stroke);
      }
      element.removeAttribute('transform');
      element.removeAttribute('stroke-width');
      element.removeAttribute('fill');
      element.removeAttribute('stroke');
    } else if (_isPathWithTransformAndStroke(element, strokeWidth)) {
      if (element.attributes['stroke-width']) {
        strokeWidth = element.attributes['stroke-width'].value;
      }
      if (element.attributes.fill) fill = element.attributes.fill.value;
      if (element.attributes.stroke) stroke = element.attributes.stroke.value;
      matrix = Matrix.compose(matrix, _parseTransform(element));
      if (Matrix.toString(matrix) === Matrix.toString(Matrix.identity())) {
        element.removeAttribute('transform');
        element.setAttribute('stroke-width', strokeWidth);
        if (fill) element.setAttribute('fill', fill);
        if (stroke) element.setAttribute('stroke', stroke);
        return;
      }

      // Transform gradient
      const fillGradientId = _parseUrl(fill, windowRef);
      const strokeGradientId = _parseUrl(stroke, windowRef);
      if (fillGradientId || strokeGradientId) {
        const doc = windowRef.document;
        // Need path bounds to transform gradient
        const svgSpot = doc.createElement('span');
        let bbox;
        if (bboxForTesting) {
          bbox = bboxForTesting;
        } else {
          try {
            doc.body.appendChild(svgSpot);
            const svg = SvgElement.set(doc.createElementNS(SvgElement.svg, 'svg'));
            const path = SvgElement.set(doc.createElementNS(SvgElement.svg, 'path'));
            path.setAttribute('d', element.attributes.d.value);
            svg.appendChild(path);
            svgSpot.appendChild(svg);
            // Take the bounding box.
            bbox = svg.getBBox();
          } finally {
            // Always destroy the element, even if, for example, getBBox throws.
            doc.body.removeChild(svgSpot);
          }
        }
        if (fillGradientId) {
          const newFillRef = _createGradient(fillGradientId, svgTag, bbox, matrix);
          if (newFillRef) fill = newFillRef;
        }
        if (strokeGradientId) {
          const newStrokeRef = _createGradient(strokeGradientId, svgTag, bbox, matrix);
          if (newStrokeRef) stroke = newStrokeRef;
        }
      }

      // Transform path data
      element.setAttribute('d', _transformPath(element.attributes.d.value, matrix));
      element.removeAttribute('transform');

      // Transform stroke width
      const matrixScale = _getScaleFactor(matrix);
      element.setAttribute('stroke-width', _quadraticMean(matrixScale.x, matrixScale.y) * strokeWidth);
      if (fill) element.setAttribute('fill', fill);
      if (stroke) element.setAttribute('stroke', stroke);
    } else if (_isGraphicsElement(element)) {
      // Push stroke width, fill, and stroke down to leaves
      if (strokeWidth && !element.attributes['stroke-width']) {
        element.setAttribute('stroke-width', strokeWidth);
      }
      if (fill && !element.attributes.fill) {
        element.setAttribute('fill', fill);
      }
      if (stroke && !element.attributes.stroke) {
        element.setAttribute('stroke', stroke);
      }

      // Push transform down to leaves
      matrix = Matrix.compose(matrix, _parseTransform(element));
      if (Matrix.toString(matrix) === Matrix.toString(Matrix.identity())) {
        element.removeAttribute('transform');
      } else {
        element.setAttribute('transform', Matrix.toString(matrix));
      }
    }
  };
  applyTransforms(svgTag, inherited, 1 /* default SVG stroke width */);
};
module.exports = transformStrokeWidths;

/***/ }),

/***/ "./src/util/log.js":
/*!*************************!*\
  !*** ./src/util/log.js ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const minilog = __webpack_require__(/*! minilog */ "./node_modules/minilog/lib/web/index.js");
minilog.enable();
module.exports = minilog('scratch-svg-render');

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
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"ScratchSVGRenderer": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkScratchSVGRenderer"] = self["webpackChunkScratchSVGRenderer"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_base64-js_index_js-node_modules_css-tree_lib_index_js-node_modules_faste-c03cee"], () => (__webpack_require__("./src/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=ScratchSVGRenderer.js.map