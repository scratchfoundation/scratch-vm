/**
 * @callback FetchFunction
 * @param {RequestInfo|URL} input
 * @param {RequestInit|undefined} [init]
 * @returns {Promise<Response>}
 */

/**
 * @type {FetchFunction}
 */
let myFetch = global.fetch;

/**
 * Tell `fetchWithTimeout` to use a specific `fetch` function.
 * By default, `fetchWithTimeout` will use the global `fetch` function.
 * If there is no global `fetch`, then `fetchWithTimeout` will fail unless provided with an alternative.
 * @param {FetchFunction} newFetch The new `fetch` function to use within fetchWithTimeout.
 */
const setFetch = newFetch => {
    myFetch = newFetch;
};

/**
 * Fetch a remote resource like `fetch` does, but with a time limit.
 * @param {Request|string} resource Remote resource to fetch.
 * @param {?object} init An options object containing any custom settings that you want to apply to the request.
 * @param {number} timeout The amount of time before the request is canceled, in milliseconds
 * @returns {Promise<Response>} The response from the server.
 */
const fetchWithTimeout = (resource, init, timeout) => {
    let timeoutID = null;
    // Not supported in Safari <11
    const controller = window.AbortController ? new window.AbortController() : null;
    const signal = controller ? controller.signal : null;
    // The fetch call races a timer.
    return Promise.race([
        myFetch(resource, Object.assign({signal}, init)).then(response => {
            clearTimeout(timeoutID);
            return response;
        }),
        new Promise((resolve, reject) => {
            timeoutID = setTimeout(() => {
                if (controller) controller.abort();
                reject(new Error(`Fetch timed out after ${timeout} ms`));
            }, timeout);
        })
    ]);
};

module.exports = {
    fetchWithTimeout,
    setFetch
};
