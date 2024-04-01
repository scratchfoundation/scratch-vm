export = Scratch3SensingBlocks;
declare class Scratch3SensingBlocks {
    constructor(runtime: any);
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    runtime: Runtime;
    /**
     * The "answer" block value.
     * @type {string}
     */
    _answer: string;
    /**
     * The timer utility.
     * @type {Timer}
     */
    _timer: Timer;
    /**
     * The stored microphone loudness measurement.
     * @type {number}
     */
    _cachedLoudness: number;
    /**
     * The time of the most recent microphone loudness measurement.
     * @type {number}
     */
    _cachedLoudnessTimestamp: number;
    /**
     * The list of queued questions and respective `resolve` callbacks.
     * @type {!Array}
     */
    _questionList: any[];
    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives(): object<string, Function>;
    getMonitored(): {
        sensing_answer: {
            getId: () => string;
        };
        sensing_loudness: {
            getId: () => string;
        };
        sensing_timer: {
            getId: () => string;
        };
        sensing_current: {
            getId: (_: any, fields: any) => string;
        };
    };
    _onAnswer(answer: any): void;
    _resetAnswer(): void;
    _enqueueAsk(question: any, resolve: any, target: any, wasVisible: any, wasStage: any): void;
    _askNextQuestion(): void;
    _clearAllQuestions(): void;
    _clearTargetQuestions(stopTarget: any): void;
    askAndWait(args: any, util: any): Promise<any>;
    getAnswer(): string;
    touchingObject(args: any, util: any): any;
    touchingColor(args: any, util: any): any;
    colorTouchingColor(args: any, util: any): any;
    distanceTo(args: any, util: any): number;
    setDragMode(args: any, util: any): void;
    getTimer(args: any, util: any): any;
    resetTimer(args: any, util: any): void;
    getMouseX(args: any, util: any): any;
    getMouseY(args: any, util: any): any;
    getMouseDown(args: any, util: any): any;
    current(args: any): number;
    getKeyPressed(args: any, util: any): any;
    daysSince2000(): number;
    getLoudness(): number;
    isLoud(): boolean;
    getAttributeOf(args: any): any;
    getUsername(args: any, util: any): any;
}
import Timer = require("../util/timer");
