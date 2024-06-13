import Cast from "../util/cast.mjs";
import MathUtil from "../util/math-util.mjs";
import Timer from "../util/timer.mjs";

export default class PatchCoreBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives() {
        return {
            core_endthread: this.endThread,
            core_fetch: this.fetch
        };
    }

    endThread(args, util) {
        util.endThread();
    }

    fetch(args, util){
        const url = Cast.toString(args.URL);
        const method = Cast.toString(args.METHOD || 'GET');
        const headers = args.HEADERS || {};
        const body = args.BODY || {};

        const fetchOptions = {
            method: method,
            headers: headers,
        }
        // conditionally add body to fetch options
        if (method === 'POST' || method === 'PUT') {
            fetchOptions.body = body;
        }

        const response = fetch(url, fetchOptions).then(res => res.json()).then(data => data).catch(error => error);
        return response;
    }
}
