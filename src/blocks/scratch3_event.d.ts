export = Scratch3EventBlocks;
declare class Scratch3EventBlocks {
    constructor(runtime: any);
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    runtime: Runtime;
    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives(): object<string, Function>;
    getHats(): {
        event_whenflagclicked: {
            restartExistingThreads: boolean;
        };
        event_whenkeypressed: {
            restartExistingThreads: boolean;
        };
        event_whenthisspriteclicked: {
            restartExistingThreads: boolean;
        };
        event_whentouchingobject: {
            restartExistingThreads: boolean;
            edgeActivated: boolean;
        };
        event_whenstageclicked: {
            restartExistingThreads: boolean;
        };
        event_whenbackdropswitchesto: {
            restartExistingThreads: boolean;
        };
        event_whengreaterthan: {
            restartExistingThreads: boolean;
            edgeActivated: boolean;
        };
        event_whenbroadcastreceived: {
            restartExistingThreads: boolean;
        };
    };
    touchingObject(args: any, util: any): any;
    hatGreaterThanPredicate(args: any, util: any): boolean;
    broadcast(args: any, util: any): void;
    broadcastAndWait(args: any, util: any): void;
}
