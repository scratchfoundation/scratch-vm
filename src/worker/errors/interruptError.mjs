class InterruptError extends Error {
    constructor(message) {
        super(message);
        this.name = "InterruptError";
    }
}

export default InterruptError;
