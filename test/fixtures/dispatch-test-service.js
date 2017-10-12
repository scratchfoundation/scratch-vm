class DispatchTestService {
    returnFortyTwo () {
        return 42;
    }

    doubleArgument (x) {
        return 2 * x;
    }

    throwException () {
        throw new Error('This is a test exception thrown by DispatchTest');
    }
}

module.exports = DispatchTestService;
