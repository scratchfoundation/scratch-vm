export = Video;
declare class Video {
    static get FORMAT_IMAGE_DATA(): string;
    static get FORMAT_CANVAS(): string;
    /**
     * Dimensions the video stream is analyzed at after its rendered to the
     * sample canvas.
     * @type {Array.<number>}
     */
    static get DIMENSIONS(): number[];
    /**
     * Order preview drawable is inserted at in the renderer.
     * @type {number}
     */
    static get ORDER(): number;
    constructor(runtime: any);
    runtime: any;
    /**
     * @typedef VideoProvider
     * @property {Function} enableVideo - Requests camera access from the user, and upon success,
     * enables the video feed
     * @property {Function} disableVideo - Turns off the video feed
     * @property {Function} getFrame - Return frame data from the video feed in
     * specified dimensions, format, and mirroring.
     */
    provider: any;
    /**
     * Id representing a Scratch Renderer skin the video is rendered to for
     * previewing.
     * @type {number}
     */
    _skinId: number;
    /**
     * Id for a drawable using the video's skin that will render as a video
     * preview.
     * @type {Drawable}
     */
    _drawable: Drawable;
    /**
     * Store the last state of the video transparency ghost effect
     * @type {number}
     */
    _ghost: number;
    /**
     * Store a flag that allows the preview to be forced transparent.
     * @type {number}
     */
    _forceTransparentPreview: number;
    /**
     * Set a video provider for this device. A default implementation of
     * a video provider can be found in scratch-gui/src/lib/video/video-provider
     * @param {VideoProvider} provider - Video provider to use
     */
    setProvider(provider: VideoProvider): void;
    /**
     * Request video be enabled.  Sets up video, creates video skin and enables preview.
     *
     * ioDevices.video.requestVideo()
     *
     * @return {Promise.<Video>} resolves a promise to this IO device when video is ready.
     */
    enableVideo(): Promise<Video>;
    /**
     * Disable video stream (turn video off)
     * @return {void}
     */
    disableVideo(): void;
    /**
     * Return frame data from the video feed in a specified dimensions, format, and mirroring.
     *
     * @param {object} frameInfo A descriptor of the frame you would like to receive.
     * @param {Array.<number>=} frameInfo.dimensions [width, height] array of numbers.  Defaults to [480,360]
     * @param {boolean=} frameInfo.mirror If you specificly want a mirror/non-mirror frame, defaults to the global
     *                                   mirror state (ioDevices.video.mirror)
     * @param {string=} frameInfo.format Requested video format, available formats are 'image-data' and 'canvas'.
     * @param {number=} frameInfo.cacheTimeout Will reuse previous image data if the time since capture is less than
     *                                        the cacheTimeout.  Defaults to 16ms.
     *
     * @return {ArrayBuffer|Canvas|string|null} Frame data in requested format, null when errors.
     */
    getFrame({ dimensions, mirror, format, cacheTimeout }: {
        dimensions?: Array<number> | undefined;
        mirror?: boolean | undefined;
        format?: string | undefined;
        cacheTimeout?: number | undefined;
    }): ArrayBuffer | Canvas | string | null;
    /**
     * Set the preview ghost effect
     * @param {number} ghost from 0 (visible) to 100 (invisible) - ghost effect
     */
    setPreviewGhost(ghost: number): void;
    _disablePreview(): void;
    _renderPreviewFrame: any;
    _setupPreview(): void;
    _renderPreviewTimeout: NodeJS.Timeout;
    get videoReady(): any;
    /**
     * Method implemented by all IO devices to allow external changes.
     * The only change available externally is hiding the preview, used e.g. to
     * prevent drawing the preview into project thumbnails.
     * @param {object} - data passed to this IO device.
     * @property {boolean} forceTransparentPreview - whether the preview should be forced transparent.
     */
    postData({ forceTransparentPreview }: object): void;
}
