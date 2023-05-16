const WorkerMessages = {
    ToVM: {
        PyodideLoading: "PyodideLoading",
        PyodideLoaded: "PyodideLoaded",
        PythonLoading: "PythonLoading",
        PythonRunning: "PythonRunning",
        PythonFinished: "PythonFinished",
        PythonError: "PythonError",
        BlockOP: "BlockOP",
        EndOfThread: "EndOfThread",
    },

    FromVM: {
        VMConnected: "VMConnected",
        InitPyodide: "InitPyodide",
        AsyncRun: "AsyncRun",
        ResultValue: "ResultValue",
    },
};

export default WorkerMessages;
