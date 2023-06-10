const WorkerMessages = {
    ToVM: {
        PyodideLoading: "PyodideLoading",
        PyodideLoaded: "PyodideLoaded",
        PythonLoading: "PythonLoading",
        PythonRunning: "PythonRunning",
        PythonFinished: "PythonFinished",
        PythonRuntimeError: "PythonRuntimeError",
        PythonCompileTimeError: "PythonCompileTimeError",
        BlockOP: "BlockOP",
        EndOfThread: "EndOfThread",
        ThreadsRegistered: "ThreadsRegistered",
    },

    FromVM: {
        VMConnected: "VMConnected",
        InitPyodide: "InitPyodide",
        RegisterThreads: "RegisterThreads",
        ResultValue: "ResultValue",
        StartThreads: "StartHats",
        InterruptThreads: "InterruptThreads",
    },
};

export default WorkerMessages;
