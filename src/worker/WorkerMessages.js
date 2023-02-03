/**
 * All messages sent from the python worker to the vm in the main thread.
 */

var WorkerMessages = {

    /**
     * Messages that are sent to the vm from the python worker.
     * A message should have this form:
     * postMessage({
     *   id: ToRenderer.BlockFunction,
     *   targetID: 'targetID',
     *   op_code: 'motion_movesteps',
     *   args: {steps: '10'},
     *   token: 'uniqueString',
     *   ...
     * });
     * In general these messages correspond to a "block" of Scratch functionality. 
     * However, not all blocks are represented here, as some blocks are handled
     * by the fact that python itself is a language. Some blocks require responses 
     * from the VM/renderer.To handle these cases a token will be assigned to the
     * message to identify the request. The response will have the same token.
     * @enum {string}
     */
    ToVM: {
        PythonLoading: 'PythonLoading',
        PythonRunning: 'PythonRunning',
        PythonStopped: 'PythonStopped',
        BlockOP: 'BlockOP',
    },

    /**
     * Messages that are sent from the vm to the python worker.
     * A message will have this form:
     * postMessage({
     *   id: MessagesFromRenderer.ping,
     *   token: 'uniqueString',
     *   ...
     * });
     * If the message is being sent in reply to another message from the worker,
     * the 'token' property will match the originating message. Otherwise the
     * 'token' property will be undefined.
     * @enum {string}
     */
    FromVM: {
        /**
         * The VM has connected to this worker.
         */
        VMConnected: 'VMConnected',

        /**
         * The request for python text to be run.
         * Example:
         * postMessage({
         *  id: MessagesFromRenderer.AsyncRun,
         *  python: 'print("Hello World")',
         *  token: 'uniqueString',
         * });
         */
        AsyncRun: 'AsyncRun',

        /**
         * The message will contain a 'value' field with the result of the
         * request with matching token.
         */
        ResultValue: 'ResultValue'
    }


};

module.exports = WorkerMessages;