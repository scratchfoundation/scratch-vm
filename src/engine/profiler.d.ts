export = Profiler;
declare class Profiler {
    /**
     * Lookup or create an id for a frame name.
     * @static
     * @param {string} name The name to return an id for.
     * @return {number} The id for the passed name.
     */
    static idByName(name: string): number;
    /**
     * Reverse lookup the name from a given frame id.
     * @static
     * @param {number} id The id to search for.
     * @return {string} The name for the given id.
     */
    static nameById(id: number): string;
    /**
     * Profiler is only available on platforms with the Performance API.
     * @return {boolean} Can the Profiler run in this browser?
     */
    static available(): boolean;
    /**
     * @param {FrameCallback} onFrame a handle called for each recorded frame.
     * The passed frame value may not be stored as it'll be updated with later
     * frame information. Any information that is further stored by the handler
     * should make copies or reduce the information.
     */
    constructor(onFrame?: FrameCallback);
    /**
     * A series of START and STOP values followed by arguments. After
     * recording is complete the full set of records is reported back by
     * stepping through the series to connect the relative START and STOP
     * information.
     * @type {Array.<*>}
     */
    records: Array<any>;
    /**
     * An array of frames incremented on demand instead as part of start
     * and stop.
     * @type {Array.<ProfilerFrame>}
     */
    increments: Array<ProfilerFrame>;
    /**
     * An array of profiler frames separated by counter argument. Generally
     * for Scratch these frames are separated by block function opcode.
     * This tracks each time an opcode is called.
     * @type {Array.<ProfilerFrame>}
     */
    counters: Array<ProfilerFrame>;
    /**
     * A frame with no id or argument.
     * @type {ProfilerFrame}
     */
    nullFrame: ProfilerFrame;
    /**
     * A cache of ProfilerFrames to reuse when reporting the recorded
     * frames in records.
     * @type {Array.<ProfilerFrame>}
     */
    _stack: Array<ProfilerFrame>;
    /**
     * A callback handle called with each decoded frame when reporting back
     * all the recorded times.
     * @type {FrameCallback}
     */
    onFrame: FrameCallback;
    /**
     * A reference to the START record id constant.
     * @const {number}
     */
    START: number;
    /**
     * A reference to the STOP record id constant.
     * @const {number}
     */
    STOP: number;
    /**
     * Start recording a frame of time for an id and optional argument.
     * @param {number} id The id returned by idByName for a name symbol like
     * Runtime._step.
     * @param {?*} arg An arbitrary argument value to store with the frame.
     */
    start(id: number, arg: any | null): void;
    /**
     * Stop the current frame.
     */
    stop(): void;
    /**
     * Increment the number of times this symbol is called.
     * @param {number} id The id returned by idByName for a name symbol.
     */
    increment(id: number): void;
    /**
     * Find or create a ProfilerFrame-like object whose counter can be
     * incremented outside of the Profiler.
     * @param {number} id The id returned by idByName for a name symbol.
     * @param {*} arg The argument for a frame that identifies it in addition
     *   to the id.
     * @return {{count: number}} A ProfilerFrame-like whose count should be
     *   incremented for each call.
     */
    frame(id: number, arg: any): {
        count: number;
    };
    /**
     * Decode records and report all frames to `this.onFrame`.
     */
    reportFrames(): void;
    /**
     * Lookup or create an id for a frame name.
     * @param {string} name The name to return an id for.
     * @return {number} The id for the passed name.
     */
    idByName(name: string): number;
    /**
     * Reverse lookup the name from a given frame id.
     * @param {number} id The id to search for.
     * @return {string} The name for the given id.
     */
    nameById(id: number): string;
}
declare namespace Profiler {
    export { START, STOP, FrameCallback };
}
/**
 * Callback handle called by Profiler for each frame it decodes from its
 * records.
 * @callback FrameCallback
 * @param {ProfilerFrame} frame
 */
/**
 * A set of information about a frame of execution that was recorded.
 */
declare class ProfilerFrame {
    /**
     * @param {number} depth Depth of the frame in the recorded stack.
     */
    constructor(depth: number);
    /**
     * The numeric id of a record symbol like Runtime._step or
     * blockFunction.
     * @type {number}
     */
    id: number;
    /**
     * The amount of time spent inside the recorded frame and any deeper
     * frames.
     * @type {number}
     */
    totalTime: number;
    /**
     * The amount of time spent only inside this record frame. Not
     * including time in any deeper frames.
     * @type {number}
     */
    selfTime: number;
    /**
     * An arbitrary argument for the recorded frame. For example a block
     * function might record its opcode as an argument.
     * @type {*}
     */
    arg: any;
    /**
     * The depth of the recorded frame. This can help compare recursive
     * funtions that are recorded. Each level of recursion with have a
     * different depth value.
     * @type {number}
     */
    depth: number;
    /**
     * A summarized count of the number of calls to this frame.
     * @type {number}
     */
    count: number;
}
/**
 * Callback handle called by Profiler for each frame it decodes from its
 * records.
 */
type FrameCallback = (frame: ProfilerFrame) => any;
/**
 * The START event identifier in Profiler records.
 * @const {number}
 */
declare const START: 0;
/**
 * The STOP event identifier in Profiler records.
 * @const {number}
 */
declare const STOP: 1;
