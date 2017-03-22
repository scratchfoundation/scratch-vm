var path = require('path');
var test = require('tap').test;
var extract = require('../fixtures/extract');
var VirtualMachine = require('../../src/index');

var projectUri = path.resolve(__dirname, '../fixtures/hat-execution-order.sb2');
var project = extract(projectUri);

test('complex', function (t) {
    var vm = new VirtualMachine();

    // Evaluate playground data and exit
    vm.on('playgroundData', function (e) {
        var threads = JSON.parse(e.threads);
        t.ok(threads.length === 0);

        var results = vm.runtime.targets[0].lists.results.contents;
        t.deepEqual(results, ['3', '2', '1', 'stage']);

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
