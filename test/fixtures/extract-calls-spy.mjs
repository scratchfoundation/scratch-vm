/* Extracts all worker messages from spy calls into array
 * Also reverses them for ease of access so the last call to the spy would be returnedArr[0]
 */
function extractCallsSpy(spy) {
    const workerCalls = [];
    spy.getCalls().forEach((call) => {
        workerCalls.unshift(call.firstArg);
    });
    return workerCalls;
}

export default extractCallsSpy;
