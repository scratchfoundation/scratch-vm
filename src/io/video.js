const StageLayering = require('../engine/stage-layering');

class Video {
    constructor (runtime) {
        this.runtime = runtime;

        /**
         * @typedef VideoProvider
         * @property {Function} enableVideo - Requests camera access from the user, and upon success,
         * enables the video feed
         * @property {Function} disableVideo - Turns off the video feed
         * @property {Function} getFrame - Return frame data from the video feed in
         * specified dimensions, format, and mirroring.
         */
        this.provider = null;

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

        /**
         * Store the last state of the video transparency ghost effect
         * @type {number}
         */
        this._ghost = 0;

        /**
         * Store a flag that allows the preview to be forced transparent.
         * @type {number}
         */
        this._forceTransparentPreview = false;
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
     * Set a video provider for this device. A default implementation of
     * a video provider can be found in scratch-gui/src/lib/video/video-provider
     * @param {VideoProvider} provider - Video provider to use
     */
    setProvider (provider) {
        this.provider = provider;
    }

    /**
     * Request video be enabled.  Sets up video, creates video skin and enables preview.
     *
     * ioDevices.video.requestVideo()
     *
     * @return {Promise.<Video>} resolves a promise to this IO device when video is ready.
     */
    enableVideo () {
        if (!this.provider) return null;
        return this.provider.enableVideo().then(() => this._setupPreview());
    }

    /**
     * Disable video stream (turn video off)
     * @return {void}
     */
    disableVideo () {
        this._disablePreview();
        if (!this.provider) return null;
        this.provider.disableVideo();
    }

    /**
     * Return frame data from the video feed in a specified dimensions, format, and mirroring.
     *
     * @param {object} frameInfo A descriptor of the frame you would like to receive.
     * @param {Array.<number>} frameInfo.dimensions [width, height] array of numbers.  Defaults to [480,360]
     * @param {boolean} frameInfo.mirror If you specificly want a mirror/non-mirror frame, defaults to the global
     *                                   mirror state (ioDevices.video.mirror)
     * @param {string} frameInfo.format Requested video format, available formats are 'image-data' and 'canvas'.
     * @param {number} frameInfo.cacheTimeout Will reuse previous image data if the time since capture is less than
     *                                        the cacheTimeout.  Defaults to 16ms.
     *
     * @return {ArrayBuffer|Canvas|string|null} Frame data in requested format, null when errors.
     */
    getFrame ({
        dimensions = Video.DIMENSIONS,
        mirror = this.mirror,
        format = Video.FORMAT_IMAGE_DATA,
        cacheTimeout = this._frameCacheTimeout
    }) {
        if (this.provider) return this.provider.getFrame({dimensions, mirror, format, cacheTimeout});
        return null;
    }

    /**
     * Set the preview ghost effect
     * @param {number} ghost from 0 (visible) to 100 (invisible) - ghost effect
     */
    setPreviewGhost (ghost) {
        this._ghost = ghost;
        // Confirm that the default value has been changed to a valid id for the drawable
        if (this._drawable !== -1) {
            this.runtime.renderer.updateDrawableProperties(this._drawable, {
                ghost: this._forceTransparentPreview ? 100 : ghost
            });
        }
    }

    _disablePreview () {
        if (this._skin) {
            this._skin.clear();
            this.runtime.renderer.updateDrawableProperties(this._drawable, {visible: false});
        }
        this._renderPreviewFrame = null;
    }

    _setupPreview () {
        const {renderer} = this.runtime;
        if (!renderer) return;

        if (this._skinId === -1 && this._skin === null && this._drawable === -1) {
            this._skinId = renderer.createPenSkin();
            this._skin = renderer._allSkins[this._skinId];
            this._drawable = renderer.createDrawable(StageLayering.VIDEO_LAYER);
            renderer.updateDrawableProperties(this._drawable, {
                skinId: this._skinId
            });
        }

        // if we haven't already created and started a preview frame render loop, do so
        if (!this._renderPreviewFrame) {
            renderer.updateDrawableProperties(this._drawable, {
                ghost: this._forceTransparentPreview ? 100 : this._ghost,
                visible: true
            });

            this._renderPreviewFrame = () => {
                clearTimeout(this._renderPreviewTimeout);
                if (!this._renderPreviewFrame) {
                    return;
                }

                this._renderPreviewTimeout = setTimeout(this._renderPreviewFrame, this.runtime.currentStepTime);

                const canvas = this.getFrame({format: Video.FORMAT_CANVAS});

                if (!canvas) {
                    this._skin.clear();
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

    get videoReady () {
        if (this.provider) return this.provider.videoReady;
        return false;
    }

    /**
     * Method implemented by all IO devices to allow external changes.
     * The only change available externally is hiding the preview, used e.g. to
     * prevent drawing the preview into project thumbnails.
     * @param {object} - data passed to this IO device.
     * @property {boolean} forceTransparentPreview - whether the preview should be forced transparent.
     */
    postData ({forceTransparentPreview}) {
        this._forceTransparentPreview = forceTransparentPreview;
        // Setting the ghost to the current value will pick up the forceTransparentPreview
        // flag and override the current ghost. The complexity is to prevent blocks
        // from overriding forceTransparentPreview
        this.setPreviewGhost(this._ghost);
    }
}


module.exports = Video;
