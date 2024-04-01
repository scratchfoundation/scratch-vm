export = Scratch3CoreExample;
/**
 * An example core block implemented using the extension spec.
 * This is not loaded as part of the core blocks in the VM but it is provided
 * and used as part of tests.
 */
declare class Scratch3CoreExample {
    constructor(runtime: any);
    /**
     * The runtime instantiating this block package.
     * @type {Runtime}
     */
    runtime: Runtime;
    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo(): object;
    /**
     * Example opcode just returns the name of the stage target.
     * @returns {string} The name of the first target in the project.
     */
    exampleOpcode(): string;
    exampleWithInlineImage(): void;
}
