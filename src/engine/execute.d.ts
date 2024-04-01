export = execute;
/**
 * Execute a block.
 * @param {!import("./sequencer")} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 */
declare function execute(sequencer: import("./sequencer"), thread: Thread): void;
import Thread = require("./thread");
