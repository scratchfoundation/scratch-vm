export = Scratch3ControlBlocks;
declare class Scratch3ControlBlocks {
    constructor(runtime: any);
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    runtime: Runtime;
    /**
     * The "counter" block value. For compatibility with 2.0.
     * @type {number}
     */
    _counter: number;
    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives(): object<string, Function>;
    getHats(): {
        control_start_as_clone: {
            restartExistingThreads: boolean;
        };
    };
    repeat(args: any, util: any): void;
    repeatUntil(args: any, util: any): void;
    repeatWhile(args: any, util: any): void;
    forEach(args: any, util: any): void;
    waitUntil(args: any, util: any): void;
    forever(args: any, util: any): void;
    wait(args: any, util: any): void;
    if(args: any, util: any): void;
    ifElse(args: any, util: any): void;
    stop(args: any, util: any): void;
    createClone(args: any, util: any): void;
    deleteClone(args: any, util: any): void;
    getCounter(): number;
    clearCounter(): void;
    incrCounter(): void;
    allAtOnce(args: any, util: any): void;
}
