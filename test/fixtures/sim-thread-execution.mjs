import Thread from "../../src/engine/thread.mjs";
import Runtime from "../../src/engine/runtime.mjs";

async function simThreadExecution(target, opcode, args) {
    let done = false;
    const thread = new Thread(target, (token, returnValue) => {
        done = true;
    });

    thread.pushOp(opcode, args);

    const start = performance.now();
    await new Promise((resolve) => {
        const interval = setInterval(() => {
            if (!done) {
                thread.step();
            } else {
                clearInterval(interval);
                resolve();
            }
        }, Runtime.THREAD_STEP_INTERVAL);
    });
    const secs = (performance.now() - start) / 1000;

    return secs;
}

export default simThreadExecution;
