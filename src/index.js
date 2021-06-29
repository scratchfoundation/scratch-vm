const VirtualMachine = require('./virtual-machine');
const Runtime = require('./engine/runtime');
const FileReader = require('filereader');
const File = require('file-class');
const minilog = require('minilog');
const log = minilog('standalone-vm');
const {Command} = require('commander');
minilog.enable();

const program = new Command();
program
    .option('-h, --host [address]', 'connection address')
    .option('-p, --port [number]', 'mqtt port')
    .option('-g, --game [filepath]', 'path to game');
program.parse(process.argv);
const inputs = program.opts();
    
const virtualMachine = new VirtualMachine();
    
if (process.title === 'browser') {

    virtualMachine.start();

} else {

    const reader = new FileReader();
    
    const host = inputs.host ? `${inputs.host}` : 'localhost';
    const port = inputs.port ? `${inputs.port}` : '1883';
    const gamePath = inputs.game ? `${inputs.game}` : `${process.cwd()}/game/DefaultGame.sb3`;
    // params: (extensionId, peripheralId/connection address, port, userName, password)
    
    const file = new File('DefaultGame.sb3', {
        name: 'DefaultGame.sb3',
        path: gamePath
    });

    reader.onload = () => {
        log.info(`Loading ${gamePath}`);
        virtualMachine.loadProject(reader.result);
    };

    reader.onerror = error => {
        log.info('No DefaultGame.sb3, exiting');
        process.exit();
    };

    virtualMachine.runtime.on(Runtime.TARGETS_UPDATE, () => {
        virtualMachine.connectMqtt('playspot', host, port, '', '');
    });

    virtualMachine.runtime.on(Runtime.RUNTIME_STARTED, () => {
        reader.readAsArrayBuffer(file);
    });

    virtualMachine.runtime.on(Runtime.CLIENT_CONNECTED, () => {
        virtualMachine.runtime.emit('START_GAME');
    });

    virtualMachine.start();
}


module.exports = VirtualMachine;
