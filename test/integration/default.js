var test = require('tap').test;
var VirtualMachine = require('../../src/index');

var project = require('../fixtures/project_default.json');

test('load default project & run', function (t) {
    var vm = new VirtualMachine();
    t.doesNotThrow(function () {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(true);
        vm.setTurboMode(false);
        vm.loadProject(JSON.stringify(project));
        vm.greenFlag();
        vm.stopAll();
    });
    t.
    t.end();
    process.nextTick(process.exit);
});
