const path = require('path');
const tap = require('tap');
const test = tap.test;
const makeTestStorage = require('../fixtures/make-test-storage');
const {readFileToBuffer, extractProjectJson} = require('../fixtures/readProjectFile');
const VirtualMachine = require('../../src/index');
const sb2 = require('../../src/serialization/sb2');

const invisibleVideoMonitorProjectUri = path.resolve(__dirname, '../fixtures/invisible-video-monitor.sb2');
const invisibleVideoMonitorProject = readFileToBuffer(invisibleVideoMonitorProjectUri);

const visibleVideoMonitorProjectUri = path.resolve(
    __dirname, '../fixtures/visible-video-monitor-no-other-video-blocks.sb2');
const visibleVideoMonitorProject = readFileToBuffer(visibleVideoMonitorProjectUri);

const visibleVideoMonitorAndBlocksProjectUri = path.resolve(
    __dirname, '../fixtures/visible-video-monitor-and-video-blocks.sb2');
const visibleVideoMonitorAndBlocksProject = extractProjectJson(visibleVideoMonitorAndBlocksProjectUri);

const invisibleTempoMonitorProjectUri = path.resolve(
    __dirname, '../fixtures/invisible-tempo-monitor-no-other-music-blocks.sb2');
const invisibleTempoMonitorProject = readFileToBuffer(invisibleTempoMonitorProjectUri);

const visibleTempoMonitorProjectUri = path.resolve(
    __dirname, '../fixtures/visible-tempo-monitor-no-other-music-blocks.sb2');
const visibleTempoMonitorProject = readFileToBuffer(visibleTempoMonitorProjectUri);

test('loading sb2 project with invisible video monitor should not load monitor or extension', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(invisibleVideoMonitorProject).then(() => {
        t.equal(vm.extensionManager.isExtensionLoaded('videoSensing'), false);
        t.equal(vm.runtime._monitorState.size, 0);
        vm.quit();
        t.end();
    });
});

test('loading sb2 project with visible video monitor should not load extension', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(visibleVideoMonitorProject).then(() => {
        t.equal(vm.extensionManager.isExtensionLoaded('videoSensing'), false);
        t.equal(vm.runtime._monitorState.size, 0);
        vm.quit();
        t.end();
    });
});

// This test looks a little different than the rest because loading a project with
// the video sensing block requires a mock renderer and other setup, so instead
// we are just using deserialize to test what we need instead
test('sb2 project with video sensing blocks and monitor should load extension but not monitor', t => {
    const vm = new VirtualMachine();

    sb2.deserialize(visibleVideoMonitorAndBlocksProject, vm.runtime).then(project => {
        // Extension loads but monitor does not
        project.extensions.extensionIDs.has('videoSensing');
        // Non-core extension monitors haven't been added to the runtime
        t.equal(vm.runtime._monitorState.size, 0);
        t.end();
    });
});

test('sb2 project with invisible music monitor should not load monitor or extension', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(invisibleTempoMonitorProject).then(() => {
        t.equal(vm.extensionManager.isExtensionLoaded('music'), false);
        t.equal(vm.runtime._monitorState.size, 0);
        vm.quit();
        t.end();
    });
});

test('sb2 project with visible music monitor should load monitor and extension', t => {
    const vm = new VirtualMachine();
    vm.attachStorage(makeTestStorage());

    // Start VM, load project, and run
    vm.start();
    vm.clear();
    vm.setCompatibilityMode(false);
    vm.setTurboMode(false);
    vm.loadProject(visibleTempoMonitorProject).then(() => {
        t.equal(vm.extensionManager.isExtensionLoaded('music'), true);
        t.equal(vm.runtime._monitorState.size, 1);
        t.equal(vm.runtime._monitorState.has('music_getTempo'), true);
        t.equal(vm.runtime._monitorState.get('music_getTempo').visible, true);
        vm.quit();
        t.end();
    });
});
