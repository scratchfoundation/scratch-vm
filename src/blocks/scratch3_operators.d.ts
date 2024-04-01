export = Scratch3OperatorsBlocks;
declare class Scratch3OperatorsBlocks {
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
    add(args: any): number;
    subtract(args: any): number;
    multiply(args: any): number;
    divide(args: any): number;
    lt(args: any): boolean;
    equals(args: any): boolean;
    gt(args: any): boolean;
    and(args: any): boolean;
    or(args: any): boolean;
    not(args: any): boolean;
    random(args: any): number;
    join(args: any): string;
    letterOf(args: any): string;
    length(args: any): number;
    contains(args: any): boolean;
    mod(args: any): number;
    round(args: any): number;
    mathop(args: any): number;
}
