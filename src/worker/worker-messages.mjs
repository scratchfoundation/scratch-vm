const WorkerMessages = {
    ToVM: {
        PyodideLoading: "PyodideLoading",
        PyodideLoaded: "PyodideLoaded",
        PythonLoading: "PythonLoading",
        PythonRunning: "PythonRunning",
        PythonFinished: "PythonFinished",
        PythonError: "PythonRuntimeError",
        PythonCompileTimeError: "PythonCompileTimeError",
        BlockOP: "BlockOP",
        EndOfThread: "EndOfThread",
        PromiseLoaded: "ThreadsRegistered",
    },

    FromVM: {
        VMConnected: "VMConnected",
        InitPyodide: "InitPyodide",
        LoadThread: "LoadThread",
        ResultValue: "ResultValue",
        StartThread: "StartThread",
        InterruptThread: "InterruptThread",
    },
};

export default WorkerMessages;
