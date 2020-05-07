/**
 * @fileoverview
 * A way to profile Scratch internal performance. Like what blocks run during a
 * step? How much time do they take? How much time is spent inbetween blocks?
 *
 * Profiler aims for to spend as little time inside its functions while
 * recording. For this it has a simple internal record structure that records a
 * series of values for each START and STOP event in a single array. This lets
 * all the values be pushed in one call for the array. This simplicity allows
 * the contents of the start() and stop() calls to be inlined in areas that are
 * called frequently enough to want even greater performance from Profiler so
 * what is recorded better reflects on the profiled code and not Profiler
 * itself.
 */

/**
 * The next id returned for a new profile'd function.
 * @type {number}
 */
let nextId = 0;

/**
 * The mapping of names to ids.
 * @const {Object.<string, number>}
 */
const profilerNames = {};

/**
 * The START event identifier in Profiler records.
 * @const {number}
 */
const START = 0;

/**
 * The STOP event identifier in Profiler records.
 * @const {number}
 */
const STOP = 1;

/**
 * The number of cells used in the records array by a START event.
 * @const {number}
 */
const START_SIZE = 4;

/**
 * The number of cells used in the records array by a STOP event.
 * @const {number}
 */
const STOP_SIZE = 2;

/**
 * Stored reference to Performance instance provided by the Browser.
 * @const {Performance}
 */
const performance = typeof window === 'object' && window.performance;


/**
 * Callback handle called by Profiler for each frame it decodes from its
 * records.
 * @callback FrameCallback
 * @param {ProfilerFrame} frame
 */

/**
 * A set of information about a frame of execution that was recorded.
 */
class ProfilerFrame {
    /**
     * @param {number} depth Depth of the frame in the recorded stack.
     */
    constructor (depth) {
        /**
         * The numeric id of a record symbol like Runtime._step or
         * blockFunction.
         * @type {number}
         */
        this.id = -1;

        /**
         * The amount of time spent inside the recorded frame and any deeper
         * frames.
         * @type {number}
         */
        this.totalTime = 0;

        /**
         * The amount of time spent only inside this record frame. Not
         * including time in any deeper frames.
         * @type {number}
         */
        this.selfTime = 0;

        /**
         * An arbitrary argument for the recorded frame. For example a block
         * function might record its opcode as an argument.
         * @type {*}
         */
        this.arg = null;

        /**
         * The depth of the recorded frame. This can help compare recursive
         * funtions that are recorded. Each level of recursion with have a
         * different depth value.
         * @type {number}
         */
        this.depth = depth;

        /**
         * A summarized count of the number of calls to this frame.
         * @type {number}
         */
        this.count = 0;
    }
}

class Profiler {
    /**
     * @param {FrameCallback} onFrame a handle called for each recorded frame.
     * The passed frame value may not be stored as it'll be updated with later
     * frame information. Any information that is further stored by the handler
     * should make copies or reduce the information.
     */
    constructor (onFrame = function () {}) {
        /**
         * A series of START and STOP values followed by arguments. After
         * recording is complete the full set of records is reported back by
         * stepping through the series to connect the relative START and STOP
         * information.
         * @type {Array.<*>}
         */
        this.records = [];

        /**
         * An array of frames incremented on demand instead as part of start
         * and stop.
         * @type {Array.<ProfilerFrame>}
         */
        this.increments = [];

        /**
         * An array of profiler frames separated by counter argument. Generally
         * for Scratch these frames are separated by block function opcode.
         * This tracks each time an opcode is called.
         * @type {Array.<ProfilerFrame>}
         */
        this.counters = [];

        /**
         * A frame with no id or argument.
         * @type {ProfilerFrame}
         */
        this.nullFrame = new ProfilerFrame(-1);

        /**
         * A cache of ProfilerFrames to reuse when reporting the recorded
         * frames in records.
         * @type {Array.<ProfilerFrame>}
         */
        this._stack = [new ProfilerFrame(0)];

        /**
         * A callback handle called with each decoded frame when reporting back
         * all the recorded times.
         * @type {FrameCallback}
         */
        this.onFrame = onFrame;

        /**
         * A reference to the START record id constant.
         * @const {number}
         */
        this.START = START;

        /**
         * A reference to the STOP record id constant.
         * @const {number}
         */
        this.STOP = STOP;
    }

    /**
     * Start recording a frame of time for an id and optional argument.
     * @param {number} id The id returned by idByName for a name symbol like
     * Runtime._step.
     * @param {?*} arg An arbitrary argument value to store with the frame.
     */
    start (id, arg) {
        this.records.push(START, id, arg, performance.now());
    }

    /**
     * Stop the current frame.
     */
    stop () {
        this.records.push(STOP, performance.now());
    }

    /**
     * Increment the number of times this symbol is called.
     * @param {number} id The id returned by idByName for a name symbol.
     */
    increment (id) {
        if (!this.increments[id]) {
            this.increments[id] = new ProfilerFrame(-1);
            this.increments[id].id = id;
        }
        this.increments[id].count += 1;
    }

    /**
     * Find or create a ProfilerFrame-like object whose counter can be
     * incremented outside of the Profiler.
     * @param {number} id The id returned by idByName for a name symbol.
     * @param {*} arg The argument for a frame that identifies it in addition
     *   to the id.
     * @return {{count: number}} A ProfilerFrame-like whose count should be
     *   incremented for each call.
     */
    frame (id, arg) {
        for (let i = 0; i < this.counters.length; i++) {
            if (this.counters[i].id === id && this.counters[i].arg === arg) {
                return this.counters[i];
            }
        }

        const newCounter = new ProfilerFrame(-1);
        newCounter.id = id;
        newCounter.arg = arg;
        this.counters.push(newCounter);
        return newCounter;
    }

    /**
     * Decode records and report all frames to `this.onFrame`.
     */
    reportFrames () {
        const stack = this._stack;
        let depth = 1;

        // Step through the records and initialize Frame instances from the
        // START and STOP events. START and STOP events are separated by events
        // for deeper frames run by higher frames. Frames are stored on a stack
        // and reinitialized for each START event. When a stop event is reach
        // the Frame for the current depth has its final values stored and its
        // passed to the current onFrame callback. This way Frames are "pushed"
        // for each START event and "popped" for each STOP and handed to an
        // outside handle to any desired reduction of the collected data.
        for (let i = 0; i < this.records.length;) {
            if (this.records[i] === START) {
                if (depth >= stack.length) {
                    stack.push(new ProfilerFrame(depth));
                }

                // Store id, arg, totalTime, and initialize selfTime.
                const frame = stack[depth++];
                frame.id = this.records[i + 1];
                frame.arg = this.records[i + 2];
                // totalTime is first set as the time recorded by this START
                // event. Once the STOP event is reached the stored start time
                // is subtracted from the recorded stop time. The resulting
                // difference is the actual totalTime, and replaces the start
                // time in frame.totalTime.
                //
                // totalTime is used this way as a convenient member to store a
                // value between the two events without needing additional
                // members on the Frame or in a shadow map.
                frame.totalTime = this.records[i + 3];
                // selfTime is decremented until we reach the STOP event for
                // this frame. totalTime will be added to it then to get the
                // time difference.
                frame.selfTime = 0;

                i += START_SIZE;
            } else if (this.records[i] === STOP) {
                const now = this.records[i + 1];

                const frame = stack[--depth];
                // totalTime is the difference between the start event time
                // stored in totalTime and the stop event time pulled from this
                // record.
                frame.totalTime = now - frame.totalTime;
                // selfTime is the difference of this frame's totalTime and the
                // sum of totalTime of deeper frames.
                frame.selfTime += frame.totalTime;

                // Remove this frames totalTime from the parent's selfTime.
                stack[depth - 1].selfTime -= frame.totalTime;

                // This frame occured once.
                frame.count = 1;

                this.onFrame(frame);

                i += STOP_SIZE;
            } else {
                this.records.length = 0;
                throw new Error('Unable to decode Profiler records.');
            }
        }

        for (let j = 0; j < this.increments.length; j++) {
            if (this.increments[j] && this.increments[j].count > 0) {
                this.onFrame(this.increments[j]);
                this.increments[j].count = 0;
            }
        }

        for (let k = 0; k < this.counters.length; k++) {
            if (this.counters[k].count > 0) {
                this.onFrame(this.counters[k]);
                this.counters[k].count = 0;
            }
        }

        this.records.length = 0;
    }

    /**
     * Lookup or create an id for a frame name.
     * @param {string} name The name to return an id for.
     * @return {number} The id for the passed name.
     */
    idByName (name) {
        return Profiler.idByName(name);
    }

    /**
     * Reverse lookup the name from a given frame id.
     * @param {number} id The id to search for.
     * @return {string} The name for the given id.
     */
    nameById (id) {
        return Profiler.nameById(id);
    }

    /**
     * Lookup or create an id for a frame name.
     * @static
     * @param {string} name The name to return an id for.
     * @return {number} The id for the passed name.
     */
    static idByName (name) {
        if (typeof profilerNames[name] !== 'number') {
            profilerNames[name] = nextId++;
        }
        return profilerNames[name];
    }

    /**
     * Reverse lookup the name from a given frame id.
     * @static
     * @param {number} id The id to search for.
     * @return {string} The name for the given id.
     */
    static nameById (id) {
        for (const name in profilerNames) {
            if (profilerNames[name] === id) {
                return name;
            }
        }
        return null;
    }

    /**
     * Profiler is only available on platforms with the Performance API.
     * @return {boolean} Can the Profiler run in this browser?
     */
    static available () {
        return (
            typeof window === 'object' &&
            typeof window.performance !== 'undefined');
    }
}


/**
 * A reference to the START record id constant.
 * @const {number}
 */
Profiler.START = START;

/**
 * A reference to the STOP record id constant.
 * @const {number}
 */
Profiler.STOP = STOP;

module.exports = Profiler;
