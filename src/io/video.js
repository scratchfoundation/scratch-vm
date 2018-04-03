const log = require('../util/log');

class Video {
    constructor (runtime) {
        /**
         * Reference to the owning Runtime.
         * @type{!Runtime}
         */
        this.runtime = runtime;

        /**
         * Cache frames for this many ms.
         * @type number
         */
        this._frameCacheTimeout = 16;

        /**
         * Store each request for video, so when all are released we can disable preview/video feed.
         * @type Array.<object>
         */
        this._requests = [];

        /**
         * DOM Video element
         * @private
         */
        this._video = null;

        /**
         * Usermedia stream track
         * @private
         */
        this._track = null;

        /**
         * Stores some canvas/frame data per resolution/mirror states
         */
        this._workspace = [];

        /**
         * Id representing a Scratch Renderer skin the video is rendered to for
         * previewing.
         * @type {number}
         */
        this._skinId = -1;

        /**
         * The Scratch Renderer Skin object.
         * @type {Skin}
         */
        this._skin = null;

        /**
         * Id for a drawable using the video's skin that will render as a video
         * preview.
         * @type {Drawable}
         */
        this._drawable = -1;
    }

    static get FORMAT_IMAGE_DATA () {
        return 'image-data';
    }

    static get FORMAT_CANVAS () {
        return 'canvas';
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
     * Order preview drawable is inserted at in the renderer.
     * @type {number}
     */
    static get ORDER () {
        return 1;
    }

    /**
     * Request video be enabled.  Sets up video, creates video skin and enables preview.
     *
     * ioDevices.video.requestVideo()
     *   .then(({ release }) => {
     *     this.releaseVideo = release;
     *   })
     *
     * @return {Promise.<VideoRequest>} A request object with a "release" property that
     *      should be called when you are done with the video.
     */
    requestVideo () {
        const io = this;
        const request = {
            release () {
                const index = io._requests.indexOf(request);
                if (index > -1) {
                    io._requests.splice(index, 1);
                }
                if (io._requests.length === 0) {
                    io._disableVideo();
                }
            }
        };

        if (this.videoReady) {
            this._requests.push(request);
            return Promise.resolve(request);
        }

        return this._setupVideo().then(() => {
            this._requests.push(request);
            return request;
        });
    }

    /**
     * Create a video stream.
     * Should probably be moved to -render or somewhere similar later
     * @private
     * @return {Promise} When video has been received, rejected if video is not received
     */
    _setupVideo () {
        if (this._singleSetup) {
            return this._singleSetup;
        }

        this._video = document.createElement('video');
        const video = new Promise((resolve, reject) => {
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
                resolve(this._video);
            }, err => {
                // There are probably some error types we could handle gracefully here.
                this._singleSetup = null;
                reject(err);
            });
        });

        this._singleSetup = video.then(() => this._setupPreview());
        return this._singleSetup;
    }

    disableVideo () {
        this._disablePreview();
        this._singleSetup = null;
        // by clearing refs to video and track, we should lose our hold over the camera
        this._video = null;
        this._track = null;
    }

    _disablePreview () {
        if (this._skin && this._drawable) {
            this._skin.clear();
            this._drawable.updateProperties({visible: false});
        }
        this._renderPreviewFrame = null;
    }

    _setupPreview () {
        const {renderer} = this.runtime;
        if (!renderer) return;

        if (this._skinId === -1 && this._skin === null && this._drawable === -1) {
            this._skinId = renderer.createPenSkin();
            this._skin = renderer._allSkins[this._skinId];
            this._drawable = renderer.createDrawable();
            renderer.setDrawableOrder(
                this._drawable,
                Video.ORDER
            );
            renderer.updateDrawableProperties(this._drawable, {
                skinId: this._skinId
            });
        }

        // if we haven't already created and started a preview frame render loop, do so
        if (!this._renderPreviewFrame) {
            this._drawable.updateProperties({visible: true});

            this._renderPreviewFrame = () => {
                if (!this._renderPreviewFrame) {
                    return;
                }

                setTimeout(this._renderPreviewFrame, this.runtime.currentStepTime);

                const canvas = this.getFrame({format: Video.FORMAT_CANVAS});

                if (!canvas) {
                    return;
                }

                const xOffset = Video.DIMENSIONS[0] / -2;
                const yOffset = Video.DIMENSIONS[1] / 2;
                this._skin.drawStamp(canvas, xOffset, yOffset);
                this.runtime.requestRedraw();
            };

            this._renderPreviewFrame();
        }
    }

    /**
     * Set the preview ghost effect
     * @param {number} ghost from 0 (visible) to 100 (invisible) - ghost effect
     */
    setPreviewGhost (ghost) {
        if (this._drawable) {
            this._drawable.updateProperties({ghost});
        }
    }

    get videoReady () {
        if (!this._video) {
            return false;
        }
        if (!this._track) {
            return false;
        }
        const {videoWidth, videoHeight} = this._video;
        if (typeof videoWidth !== 'number' || typeof videoHeight !== 'number') {
            return false;
        }
        if (videoWidth === 0 || videoHeight === 0) {
            return false;
        }
        return true;
    }

    /**
     * get an internal workspace for canvas/context/caches
     * this uses some document stuff to create a canvas and what not, probably needs abstraction
     * into the renderer layer?
     * @private
     * @return {object} A workspace for canvas/data storage.  Internal format not documented intentionally
     */
    _getWorkspace ({dimensions, mirror}) {
        let workspace = this._workspace.find(space => (
            space.dimensions.join('-') === dimensions.join('-') &&
            space.mirror === mirror
        ));
        if (!workspace) {
            workspace = {
                dimensions,
                mirror,
                canvas: document.createElement('canvas'),
                lastUpdate: 0,
                cacheData: {}
            };
            workspace.canvas.width = dimensions[0];
            workspace.canvas.height = dimensions[1];
            workspace.context = workspace.canvas.getContext('2d');
            this._workspace.push(workspace);
        }
        return workspace;
    }

    /**
     * Return frame data from the video feed in a specified dimensions, format, and mirroring.
     * @return {ArrayBuffer|Canvas|string|null} Frame data in requested format, null when errors.
     */
    getFrame ({
        dimensions = Video.DIMENSIONS,
        mirror = true,
        format = Video.FORMAT_IMAGE_DATA,
        cacheTimeout = this._frameCacheTimeout
    }) {
        if (!this.videoReady) {
            return null;
        }
        const [width, height] = dimensions;
        const workspace = this._getWorkspace({dimensions, mirror: Boolean(mirror)});
        const {videoWidth, videoHeight} = this._video;
        const {canvas, context, lastUpdate, cacheData} = workspace;
        const now = Date.now();

        // if the canvas hasn't been updated...
        if (lastUpdate + cacheTimeout < now) {

            if (mirror) {
                context.scale(-1, 1);
                context.translate(width * -1, 0);
            }

            context.drawImage(this._video,
                // source x, y, width, height
                0, 0, videoWidth, videoHeight,
                // dest x, y, width, height
                0, 0, width, height
            );

            context.resetTransform();
            workspace.lastUpdate = now;
        }

        // each data type has it's own data cache, but the canvas is the same
        if (!cacheData[format]) {
            cacheData[format] = {lastUpdate: 0};
        }
        const formatCache = cacheData[format];

        if (formatCache.lastUpdate + cacheTimeout < now) {
            if (format === Video.FORMAT_IMAGE_DATA) {
                formatCache.lastData = context.getImageData(0, 0, width, height);
            } else if (format === Video.FORMAT_CANVAS) {
                // this will never change
                formatCache.lastUpdate = Infinity;
                formatCache.lastData = canvas;
            } else {
                log.error(`video io error - unimplemented format ${format}`);
                // cache the null result forever, don't log about it again..
                formatCache.lastUpdate = Infinity;
                formatCache.lastData = null;
            }

            // rather than set to now, this data is as stale as it's canvas is
            formatCache.lastUpdate = Math.max(workspace.lastUpdate, formatCache.lastUpdate);
        }

        return formatCache.lastData;
    }
}


module.exports = Video;
