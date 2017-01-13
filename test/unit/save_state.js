var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var VirtualMachine = require('../../src/index');

var uri = path.resolve(__dirname, '../fixtures/default.json');
var file = fs.readFileSync(uri, 'utf8');

test('save state', function (t) {
    var vm = new VirtualMachine();

    // Start VM, load project, and run
    t.doesNotThrow(function () {
        vm.start();
        vm.clear();
        vm.setCompatibilityMode(false);
        vm.setTurboMode(false);
        vm.loadProject(file);
        var value = vm.testJSON();
    });

    t.ok(value);
    t.end();
    process.nextTick(process.exit);
});
