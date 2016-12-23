var test = require('tap').test;
var VirtualMachine = require('../../src/index');

var project = require('../fixtures/project_demo.json');

test('demo project', function (t) {
    var vm = new VirtualMachine();

    // Evaluate playground data and exit
    vm.on('playgroundData', function (e) {
        var threads = JSON.parse(e.threads);
        t.ok(threads.length > 0);
        t.end();
        process.nextTick(process.exit);
    });

    // Start VM, load project, and run
    t.doesNotThrow(function () {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(JSON.stringify(project));
        vm.greenFlag();
    });

    // After two seconds, get playground data and stop
    setTimeout(function () {
        vm.getPlaygroundData();
        vm.stopAll();
    }, 2000);
});
