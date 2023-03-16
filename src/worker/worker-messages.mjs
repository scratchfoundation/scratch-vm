
const WorkerMessages = {


    ToVM: {
        PyodideLoading: 'PyodideLoading',
        PyodideLoaded: 'PyodideLoaded',
        PythonRunning: 'PythonRunning',
        PythonStopped: 'PythonStopped',
        BlockOP: 'BlockOP',
    },

    FromVM: {

        VMConnected: 'VMConnected',
        InitPyodide: 'InitPyodide',
        AsyncRun: 'AsyncRun',
        ResultValue: 'ResultValue'
    }


};

export default WorkerMessages;