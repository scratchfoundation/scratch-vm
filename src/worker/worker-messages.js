
let WorkerMessages = {


    ToVM: {
        PyodideLoading: 'PyodideLoading',
        PyodideLoaded: 'PyodideLoaded',
        PythonRunning: 'PythonRunning',
        PythonStopped: 'PythonStopped',
        BlockOP: 'BlockOP',
    },

    FromVM: {

        VMConnected: 'VMConnected',


        AsyncRun: 'AsyncRun',

        ResultValue: 'ResultValue'
    }


};

module.exports = WorkerMessages;