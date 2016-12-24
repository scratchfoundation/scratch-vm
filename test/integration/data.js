var test = require('tap').test;
var extract = require('../fixtures/extract');
var VirtualMachine = require('../../src/index');

var path = __dirname + '/../fixtures/data.sb2';
var project = extract(path);

test('data project', function (t) {
    var vm = new VirtualMachine();

    // Evaluate playground data and exit
    vm.on('playgroundData', function () {
        // @todo Additional tests
        t.end();
        process.nextTick(process.exit);
    });

    // Start VM, load project, and run
    t.doesNotThrow(function () {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(project);
        vm.greenFlag();
    });

    // After two seconds, get playground data and stop
    setTimeout(function () {
        vm.getPlaygroundData();
        vm.stopAll();
    }, 2000);
});
