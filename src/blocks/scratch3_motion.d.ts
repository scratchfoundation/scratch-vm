export = Scratch3MotionBlocks;
declare class Scratch3MotionBlocks {
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
    getMonitored(): {
        motion_xposition: {
            isSpriteSpecific: boolean;
            getId: (targetId: any) => string;
        };
        motion_yposition: {
            isSpriteSpecific: boolean;
            getId: (targetId: any) => string;
        };
        motion_direction: {
            isSpriteSpecific: boolean;
            getId: (targetId: any) => string;
        };
    };
    moveSteps(args: any, util: any): void;
    goToXY(args: any, util: any): void;
    getTargetXY(targetName: any, util: any): number[];
    goTo(args: any, util: any): void;
    turnRight(args: any, util: any): void;
    turnLeft(args: any, util: any): void;
    pointInDirection(args: any, util: any): void;
    pointTowards(args: any, util: any): void;
    glide(args: any, util: any): void;
    glideTo(args: any, util: any): void;
    ifOnEdgeBounce(args: any, util: any): void;
    setRotationStyle(args: any, util: any): void;
    changeX(args: any, util: any): void;
    setX(args: any, util: any): void;
    changeY(args: any, util: any): void;
    setY(args: any, util: any): void;
    getX(args: any, util: any): any;
    getY(args: any, util: any): any;
    getDirection(args: any, util: any): any;
    limitPrecision(coordinate: any): any;
}
