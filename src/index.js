const VirtualMachine = require('./virtual-machine');
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
    
if (process.title !== 'browser') {
    console.log(inputs)
    const host = inputs.host ? `${inputs.host}` : 'localhost';
    const port = inputs.port ? `${inputs.port}` : '1883';
    const gamePath = inputs.game ? `${inputs.game}` : `${process.cwd()}/game/DefaultGame.sb3`;

    const file = new File('DefaultGame.sb3', {
        name: 'DefaultGame.sb3',
        path: gamePath
    });
    const reader = new FileReader();

    reader.onload = () => {
        log.info(`Loading ${gamePath} to DefaultGame.sb3`);
        virtualMachine.loadProject(reader.result);
    };
    // params: (extensionId, peripheralId/connection address, port, userName, password)
    virtualMachine.connectMqtt('playspot', host, port, '', '');
    reader.onerror = error => {
        log.info('No DefaultGame.sb3, exiting');
        process.exit();
    };
    
    reader.readAsArrayBuffer(file);
}

virtualMachine.start();

module.exports = VirtualMachine;
