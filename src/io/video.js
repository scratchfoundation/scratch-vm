class Video {
    constructor (runtime) {
        this.runtime = runtime;
        this.provider = null;
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
     *
     * @return {Promise.<Video>} resolves a promise to this IO device when video is ready.
     */
    enableVideo () {
        if (this.provider) return this.provider.enableVideo();
        return null;
    }

    /**
     * Disable video stream (turn video off)
     * @return {void}
     */
    disableVideo () {
        if (this.provider) return this.provider.disableVideo();
        return null;
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
        if (!this.videoReady) {
            return null;
        }
        return null;
    }

    /**
     * Set the preview ghost effect
     * @param {number} ghost from 0 (visible) to 100 (invisible) - ghost effect
     * @return {void}
     */
    setPreviewGhost (ghost) {
        if (this.provider) return this.provider.setPreviewGhost(ghost);
        return null;
    }

    get videoReady () {
        if (this.provider) return this.provider.videoReady();
        return false;
    }

    /**
     * @typedef VideoProvider
     * @property {Function} enableVideo - Requests camera access from the user, and upon success,
     * enables the video feed
     * @property {Function} disableVideo - Turns off the video feed
     * @property {Function} setGhostPreview - Controls the transparency of a visual layer
     * over the video feed
     * @property {Function} getFrame - Return frame data from the video feed in
     * specified dimensions, format, and mirroring.
     */

    /**
     * Set a video provider for this device.
     * @param {VideoProvider} provider - Video provider to use
     */
    setProvider (provider) {
        this.provider = provider;
    }
}


module.exports = Video;
