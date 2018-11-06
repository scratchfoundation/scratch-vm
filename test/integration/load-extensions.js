const path = require('path');
const test = require('tap').test;
const fs = require('fs');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

test('Load external extensions', async t => {
    const vm = new VirtualMachine();
    const fileList = fs.readdirSync('./test/fixtures/load-extensions/');
    const testFiles = fileList.filter(file => path.extname(file) === '.sb2' || path.extname(file) === '.sb3');

    // Test each example extension file
    for (const file of testFiles) {
        const ext = file.split('-')[0];
        const uri = path.resolve(__dirname, `../fixtures/load-extensions/${file}`);
        const project = readFileToBuffer(uri);

        await t.test('Confirm expected extension is installed in example sb2 projects', extTest => {
            vm.loadProject(project)
                .then(() => {
                    extTest.ok(vm.extensionManager.isExtensionLoaded(ext));
                    extTest.end();
                });
        });
    }
    t.end();
});
