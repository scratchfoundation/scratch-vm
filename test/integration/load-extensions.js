const path = require('path');
const test = require('tap').test;
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const VirtualMachine = require('../../src/index');

const sb2Extensions = {
    // pen: 'load-pen.sb2',
    // music: 'load-music.sb2',
    pen: 'dolphin-pen-test.sb2'
    // TODO: add sample projects for video sensing, wedo 2.0, others?
};

const sb3Extensions = {
    // pen: 'load-pen.sb3',
    // music: 'load-music.sb3',
    pen: 'dolphin-pen-test.sb3'
    // TODO: add sample projects for video sensing, text-to-speech, translate, micro:bit, mindstorms
};

test('Load sb2 external extensions', async t => {
    const vm = new VirtualMachine();

    // Test each example extension file
    for (const ext in sb2Extensions) {
        const uri = path.resolve(__dirname, `../fixtures/load-extensions/${sb2Extensions[ext]}`);
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

test('Load sb3 external extensions', async t => {
    const vm = new VirtualMachine();

    // Test each example extension file
    for (const ext in sb3Extensions) {
        const uri = path.resolve(__dirname, `../fixtures/load-extensions/${sb3Extensions[ext]}`);
        const project = readFileToBuffer(uri);

        await t.test('Confirm expected extension is installed in example sb3 projects', extTest => {
            vm.loadProject(project)
                .then(() => {
                    extTest.ok(vm.extensionManager.isExtensionLoaded(ext));
                    extTest.end();
                });
        });
    }
    t.end();
});
