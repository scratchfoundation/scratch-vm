const path = require('path');
const tap = require('tap');
const {test} = tap;
const fs = require('fs');
const readFileToBuffer = require('../fixtures/readProjectFile').readFileToBuffer;
const dispatch = require('../../src/dispatch/central-dispatch');
const VirtualMachine = require('../../src/index');

/**
 * Call _stopLoop() on the Video Sensing extension.
 * @param {VirtualMachine} vm - a VM instance which has loaded the 'videoSensing' extension.
 */
const stopVideoLoop = vm => {
    // TODO: provide a general way to tell extensions to shut down
    // Ideally we'd just dispose of the extension's Worker...
    const serviceName = vm.extensionManager._loadedExtensions.get('videoSensing');
    dispatch.call(serviceName, '_stopLoop');
};

test('Load external extensions', async t => {
    const vm = new VirtualMachine();
    const testFiles = fs.readdirSync('./test/fixtures/load-extensions/confirm-load/');

    // Test each example extension file
    for (const file of testFiles) {
        const ext = file.split('-')[0];
        const uri = path.resolve(__dirname, `../fixtures/load-extensions/confirm-load/${file}`);
        const project = readFileToBuffer(uri);

        await t.test('Confirm expected extension is installed in example sb2 and sb3 projects', extTest => {
            vm.loadProject(project)
                .then(() => {
                    extTest.ok(vm.extensionManager.isExtensionLoaded(ext));
                    extTest.end();
                });
        });
    }

    stopVideoLoop(vm);
    vm.quit();
    t.end();
});

test('Load video sensing extension and video properties', async t => {
    const vm = new VirtualMachine();
    // An array of test projects and their expected video state values
    const testProjects = [
        {
            file: 'videoState-off.sb2',
            videoState: 'off',
            videoTransparency: 50,
            mirror: undefined
        },
        {
            file: 'videoState-on-transparency-0.sb2',
            videoState: 'on',
            videoTransparency: 0,
            mirror: true
        }];

    for (const project of testProjects) {
        const uri = path.resolve(__dirname, `../fixtures/load-extensions/video-state/${project.file}`);
        const projectData = readFileToBuffer(uri);

        await vm.loadProject(projectData);

        const stage = vm.runtime.getTargetForStage();

        t.ok(vm.extensionManager.isExtensionLoaded('videoSensing'));

        // Check that the stage target has the video state values we expect
        // based on the test project files, then check that the video io device
        // has the expected state as well
        t.equal(stage.videoState, project.videoState);
        t.equal(vm.runtime.ioDevices.video.mirror, project.mirror);
        t.equal(stage.videoTransparency, project.videoTransparency);
        t.equal(vm.runtime.ioDevices.video._ghost, project.videoTransparency);
    }

    stopVideoLoop(vm);
    vm.quit();
    t.end();
});
